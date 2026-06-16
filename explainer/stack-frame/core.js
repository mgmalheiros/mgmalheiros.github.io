//
//  core.js — semantic analysis, bytecode generation, and the step-by-step
//  bytecode interpreter for the stack-frame explainer.
//
//  This file has no DOM dependencies so it can be unit-tested under Node.
//  It is loaded both via require() (tests) and via a plain <script> tag
//  (browser, where it attaches to window.StackCore).
//
"use strict";

// A lark.js parse tree node is a Tree when it has a `children` array;
// otherwise it is a Token (a String subclass carrying .type/.value/.line).
function isTree(n) {
  return n && typeof n === "object" && Array.isArray(n.children);
}

// -------------------------------------------------------------------------
// Semantic analysis + bytecode generation
// -------------------------------------------------------------------------
//
// Scope rules (static scoping):
//   * redeclaring a name (var or function) in the same scope is an error;
//   * shadowing a name from an enclosing scope is allowed;
//   * a name must be declared before it is used (source order);
//   * functions follow the same visibility rule as variables.
//
// Returns { errors:[{line,msg}], model, bytecode }.
//   model.functions[name] = { name, parent, vars:[...] }
//     - name:   'global', 'f()', 'g()', ...
//     - parent: lexically-enclosing scope name (null for global) -> static link
//     - vars:   local variable names in definition order
//
function analyzeProgram(tree) {
  const ctx = {
    scopes: [],        // active lexical scope stack (top = last)
    buffers: new Map(),// scopeName -> [instruction strings]  (persists after pop)
    model: {},         // scopeName -> { name, parent, vars }
    emitOrder: [],     // scope names in order of first emitted instruction
    createOrder: [],   // function scope names in lexical creation order
    errors: [],
  };

  // global scope
  const globalScope = { name: "global", parent: null, declared: new Map(), vars: [] };
  ctx.scopes.push(globalScope);
  ctx.buffers.set("global", []);
  ctx.model["global"] = { name: "global", parent: null, vars: globalScope.vars };

  walk(tree, ctx);

  const bytecode = assemble(ctx);
  return { errors: ctx.errors, model: { functions: ctx.model }, bytecode };
}

function topScope(ctx) {
  return ctx.scopes[ctx.scopes.length - 1];
}

function emit(ctx, instruction) {
  const s = topScope(ctx);
  ctx.buffers.get(s.name).push(instruction);
  if (!ctx.emitOrder.includes(s.name)) ctx.emitOrder.push(s.name);
}

// pre-order walk mirroring the reference analyzer: handle the node, then
// recurse into child trees in source order. The empty `end` rule, visited
// last among a function's children, triggers the scope pop.
function walk(node, ctx) {
  if (!isTree(node)) return;
  switch (String(node.data)) {
    case "function":    enterFunction(node, ctx); break;
    case "end":         ctx.scopes.pop();         break;
    case "definition":  doDefinition(node, ctx);  break;
    case "attribution": doAttribution(node, ctx); break;
    case "call":        doCall(node, ctx);        break;
    // 'program' and 'statement' are transparent containers
  }
  for (const child of node.children) {
    if (isTree(child)) walk(child, ctx);
  }
}

function enterFunction(node, ctx) {
  const tok = node.children[0];          // NAME
  const name = tok.value, line = tok.line;
  const parent = topScope(ctx);
  const scopeName = name + "()";
  if (parent.declared.has(name)) {
    ctx.errors.push({ line, msg: `redefinition of '${name}' in scope ${parent.name}` });
  } else {
    parent.declared.set(name, "fun");
  }
  const scope = { name: scopeName, parent: parent.name, declared: new Map(), vars: [] };
  ctx.scopes.push(scope);
  if (!ctx.buffers.has(scopeName)) ctx.buffers.set(scopeName, []);
  ctx.model[scopeName] = { name: scopeName, parent: parent.name, vars: scope.vars };
  if (!ctx.createOrder.includes(scopeName)) ctx.createOrder.push(scopeName);
}

function doDefinition(node, ctx) {
  const tok = node.children[0];          // NAME
  const name = tok.value, line = tok.line;
  const scope = topScope(ctx);
  if (scope.declared.has(name)) {
    ctx.errors.push({ line, msg: `redefinition of '${name}' in scope ${scope.name}` });
  } else {
    scope.declared.set(name, "var");
    scope.vars.push(name);
  }
}

// look up a name through the scope chain (innermost first)
function lookup(ctx, name) {
  for (let i = ctx.scopes.length - 1; i >= 0; i--) {
    const s = ctx.scopes[i];
    if (s.declared.has(name)) return { scope: s, kind: s.declared.get(name) };
  }
  return null;
}

function doAttribution(node, ctx) {
  const nameTok = node.children[0];      // NAME
  const numTok = node.children[1];       // NUMBER
  const name = nameTok.value, value = numTok.value, line = nameTok.line;
  const hit = lookup(ctx, name);
  if (!hit) {
    ctx.errors.push({ line, msg: `assignment to undeclared variable '${name}'` });
  } else if (hit.kind !== "var") {
    ctx.errors.push({ line, msg: `'${name}' is a function, not a variable` });
  } else {
    emit(ctx, `set ${hit.scope.name}:${name} ${value}`);
  }
}

function doCall(node, ctx) {
  const tok = node.children[0];          // NAME
  const name = tok.value, line = tok.line;
  const hit = lookup(ctx, name);
  if (!hit) {
    ctx.errors.push({ line, msg: `call to undeclared function '${name}'` });
  } else if (hit.kind !== "fun") {
    ctx.errors.push({ line, msg: `'${name}' is a variable, not a function` });
  } else {
    emit(ctx, `sub ${name}()`);
  }
}

// Output order: functions in order of first emission, then any declared but
// never-emitted functions in lexical order, with `global` always last.
function assemble(ctx) {
  let order = ctx.emitOrder.slice();
  for (const name of ctx.createOrder) if (!order.includes(name)) order.push(name);
  order = order.filter((n) => n !== "global");
  order.push("global");

  const out = [];
  for (const name of order) {
    out.push("fun " + name);
    for (const ins of (ctx.buffers.get(name) || [])) out.push(ins);
    out.push("ret");
    out.push("");
  }
  return out.join("\n").trim();
}

// -------------------------------------------------------------------------
// Bytecode interpreter (step recorder)
// -------------------------------------------------------------------------
//
// Builds the complete execution trace up front so Back/Forward/Continue are
// just index moves. Assumes non-recursive programs.
//
// model: result of analyzeProgram (used for frame variable layout and the
//        lexical parent that determines each static link). May be null/partial
//        when the bytecode was hand-edited; missing pieces degrade gracefully.
//
// Returns { trace, lines, error }.
//   lines : the bytecode split into addressable lines (index == address)
//   trace : [{ pc, stack, note }]  taken before each executed instruction,
//           plus a final 'finished' snapshot.
//     frame = { name, ret, link, vars:[{name,value}] }
//       ret  : return address (line index) or null for global
//       link : index in the stack of the static-link target frame, or null
//
function simulate(bytecodeText, model) {
  const fns = (model && model.functions) || {};
  const lines = bytecodeText.split("\n");

  // map function entry points (address of first line after `fun NAME`)
  const entry = {};
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("fun ")) entry[t.slice(4).trim()] = i + 1;
  }
  if (entry["global"] === undefined) {
    return { trace: [], lines, error: "no 'global' function defined in the bytecode" };
  }

  const stack = [];
  const trace = [];

  function lexicalParent(name) {
    if (fns[name] && fns[name].parent !== undefined) return fns[name].parent;
    return name === "global" ? null : "global";
  }

  function pushFrame(name, ret) {
    const parent = lexicalParent(name);
    let link = null;
    if (parent !== null) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === parent) { link = i; break; }
      }
    }
    const declared = (fns[name] && fns[name].vars) || [];
    const vars = declared.map((v) => ({ name: v, value: undefined }));
    stack.push({ name, ret, link, vars });
  }

  function setVar(scope, varname, value) {
    // resolve the target frame by following the static-link chain
    let cur = stack.length - 1;
    while (cur !== null && cur >= 0) {
      const frame = stack[cur];
      if (frame.name === scope) {
        let v = frame.vars.find((x) => x.name === varname);
        if (!v) { v = { name: varname, value: undefined }; frame.vars.push(v); }
        v.value = value;
        return true;
      }
      cur = frame.link;
    }
    return false;
  }

  function snapshot(pc, note) {
    trace.push({ pc, note, stack: cloneStack(stack) });
  }

  pushFrame("global", null);
  let pc = entry["global"];
  let error = null;
  snapshot(pc, "ready to execute global");

  let guard = 0;
  while (true) {
    if (guard++ > 100000) { error = "execution did not terminate (step limit reached)"; break; }
    if (pc < 0 || pc >= lines.length) { error = `program counter ran past the end (line ${pc})`; break; }
    const t = lines[pc].trim();
    if (t === "" || t.startsWith("fun ") || t.startsWith("#")) { pc++; continue; }

    const parts = t.split(/\s+/);
    if (parts[0] === "set") {
      const colon = (parts[1] || "").split(":");
      const scope = colon[0], varname = colon[1], value = parts[2];
      const ok = setVar(scope, varname, value);
      pc++;
      snapshot(pc, ok ? `set ${parts[1]} = ${value}` : `set ${parts[1]} (target scope not on stack)`);
    } else if (parts[0] === "sub") {
      const callee = parts[1];               // e.g. 'g()'
      const target = entry[callee];
      if (target === undefined) { error = `call to unknown function '${callee}' at line ${pc}`; break; }
      const ret = pc + 1;
      pushFrame(callee, ret);
      pc = target;
      snapshot(pc, `call ${callee} (return → ${ret})`);
    } else if (parts[0] === "ret") {
      const frame = stack.pop();
      if (stack.length === 0) { snapshot(null, "execution finished"); break; }
      pc = frame.ret;
      snapshot(pc, `return from ${frame.name} → line ${pc}`);
    } else {
      error = `unknown instruction '${t}' at line ${pc}`;
      break;
    }
  }

  return { trace, lines, error };
}

function cloneStack(stack) {
  return stack.map((f) => ({
    name: f.name, ret: f.ret, link: f.link,
    vars: f.vars.map((v) => ({ name: v.name, value: v.value })),
  }));
}

const StackCore = { analyzeProgram, simulate, isTree };
if (typeof module !== "undefined" && module.exports) module.exports = StackCore;
if (typeof window !== "undefined") window.StackCore = StackCore;

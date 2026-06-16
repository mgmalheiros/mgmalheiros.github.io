//
//  app.js — DOM glue + SVG rendering for the Stack Frame Explainer.
//  Logic lives in core.js (StackCore); parsing in parser.js (LarkParser).
//
"use strict";

(function () {
  const DEFAULT_SOURCE = [
    "var a",
    "f {",
    "  var c",
    "  a = 1",
    "  c = 2",
    "  g {",
    "     var e",
    "     a = 3",
    "     c = 4",
    "     e = 5",
    "  }",
    "  g()",
    "}",
    "f()",
  ].join("\n");

  const $ = (id) => document.getElementById(id);
  const el = {
    source: $("source"), srcGutter: $("srcGutter"), errors: $("errors"),
    bytecode: $("bytecode"), bytecodeView: $("bytecodeView"),
    bytecodeEditor: $("bytecodeEditor"), bcGutter: $("bcGutter"),
    btnAnalyze: $("btnAnalyze"), btnExecute: $("btnExecute"),
    btnBack: $("btnBack"), btnForward: $("btnForward"),
    btnContinue: $("btnContinue"), btnEdit: $("btnEdit"),
    status: $("status"), stackWrap: $("stackWrap"), stackSvg: $("stackSvg"),
  };

  const parser = LarkParser.get_parser();

  // execution state
  let model = null;     // last successful analysis
  let trace = [];       // simulate() snapshots
  let bcLines = [];     // bytecode split into addressable lines
  let step = 0;
  let running = false;

  // ------------------------------------------------------------------ editor
  function updateGutter() {
    const n = el.source.value.split("\n").length;
    let s = "";
    for (let i = 1; i <= n; i++) s += i + "\n";
    el.srcGutter.textContent = s;
    el.srcGutter.scrollTop = el.source.scrollTop;
  }
  el.source.addEventListener("input", updateGutter);
  el.source.addEventListener("scroll", () => { el.srcGutter.scrollTop = el.source.scrollTop; });

  // bytecode gutter — addresses are 0-based to match the run view and the
  // return-address line numbers shown in the stack frames.
  function updateBcGutter() {
    const n = el.bytecode.value.split("\n").length;
    let s = "";
    for (let i = 0; i < n; i++) s += i + "\n";
    el.bcGutter.textContent = s;
    el.bcGutter.scrollTop = el.bytecode.scrollTop;
  }
  el.bytecode.addEventListener("input", updateBcGutter);
  el.bytecode.addEventListener("scroll", () => { el.bcGutter.scrollTop = el.bytecode.scrollTop; });

  // ------------------------------------------------------------------ messages
  function showMessages(html) { el.errors.innerHTML = html; }
  function showOk(msg) { showMessages(`<span class="ok">✔ ${esc(msg)}</span>`); }
  function showErrors(list) {
    const html = list
      .map((e) => `<span class="err"><b>line ${e.line ?? "?"}</b>: ${esc(e.msg)}</span>`)
      .join("\n");
    showMessages(html);
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  // ------------------------------------------------------------------ analyze
  function analyze() {
    leaveRunMode();
    const src = el.source.value;
    let tree;
    try {
      tree = parser.parse(src);
    } catch (e) {
      showErrors([{ line: e.line, msg: parseErrorMessage(e) }]);
      return;
    }
    const res = StackCore.analyzeProgram(tree);
    if (res.errors.length) {
      // keep them in source order, then by appearance
      const sorted = res.errors.slice().sort((a, b) => (a.line || 0) - (b.line || 0));
      showErrors(sorted);
      return;
    }
    model = res.model;
    el.bytecode.value = res.bytecode;
    updateBcGutter();
    showOk("No errors. Bytecode generated — press Execute to run it.");
    renderStack(null);
    el.status.textContent = "";
  }

  function parseErrorMessage(e) {
    let detail = "unexpected input";
    if (e && e.token !== undefined && e.token !== null) detail = `unexpected token '${String(e.token)}'`;
    const col = e && e.column ? ` (column ${e.column})` : "";
    return `syntax error: ${detail}${col}`;
  }

  // ------------------------------------------------------------------ execute
  function execute() {
    const text = el.bytecode.value;
    const res = StackCore.simulate(text, model);
    if (res.error) {
      showErrors([{ line: "—", msg: res.error }]);
      return;
    }
    trace = res.trace;
    bcLines = res.lines;
    step = 0;
    enterRunMode();
    render();
    showOk("Executing. Use Back / Forward / Continue to step.");
  }

  function enterRunMode() {
    running = true;
    el.bytecodeEditor.classList.add("hidden");
    el.bytecodeView.classList.remove("hidden");
    el.btnEdit.classList.remove("hidden");
    el.btnBack.disabled = el.btnForward.disabled = el.btnContinue.disabled = false;
  }
  function leaveRunMode() {
    running = false;
    el.bytecodeEditor.classList.remove("hidden");
    el.bytecodeView.classList.add("hidden");
    el.btnEdit.classList.add("hidden");
    el.btnBack.disabled = el.btnForward.disabled = el.btnContinue.disabled = true;
  }

  function gotoStep(i) {
    step = Math.max(0, Math.min(trace.length - 1, i));
    render();
  }

  // ------------------------------------------------------------------ render
  function render() {
    const snap = trace[step];
    renderBytecodeView(snap);
    renderStack(snap);
    el.btnBack.disabled = step <= 0;
    el.btnForward.disabled = el.btnContinue.disabled = step >= trace.length - 1;
    el.status.textContent =
      `Step ${step + 1} / ${trace.length}  —  ${snap.note}`;
  }

  function renderBytecodeView(snap) {
    const liveRet = new Set(snap.stack.map((f) => f.ret).filter((r) => r != null));
    const frag = document.createDocumentFragment();
    bcLines.forEach((raw, addr) => {
      const t = raw.trim();
      const row = document.createElement("div");
      row.className = "bcline";
      if (t.startsWith("fun ")) row.classList.add("fun");
      if (t === "ret") row.classList.add("ret-line");
      if (snap.pc === addr) row.classList.add("current");
      if (liveRet.has(addr)) row.classList.add("retaddr");
      const a = document.createElement("span");
      a.className = "addr";
      a.textContent = String(addr).padStart(2, " ");
      const c = document.createElement("span");
      c.className = "code-txt";
      c.textContent = raw === "" ? " " : raw;
      row.appendChild(a);
      row.appendChild(c);
      frag.appendChild(row);
    });
    el.bytecodeView.innerHTML = "";
    el.bytecodeView.appendChild(frag);
    const cur = el.bytecodeView.querySelector(".current");
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }

  // ------------------------------------------------------------------ SVG stack
  function renderStack(snap) {
    const svg = el.stackSvg;
    const W = Math.max(240, el.stackWrap.clientWidth - 2);
    const rowH = 28, headerH = 28, gap = 18, topPad = 16, botPad = 16;
    const arrowGutter = 54;
    const fw = Math.min(220, W - arrowGutter - 18);
    const fx = arrowGutter + 8;

    if (!snap || snap.stack.length === 0) {
      const msg = snap ? "Execution finished." : "Analyze, then Execute to build the stack.";
      svg.setAttribute("width", W);
      svg.setAttribute("height", Math.max(120, el.stackWrap.clientHeight));
      svg.innerHTML =
        `<text x="${W / 2}" y="40" text-anchor="middle" class="svg-var" fill="#7a8aa0">${esc(msg)}</text>`;
      return;
    }

    const stack = snap.stack; // [0] = global (bottom)

    // visible (static-scope) chain from the current/top frame
    const visible = new Set();
    let cur = stack.length - 1;
    while (cur != null && cur >= 0) { visible.add(cur); cur = stack[cur].link; }
    const topIdx = stack.length - 1;

    // frame heights and bottom-anchored layout
    const heights = stack.map((f) => headerH + (f.vars.length + 1) * rowH);
    const content = heights.reduce((a, b) => a + b, 0) + gap * (stack.length - 1) + topPad + botPad;
    const H = Math.max(el.stackWrap.clientHeight, content);

    const boxes = [];
    let yBottom = H - botPad;
    for (let i = 0; i < stack.length; i++) {
      const h = heights[i];
      boxes.push({ x: fx, y: yBottom - h, w: fw, h });
      yBottom = yBottom - h - gap;
    }

    const parts = [];
    parts.push(
      `<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">` +
      `<path d="M0,0 L7,3 L0,6 Z" fill="var(--red,#e53935)"/></marker></defs>`
    );

    // frames
    for (let i = 0; i < stack.length; i++) {
      const f = stack[i], b = boxes[i], vis = visible.has(i);
      const headFill = i === topIdx ? "#f5821f" : vis ? "#2e7d32" : "#9e9e9e";
      const cellFill = vis ? "#e7f6e9" : "#ededed";
      const cellInk = vis ? "#1b5e20" : "#9e9e9e";
      const stroke = vis ? "#2e7d32" : "#bdbdbd";

      parts.push(`<g>`);
      // outer box
      parts.push(rect(b.x, b.y, b.w, b.h, "none", stroke, 1.5, 8));
      // header
      parts.push(rect(b.x, b.y, b.w, headerH, headFill, headFill, 0, 8));
      parts.push(text(b.x + 10, b.y + headerH / 2 + 4, esc(f.name), "svg-fn", "#fff"));
      if (i === topIdx)
        parts.push(text(b.x + b.w - 8, b.y - 5, "▲ top", "svg-tag", null, "end"));

      // variable rows (definition order grows upward => render reversed top-down)
      let ry = b.y + headerH;
      const vrev = f.vars.slice().reverse();
      for (const v of vrev) {
        parts.push(rect(b.x, ry, b.w, rowH, cellFill, stroke, 0.5, 0));
        const val = (v.value === undefined || v.value === null) ? "—" : v.value;
        parts.push(text(b.x + 12, ry + rowH / 2 + 4, `${esc(v.name)} = ${esc(val)}`, "svg-var", cellInk));
        ry += rowH;
      }
      // return-address row (bottom of frame)
      parts.push(rect(b.x, ry, b.w, rowH, vis ? "#d7eed9" : "#e3e3e3", stroke, 0.5, 0));
      const retTxt = f.ret == null ? "ret → — (entry)" : `ret → line ${f.ret}`;
      parts.push(text(b.x + 12, ry + rowH / 2 + 4, retTxt, "svg-ret", vis ? "#33691e" : "#9e9e9e"));
      parts.push(`</g>`);
    }

    // static-link arrows (red), routed in the left gutter
    for (let i = 0; i < stack.length; i++) {
      const f = stack[i];
      if (f.link == null) continue;
      const from = boxes[i], to = boxes[f.link];
      const y1 = from.y + from.h - rowH / 2;   // bottom of source frame (return-address row)
      const y2 = to.y + headerH / 2;           // top of target frame (function name)
      const channel = 12 + (i % 4) * 9;
      const d = `M ${from.x},${y1} H ${channel} V ${y2} H ${to.x}`;
      parts.push(
        `<path d="${d}" fill="none" stroke="var(--red,#e53935)" stroke-width="1.6" ` +
        `marker-end="url(#ah)"/>`
      );
      parts.push(text(channel + 4, (y1 + y2) / 2, "static", "svg-linklabel", null, "start"));
    }

    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = parts.join("");
  }

  function rect(x, y, w, h, fill, stroke, sw, r) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }
  function text(x, y, s, cls, fill, anchor) {
    const a = anchor ? ` text-anchor="${anchor}"` : "";
    const f = fill ? ` fill="${fill}"` : "";
    return `<text x="${x}" y="${y}" class="${cls}"${f}${a}>${s}</text>`;
  }

  // ------------------------------------------------------------------ wiring
  el.btnAnalyze.addEventListener("click", analyze);
  el.btnExecute.addEventListener("click", execute);
  el.btnBack.addEventListener("click", () => gotoStep(step - 1));
  el.btnForward.addEventListener("click", () => gotoStep(step + 1));
  el.btnContinue.addEventListener("click", () => gotoStep(trace.length - 1));
  el.btnEdit.addEventListener("click", leaveRunMode);
  window.addEventListener("resize", () => { if (running) renderStack(trace[step]); });

  // ------------------------------------------------------------------ init
  el.source.value = DEFAULT_SOURCE;
  updateGutter();
  analyze();
})();

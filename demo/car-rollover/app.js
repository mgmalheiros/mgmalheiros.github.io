/* ========================================================================
   Car VR Prototype  —  Three.js  |  gyroscope look-around  |  mobile-first
   ======================================================================== */

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────────────────────
  const overlay = document.getElementById("permission-overlay");
  const btn     = document.getElementById("enable-gyro");
  const hint    = document.getElementById("hint");

  // ── Scene, camera, renderer ───────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);   // sky blue
  scene.fog = new THREE.Fog(0x87ceeb, 60, 180);

  const camera = new THREE.PerspectiveCamera(
    70,                                          // fov – slightly wide for immersion
    window.innerWidth / window.innerHeight,
    0.05,
    200
  );
  camera.position.set(0, 0, 0);                  // driver's eye point
  camera.rotation.order = "YXZ";                 // yaw-pitch-roll (intuitive for head)

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // cap for perf
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.xr.enabled = true;               // let Three.js handle XR sessions
  document.body.appendChild(renderer.domElement);

  // ── Lighting ──────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const sun = new THREE.DirectionalLight(0xfff5e8, 0.9);
  sun.position.set(15, 22, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near  = 0.5;
  sun.shadow.camera.far   = 120;
  sun.shadow.camera.left   = -35;
  sun.shadow.camera.right  =  35;
  sun.shadow.camera.top    =  35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // subtle fill from the opposite side
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.25);
  fill.position.set(-8, 4, 6);
  scene.add(fill);

  // ── Materials (reusable) ──────────────────────────────────────────────
  function lambert(hex) {
    return new THREE.MeshLambertMaterial({ color: hex });
  }

  const M = {
    interior:   lambert(0x3d3a38),   // warm dark grey
    dash:       lambert(0x2c2927),   // darker dashboard
    dark:       lambert(0x1a1a1a),   // steering wheel / details
    floor:      lambert(0x252423),
    seat:       lambert(0x4a4745),
    seatStitch: lambert(0x3a3735),
    roof:       lambert(0xe8e4df),   // light headliner
    pillar:     lambert(0x33302e),
    body:       lambert(0x1e3a6e),   // deep blue car paint
    bodyDark:   lambert(0x162b52),
    chrome:     lambert(0xcccccc),
    glass:      new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.25 }),
    grass:      lambert(0x4a8c3f),
    road:       lambert(0x4a4a4a),
    roadLine:   lambert(0xe8e8e8),
    building:   lambert(0xf2f2f2),
  };

  // ── World root ────────────────────────────────────────────────────────
  const world = new THREE.Group();
  scene.add(world);

  // ── Car interior group ────────────────────────────────────────────────
  const car = new THREE.Group();
  world.add(car);

  // shorthand helpers
  function box(w, h, d, mat, pos, rot) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    if (rot) { m.rotation.set(rot[0], rot[1], rot[2]); }
    m.castShadow = true;
    m.receiveShadow = true;
    car.add(m);
    return m;
  }

  function plane(w, h, mat, pos, rot) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    if (rot) { m.rotation.set(rot[0], rot[1], rot[2]); }
    m.receiveShadow = true;
    car.add(m);
    return m;
  }

  // ── Car floor ─────────────────────────────────────────────────────────
  plane(2.4, 2.9, M.floor, [0.2, -0.68, 0.1], [-Math.PI / 2, 0, 0]);

  // small tunnel / centre console base
  box(0.30, 0.10, 0.90, M.interior, [0.45, -0.58, 0.05]);

  // ── Dashboard ─────────────────────────────────────────────────────────
  box(2.00, 0.28, 0.55, M.dash, [0.2, -0.34, -0.82]);

  // instrument cluster hump (above steering wheel)
  box(0.55, 0.10, 0.35, M.dash, [0.0, -0.15, -0.80]);

  // glove box area (right side of dash)
  box(0.50, 0.08, 0.25, M.dash, [1.00, -0.32, -0.82]);

  // ── Steering column + wheel ───────────────────────────────────────────
  // column
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.38, 10),
    M.dark
  );
  col.position.set(0, -0.38, -0.52);
  col.rotation.x = 0.55;   // angled toward driver
  col.castShadow = true;
  car.add(col);

  // wheel rim (torus)
  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.028, 10, 20),
    M.dark
  );
  wheel.position.set(0, -0.10, -0.74);
  wheel.rotation.x = 1.05;  // tilted facing driver
  wheel.rotation.z = 0.08;
  wheel.castShadow = true;
  car.add(wheel);

  // wheel centre cap
  box(0.08, 0.04, 0.08, M.chrome, [0, -0.10, -0.74], [1.05, 0, 0]);

  // ── Seats ─────────────────────────────────────────────────────────────
  function makeSeat(x, z) {
    // base cushion
    box(0.52, 0.12, 0.48, M.seat, [x, -0.50, z]);
    // backrest
    box(0.52, 0.55, 0.10, M.seat, [x, -0.16, z + 0.28]);
    // headrest
    box(0.24, 0.18, 0.08, M.seatStitch, [x, 0.16, z + 0.30]);
  }

  makeSeat(0,    0.35);   // driver
  makeSeat(0.85, 0.35);   // passenger

  // rear bench
  box(1.70, 0.12, 0.50, M.seat, [0.25, -0.50, 1.3]);
  box(1.70, 0.50, 0.10, M.seat, [0.25, -0.18, 1.55]);

  // ── Left side (driver's door & rear panel) ────────────────────────────
  const LX = -0.98;                                // left wall X
  // lower door panel
  box(0.07, 0.55, 1.60, M.interior, [LX, -0.32, 0.0]);
  // upper frame above window
  box(0.07, 0.32, 1.60, M.interior, [LX, 0.34, 0.0]);

  // pillars
  box(0.07, 0.70, 0.08, M.pillar, [LX, 0.02, -1.05]);  // A-pillar
  box(0.07, 0.68, 0.08, M.pillar, [LX, 0.02,  0.05]);  // B-pillar
  box(0.07, 0.65, 0.08, M.pillar, [LX, 0.02,  1.15]);  // C-pillar

  // ── Right side (passenger door & rear panel) ──────────────────────────
  const RX = 1.38;
  box(0.07, 0.55, 1.60, M.interior, [RX, -0.32, 0.0]);
  box(0.07, 0.32, 1.60, M.interior, [RX, 0.34, 0.0]);
  box(0.07, 0.70, 0.08, M.pillar, [RX, 0.02, -1.05]);
  box(0.07, 0.68, 0.08, M.pillar, [RX, 0.02,  0.05]);
  box(0.07, 0.65, 0.08, M.pillar, [RX, 0.02,  1.15]);

  // ── Roof ──────────────────────────────────────────────────────────────
  plane(2.25, 2.70, M.roof, [0.2, 0.57, 0.1], [Math.PI / 2, 0, 0]);

  // ── Windshield surround ───────────────────────────────────────────────
  // top crossbar
  box(2.00, 0.06, 0.08, M.pillar, [0.2, 0.42, -1.06]);
  // bottom (dash top edge)
  box(2.00, 0.04, 0.06, M.dash, [0.2, -0.20, -0.78]);
  // left A-pillar visible from inside (extended)
  box(0.07, 0.70, 0.08, M.pillar, [LX, 0.12, -1.06]);
  // right A-pillar
  box(0.07, 0.70, 0.08, M.pillar, [RX, 0.12, -1.06]);

  // ── Rear shelf ────────────────────────────────────────────────────────
  box(1.50, 0.05, 0.30, M.interior, [0.2, 0.1, 1.70]);

  // ── Exterior body (visible through windows) ───────────────────────────
  // bonnet / hood
  box(1.70, 0.07, 0.95, M.body, [0.2, -0.57, -1.40]);
  // front wings
  box(0.14, 0.18, 0.55, M.body, [LX + 0.05, -0.50, -1.30]);
  box(0.14, 0.18, 0.55, M.body, [RX - 0.05, -0.50, -1.30]);
  // front bumper hint
  box(1.90, 0.10, 0.15, M.bodyDark, [0.2, -0.58, -1.85]);

  // ── Windows (semi-transparent) ────────────────────────────────────────
  // windscreen
  const ws = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 0.62),
    M.glass
  );
  ws.position.set(0.2, 0.12, -0.92);
  ws.rotation.x = -0.45;   // rake angle
  ws.renderOrder = 1;
  ws.material.depthWrite = false;
  car.add(ws);

  // left side windows
  function sideWindow(x, z, w, h) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    sw.position.set(x, 0.02, z);
    sw.rotation.y = Math.PI / 2;
    sw.renderOrder = 1;
    sw.material.depthWrite = false;
    car.add(sw);
  }
  sideWindow(LX + 0.04, -0.50, 0.45, 0.60);  // front left
  sideWindow(LX + 0.04,  0.60, 0.45, 0.55);  // rear  left
  sideWindow(RX - 0.04, -0.50, 0.45, 0.60);  // front right
  sideWindow(RX - 0.04,  0.60, 0.45, 0.55);  // rear  right

  // rear window
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 0.42), M.glass);
  rw.position.set(0.2, 0.18, 1.73);
  rw.renderOrder = 1;
  rw.material.depthWrite = false;
  car.add(rw);

  // ── Exterior environment ──────────────────────────────────────────────
  // grass plane
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    M.grass
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -1.02, -8);
  grass.receiveShadow = true;
  world.add(grass);

  // road (extends forward along -Z)
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 70),
    M.road
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0.2, -1.00, -20);
  road.receiveShadow = true;
  world.add(road);

  // dashed centre line
  for (let i = 0; i < 14; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 2.2),
      M.roadLine
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0.2, -0.99, -4 - i * 5);
    world.add(dash);
  }

  // road edge lines
  for (let s = -1; s <= 1; s += 2) {
    for (let i = 0; i < 14; i++) {
      const edge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 1.6),
        M.roadLine
      );
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(0.2 + s * 2.5, -0.99, -4 - i * 5);
      world.add(edge);
    }
  }

  // ── Buildings (large white boxes, scattered) ──────────────────────────
  const buildings = [
    { x: -9,  z: -14, w: 3.0, h: 5.0, d: 3.0 },
    { x:  7,  z: -20, w: 4.5, h: 7.0, d: 4.0 },
    { x: -6,  z: -30, w: 3.5, h: 4.5, d: 3.5 },
  ];

  buildings.forEach(function (b) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.d),
      M.building
    );
    mesh.position.set(b.x, -1.02 + b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);

    // darker roof accent
    const roofAccent = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.08, 0.08, b.d + 0.08),
      lambert(0xd0d0d0)
    );
    roofAccent.position.set(b.x, -1.02 + b.h + 0.04, b.z);
    roofAccent.castShadow = true;
    world.add(roofAccent);
  });

  // ── A few trees (simple cone + cylinder) ─────────────────────────────
  function tree(tx, tz) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.20, 1.6, 8),
      lambert(0x8B5E3C)
    );
    trunk.position.y = -0.22;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.4, 8, 4),
      lambert(0x3d6b2e)
    );
    foliage.position.y = 0.9;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    g.add(foliage);

    g.position.set(tx, -1.02, tz);
    world.add(g);
  }

  tree(-10, -15);
  tree(-10, -28);
  tree(10, -12);
  tree(10, -24);

  // ── Input handling ────────────────────────────────────────────────────
  // Priority chain:  WebXR inline  >  DeviceOrientation  >  mouse/touch
  //
  // WebXR gives a full 360° platform-calibrated quaternion (ARKit on iOS,
  // ARCore / Google VR on Android).  DeviceOrientation's gamma is clamped
  // to ±90° and alpha is often null or drift-prone on iOS, which is why
  // you can't look behind the car with raw gyro alone.

  let inputMode = "none";          // "xr" | "gyro" | "mouse"
  let gyroHasData = false;         // true after first valid gyro reading
  let targetYaw = 0;               // fallback target (rad)
  let targetPitch = 0;

  // --- WebXR inline session ---------------------------------------------

  // --- WebXR immersive-vr session ---------------------------------------
  //
  // Uses Three.js's built-in XR manager (renderer.xr).  When a session is
  // active the XR manager drives the animation loop, applies head poses to
  // the camera, and handles stereoscopic rendering automatically.
  //
  // Supported on: Chrome Android, Firefox Android, desktop with emulator.

  async function startXR() {
    console.log("[XR] probing WebXR …");

    if (!navigator.xr) {
      if (!window.isSecureContext) {
        console.log("[XR] not a secure context — WebXR requires HTTPS");
        return startGyro("⬤ Gyro · WebXR needs HTTPS");
      }
      console.log("[XR] navigator.xr absent");
      return startGyro("WebXR not in this browser");
    }

    let supported;
    try {
      supported = await navigator.xr.isSessionSupported("immersive-vr");
    } catch (_) {
      supported = false;
    }
    console.log("[XR] immersive-vr supported:", supported);

    if (!supported) {
      return startGyro("immersive-vr not supported · using gyro");
    }

    try {
      console.log("[XR] requesting immersive-vr session …");
      // No requiredFeatures — "local" is a reference-space type, not a
      // session feature.  Three.js requests a "local" reference space
      // automatically inside setSession().
      const session = await navigator.xr.requestSession("immersive-vr");

      session.addEventListener("end", function () {
        console.log("[XR] session ended");
        inputMode = "none";
        hint.textContent = "Session ended — reload page";
        hint.style.display = "block";
      });

      // Three.js defaults to "local-floor" reference space, which isn't
      // available on all devices.  "local" (origin at initial head pose)
      // is universally supported and perfect for a seated car experience.
      renderer.xr.setReferenceSpaceType("local");
      await renderer.xr.setSession(session);

      inputMode = "xr";
      overlay.style.display = "none";
      hint.textContent = "⬤ WebXR VR";
      hint.style.display = "block";
      console.log("[XR] immersive-vr session active");

    } catch (err) {
      console.warn("[XR] session rejected:", err);
      return startGyro("VR declined · using gyro");
    }
  }

  // --- DeviceOrientation fallback ---------------------------------------

  function onOrientation(e) {
    if (e.beta == null || e.gamma == null) return;

    // First valid reading — promote to gyro mode
    if (!gyroHasData) {
      gyroHasData = true;
      inputMode = "gyro";
      hint.textContent = "⬤ Gyro";
    }

    // beta:   front-back tilt  (0 = flat face-up, 90 = vertical portrait)
    // gamma:  left-right tilt  (0 = level, negative = left edge down)
    const pitchDeg = e.beta - 90;   // 0 when phone vertical → look ahead
    const yawDeg   = e.gamma;       // 0 when level        → look ahead

    targetPitch = THREE.MathUtils.degToRad(pitchDeg);
    targetYaw   = THREE.MathUtils.degToRad(yawDeg);
  }

  // reason: optional string from startXR explaining why XR wasn't used
  function startGyro(reason) {
    const fallbackHint = reason || "Waiting for gyro…";
    console.log("[gyro] starting  (reason: " + (reason || "direct") + ")");

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      // iOS 13+ — permission must be triggered by user gesture
      overlay.style.display = "flex";
      btn.addEventListener("click", async function () {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === "granted") {
            window.addEventListener("deviceorientation", onOrientation);
            overlay.style.display = "none";
            hint.textContent = fallbackHint;
            hint.style.display = "block";
          }
        } catch (_) {
          overlay.style.display = "none";
          inputMode = "mouse";
          hint.textContent = "○ Drag to look";
          hint.style.display = "block";
        }
      });
    } else {
      // Android / desktop — no permission dialog needed
      // (Chrome ≥102 also requires Permissions-Policy: gyroscope header;
      //  without it beta/gamma stay null and we stay in "waiting" state.)
      window.addEventListener("deviceorientation", onOrientation);
      overlay.style.display = "none";
      hint.textContent = fallbackHint;
      hint.style.display = "block";
    }
  }

  // --- Mouse / touch fallback (desktop testing) -------------------------

  let mouseDown = false;
  let lastMX = 0, lastMY = 0;
  const MOUSE_SENSITIVITY = 0.004;

  function setModeMouse() {
    if (inputMode !== "xr" && inputMode !== "mouse") {
      inputMode = "mouse";
      hint.textContent = "○ Drag to look";
      hint.style.display = "block";
    }
  }

  // Mouse / touch is blocked only when XR is active OR real gyro data is flowing
  function inputBlocksMouse() {
    return inputMode === "xr" || gyroHasData;
  }

  function onMouseDown(e) {
    if (inputBlocksMouse()) return;
    mouseDown = true;
    lastMX = e.clientX;
    lastMY = e.clientY;
  }
  function onMouseUp()   { mouseDown = false; }
  function onMouseMove(e) {
    if (!mouseDown) return;
    if (inputBlocksMouse()) return;
    const dx = e.clientX - lastMX;
    const dy = e.clientY - lastMY;
    targetYaw   += dx * MOUSE_SENSITIVITY;
    targetPitch += dy * MOUSE_SENSITIVITY;
    targetPitch  = THREE.MathUtils.clamp(targetPitch, -1.2, 1.2);
    lastMX = e.clientX;
    lastMY = e.clientY;
    setModeMouse();
  }

  function onTouchStart(e) {
    if (inputBlocksMouse()) return;
    if (e.touches.length === 1) {
      mouseDown = true;
      lastMX = e.touches[0].clientX;
      lastMY = e.touches[0].clientY;
    }
  }
  function onTouchEnd()   { mouseDown = false; }
  function onTouchMove(e) {
    if (!mouseDown || e.touches.length !== 1) return;
    if (inputBlocksMouse()) return;
    const dx = e.touches[0].clientX - lastMX;
    const dy = e.touches[0].clientY - lastMY;
    targetYaw   += dx * MOUSE_SENSITIVITY;
    targetPitch += dy * MOUSE_SENSITIVITY;
    targetPitch  = THREE.MathUtils.clamp(targetPitch, -1.2, 1.2);
    lastMX = e.touches[0].clientX;
    lastMY = e.touches[0].clientY;
    setModeMouse();
  }

  renderer.domElement.addEventListener("mousedown",  onMouseDown);
  window.addEventListener("mouseup",                onMouseUp);
  window.addEventListener("mousemove",              onMouseMove);
  renderer.domElement.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchend",               onTouchEnd);
  window.addEventListener("touchmove",              onTouchMove);

  // ── Resize ────────────────────────────────────────────────────────────
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Render loop ──────────────────────────────────────────────────────
  //
  // Uses renderer.setAnimationLoop() — when an XR session is active
  // Three.js hijacks this with the XR session's own RAF, manages the
  // camera transform, and renders stereoscopically.  In non-XR fallback
  // mode we do our own camera update and rendering.

  function animate() {
    if (inputMode !== "xr") {
      const LERP = 0.35;
      camera.rotation.y += (targetYaw   - camera.rotation.y) * LERP;
      camera.rotation.x += (targetPitch - camera.rotation.x) * LERP;
    }
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

  // ── Kick off ──────────────────────────────────────────────────────────
  //
  // Everything (scene, car, environment) is already set up above.
  // Now wire up the button → WebXR (with fallback) and start the
  // fallback render loop (it will be a no-op if WebXR takes over).

  overlay.style.display = "flex";
  btn.textContent = "Enter VR";
  btn.addEventListener("click", startXR);

  animate();
})();

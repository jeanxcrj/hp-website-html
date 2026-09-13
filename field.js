/* Extrusion Field — animated canvas engine.
   Ported from ~/work/extrusion-field/index.html (static SVG tool).

   The geometry is identical to the tool: axis-aligned bars scattered in depth,
   projected through a single perspective point so every edge converges on it.
   What is new here is TIME — a `travel` offset slides the whole cloud toward
   the camera and each bar wraps from the far plane back to the near one, so the
   field flies through you forever without ever re-seeding.

   Two rules carried over from the tool, both learned the hard way:
   - a bar is defined by its NEAR end (z0) plus a length, never by its centre,
     so a long bar can never straddle the near plane and blow up to fill frame.
   - `cone` < 1 pulls the far end of the cloud toward the view axis, which is
     what tightens the vanishing knot. */

(function (global) {
  'use strict';

  var TAU = Math.PI * 2, D = Math.PI / 180;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function css(c) {
    return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  }

  var DEF = {
    // field
    count: 260, seed: 12, spread: 1500, aspectXY: 1.35, clump: 0.55, hole: 0.04, cone: 0.55,
    zNear: 900, zFar: 11000, zPow: 1.5,
    // bars
    lenMin: 500, lenMax: 4200, lenDepth: 0.7,
    thick: 150, thickVar: 0.75, flat: 0.3, flatVar: 0.8,
    // render
    faces: true, faceShade: 0.34,
    fade: 0.85, fadePow: 1.5, grad: 0.75, gradPow: 1, minPx: 1.2,
    edge: 0, edgeCol: '#ffffff',
    // view
    fov: 62, vpX: 0.86, vpY: 0.52,
    // style
    col: '#1E44D6', bg: '#ffffff', wash: 0.34, washCol: '#5C7BE6', washR: 0.55,
    // motion
    speed: 900,          // world units per second toward the camera
    parallax: 0.05,      // how far the vanishing point chases the pointer
    ease: 0.055,         // vanishing-point smoothing per frame
    transparent: false   // skip the background fill (lets CSS show through)
  };

  /* the six faces of an axis-aligned bar, as corner-index quads + tonal step */
  var FACE = [
    { n: [0, 0, -1], i: [0, 1, 3, 2], s: 1 },
    { n: [0, 0, 1],  i: [4, 6, 7, 5], s: 1 },
    { n: [-1, 0, 0], i: [0, 2, 6, 4], s: 0.62 },
    { n: [1, 0, 0],  i: [1, 5, 7, 3], s: 0.62 },
    { n: [0, -1, 0], i: [0, 4, 5, 1], s: 0.34 },
    { n: [0, 1, 0],  i: [2, 3, 7, 6], s: 0.34 }
  ];

  function ExtrusionField(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.P = {};
    this.travel = 0;
    this.running = false;
    this.t0 = 0;
    this.pointer = { x: 0.5, y: 0.5 };
    this.vp = { x: 0, y: 0 };          // smoothed vanishing point, 0..1
    this.vpInit = false;
    this.scroll = 0;                    // 0..1, driven from outside
    this.set(Object.assign({}, DEF, opts || {}));
    this._loop = this._loop.bind(this);
    this.resize();
  }

  ExtrusionField.prototype.set = function (next) {
    Object.assign(this.P, next);
    this._cacheColors();
    if (next && (next.count != null || next.seed != null || next.spread != null ||
      next.aspectXY != null || next.clump != null || next.hole != null || next.cone != null ||
      next.zNear != null || next.zFar != null || next.zPow != null ||
      next.lenMin != null || next.lenMax != null || next.lenDepth != null ||
      next.thick != null || next.thickVar != null || next.flat != null || next.flatVar != null)) {
      this.bars = null;
    }
    return this;
  };

  ExtrusionField.prototype._cacheColors = function () {
    var P = this.P;
    this.COL = hex(P.col);
    this.BG = hex(P.bg);
    this.WASH = hex(P.washCol);
    // one base tone per face step, precomputed so the hot loop only lerps toward bg
    this.faceCol = FACE.map(function (F) {
      return mix(this.COL, this.BG, (1 - F.s) * P.faceShade);
    }, this);
  };

  /* ---------- geometry ---------- */
  ExtrusionField.prototype._build = function () {
    var P = this.P, r = mulberry(Math.round(P.seed) * 7919 + 11), out = [];
    var n = Math.max(1, Math.round(P.count));
    var span = Math.max(1, P.zFar - P.zNear);
    for (var i = 0; i < n; i++) {
      var th = r() * TAU;
      var rad = lerp(P.hole, 1, Math.pow(r(), Math.max(0.05, P.clump)));
      var z0 = lerp(P.zNear, P.zFar, Math.pow(r(), Math.max(0.05, P.zPow)));
      var tz = (z0 - P.zNear) / span;
      var open = lerp(1, P.cone, tz);
      var L = lerp(P.lenMin, P.lenMax, Math.pow(r(), 1.7)) * lerp(1, z0 / P.zNear * 0.5, P.lenDepth);
      var w = P.thick * lerp(1 - P.thickVar, 1 + P.thickVar * 1.6, r());
      var h = w * P.flat * lerp(1 - P.flatVar, 1 + P.flatVar * 2.2, r());
      out.push({
        // direction + radius are frozen; x/y are recomputed each frame because
        // `open` depends on the bar's live depth, not its spawn depth
        th: th, rad: rad,
        base: z0, hd: Math.max(4, L / 2),
        hw: Math.max(1, w / 2), hh: Math.max(1, h / 2),
        x: 0, y: 0, z0: z0, z: 0, k: r()
      });
    }
    this.bars = out;
    return out;
  };

  /* ---------- frame ---------- */
  ExtrusionField.prototype.resize = function () {
    var c = this.canvas, dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = c.clientWidth || 1, h = c.clientHeight || 1;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.W = w; this.H = h; this.dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return this;
  };

  ExtrusionField.prototype.draw = function () {
    var P = this.P, ctx = this.ctx, W = this.W, H = this.H;
    if (!W || !H) return;
    if (!this.bars) this._build();

    // smoothed vanishing point: base position + a little pointer parallax
    var tx = P.vpX + (this.pointer.x - 0.5) * P.parallax;
    var ty = P.vpY + (this.pointer.y - 0.5) * P.parallax;
    if (!this.vpInit) { this.vp.x = tx; this.vp.y = ty; this.vpInit = true; }
    else { this.vp.x += (tx - this.vp.x) * P.ease; this.vp.y += (ty - this.vp.y) * P.ease; }

    var f = (Math.min(W, H) * 0.5) / Math.tan(clamp(P.fov, 8, 150) * D / 2);
    var px = this.vp.x * W, py = this.vp.y * H;
    var span = Math.max(1, P.zFar - P.zNear);
    var pw = Math.max(0.05, P.fadePow);
    var washR = Math.hypot(W, H) * P.washR;
    var BG = this.BG, WASH = this.WASH, wash = P.wash;

    // the colour actually sitting behind a point on the canvas — bg plus wash
    function bgAt(x, y) {
      if (wash <= 0) return BG;
      var t = wash * clamp(1 - Math.hypot(x - px, y - py) / washR, 0, 1);
      return mix(BG, WASH, t);
    }

    ctx.clearRect(0, 0, W, H);
    if (!P.transparent) { ctx.fillStyle = css(BG); ctx.fillRect(0, 0, W, H); }
    if (wash > 0) {
      var g = ctx.createRadialGradient(px, py, 0, px, py, washR);
      g.addColorStop(0, 'rgba(' + WASH[0] + ',' + WASH[1] + ',' + WASH[2] + ',' + wash + ')');
      g.addColorStop(1, 'rgba(' + WASH[0] + ',' + WASH[1] + ',' + WASH[2] + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // advance every bar, wrapping far→near so the stream never runs out
    var bars = this.bars, travel = this.travel, i, b;
    for (i = 0; i < bars.length; i++) {
      b = bars[i];
      var z0 = P.zNear + (((b.base - travel - P.zNear) % span) + span) % span;
      b.z0 = z0;
      b.z = z0 + b.hd;
      var open = lerp(1, P.cone, (z0 - P.zNear) / span);
      b.x = Math.cos(b.th) * b.rad * P.spread * P.aspectXY * open;
      b.y = Math.sin(b.th) * b.rad * P.spread * open;
    }
    bars.sort(function (a, c) { return c.z - a.z; });

    var C = new Array(8), minA = P.minPx * P.minPx;
    var drawn = 0;

    for (i = 0; i < bars.length; i++) {
      b = bars[i];
      if (b.z0 < 24) continue;

      // project the 8 corners once
      var vis = false;
      for (var s = 0; s < 8; s++) {
        var cx = b.x + (s & 1 ? b.hw : -b.hw);
        var cy = b.y + (s & 2 ? b.hh : -b.hh);
        var cz = b.z + (s & 4 ? b.hd : -b.hd);
        if (cz < 24) { vis = false; break; }
        var sc = f / cz;
        C[s] = { x: cx, y: cy, z: cz, px: px + cx * sc, py: py + cy * sc };
        vis = true;
      }
      if (!vis) continue;

      // fade fractions at the bar's own two ends — opacity, never colour mixing,
      // so shapes dissolve into the wash instead of punching holes through it
      var zf = b.z0 + 2 * b.hd;
      var aNear = clamp(1 - P.fade * Math.pow(clamp((b.z0 - P.zNear) / span, 0, 1), pw), 0, 1);
      var aFarRaw = clamp(1 - P.fade * Math.pow(clamp((zf - P.zNear) / span, 0, 1), pw), 0, 1);
      var aFar = clamp(lerp(aNear, aFarRaw * (1 - P.gradPow * 0.35), P.grad), 0, 1);

      var nf = f / b.z0, ff = f / zf;
      var nx = px + b.x * nf, ny = py + b.y * nf;
      var fx = px + b.x * ff, fy = py + b.y * ff;
      var behindN = bgAt(nx, ny), behindF = bgAt(fx, fy);

      if (P.faces) {
        for (var k = 0; k < 6; k++) {
          var F = FACE[k], idx = F.i;
          var q0 = C[idx[0]], q1 = C[idx[1]], q2 = C[idx[2]], q3 = C[idx[3]];
          // backface cull against the face centroid in view space
          var ax = (q0.x + q1.x + q2.x + q3.x) / 4;
          var ay = (q0.y + q1.y + q2.y + q3.y) / 4;
          var az = (q0.z + q1.z + q2.z + q3.z) / 4;
          if (F.n[0] * ax + F.n[1] * ay + F.n[2] * az > 0) continue;

          var e0x = q1.px - q0.px, e0y = q1.py - q0.py;
          var e1x = q2.px - q0.px, e1y = q2.py - q0.py;
          var e2x = q3.px - q0.px, e2y = q3.py - q0.py;
          var a2 = Math.abs(e0x * e1y - e0y * e1x) + Math.abs(e1x * e2y - e1y * e2x);
          if (a2 * 0.5 < minA) continue;

          var base = this.faceCol[k];
          ctx.beginPath();
          ctx.moveTo(q0.px, q0.py); ctx.lineTo(q1.px, q1.py);
          ctx.lineTo(q2.px, q2.py); ctx.lineTo(q3.px, q3.py);
          ctx.closePath();
          ctx.fillStyle = P.grad > 0
            ? this._grad(nx, ny, fx, fy, base, behindN, behindF, aNear, aFar)
            : css(mix(base, behindN, 1 - aNear));
          ctx.fill();
          drawn++;
        }
      } else {
        var h2 = this._hull(C);
        if (h2.length > 2) {
          ctx.beginPath();
          ctx.moveTo(h2[0].px, h2[0].py);
          for (var j = 1; j < h2.length; j++) ctx.lineTo(h2[j].px, h2[j].py);
          ctx.closePath();
          ctx.fillStyle = P.grad > 0
            ? this._grad(nx, ny, fx, fy, this.COL, behindN, behindF, aNear, aFar)
            : css(mix(this.COL, behindN, 1 - aNear));
          ctx.fill();
          if (P.edge > 0) {
            ctx.strokeStyle = css(mix(hex(P.edgeCol), behindN, 1 - aNear));
            ctx.lineWidth = P.edge;
            ctx.stroke();
          }
          drawn++;
        }
      }
    }
    this.drawn = drawn;
  };

  ExtrusionField.prototype._grad = function (x0, y0, x1, y1, base, behindN, behindF, aN, aF) {
    // degenerate line (bar pointing straight at the camera) → flat fill
    if (Math.abs(x1 - x0) < 0.01 && Math.abs(y1 - y0) < 0.01) return css(mix(base, behindN, 1 - aN));
    var g = this.ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, css(mix(base, behindN, 1 - aN)));
    g.addColorStop(1, css(mix(base, behindF, 1 - aF)));
    return g;
  };

  ExtrusionField.prototype._hull = function (C) {
    var p = C.slice().sort(function (a, b) { return a.px - b.px || a.py - b.py; });
    function cr(o, a, b) { return (a.px - o.px) * (b.py - o.py) - (a.py - o.py) * (b.px - o.px); }
    var lo = [], up = [], i, q;
    for (i = 0; i < p.length; i++) {
      q = p[i];
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    for (i = p.length - 1; i >= 0; i--) {
      q = p[i];
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    lo.pop(); up.pop();
    return lo.concat(up);
  };

  /* ---------- loop ---------- */
  ExtrusionField.prototype._loop = function (t) {
    if (!this.running) return;
    var dt = this.t0 ? Math.min((t - this.t0) / 1000, 0.05) : 0.016;
    this.t0 = t;
    this.travel += this.P.speed * dt * (this.speedScale == null ? 1 : this.speedScale);
    this.draw();
    this.raf = global.requestAnimationFrame(this._loop);
  };

  ExtrusionField.prototype.start = function () {
    if (this.running) return this;
    this.running = true; this.t0 = 0;
    this.raf = global.requestAnimationFrame(this._loop);
    return this;
  };

  ExtrusionField.prototype.stop = function () {
    this.running = false;
    if (this.raf) global.cancelAnimationFrame(this.raf);
    return this;
  };

  ExtrusionField.DEF = DEF;
  global.ExtrusionField = ExtrusionField;
})(window);

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
    // a hairline edge on every visible face: it separates overlapping bars AND
    // draws the crease between front and side faces, which is what makes a bar
    // read as a solid rather than a flat chevron. edgeFade keeps it on the same
    // depth ramp as the fill, or distant bars turn to white mush.
    edge: 0, edgeCol: '#ffffff', edgeFade: true,
    /* Bars wrap from the near plane back to the far one. At the moment of the
       wrap a bar is at its largest and usually still on screen, so it pops out
       of existence in a single frame. wrapFade ramps a bar's opacity down as
       z0 approaches zNear and back up after it respawns at zFar, so the loop
       dissolves at both ends instead of cutting. Fraction of the depth span. */
    /* Applied at BOTH ends of the loop, so it is capped below 0.5 in draw():
       at 0.5 the two ramps meet and no bar ever reaches full opacity, and past
       it the whole field sits permanently dimmed. */
    wrapFade: 0,
    /* Shapes the wrap fade. >1 pulls the whole ramp down early, so a bar is
       already dim while it is still small — which is what stops a near slab
       from vanishing at the moment it is largest and growing fastest. */
    wrapFadePow: 1,
    /* How far past the bar's own two ends the per-face gradient ramp runs, as a
       fraction of its projected length. A canvas gradient holds its end colour
       FLAT beyond its endpoints, and a face polygon reaches past both ends — so
       at 0 that clamp lands as a hard band straight across the face. */
    gradStops: 22,
    /* Perspective pushes a bar off the side of the frame long before its depth
       ever reaches zNear, so it leaves at full strength and the edge simply
       clips it — that is the hard "gone" moment. This fades a bar by how far
       past the frame it has travelled, as a fraction of the viewport. It is
       applied per END, not per bar: the outer end dissolves as it swings out
       while the end pointing at the vanishing knot stays put. 0 disables.
       NOTE: deliberately not called edgeFade — that name is already taken above
       for the hairline's depth ramp, and two keys of the same name in one
       options object silently overwrite each other. */
    borderFade: 0,
    /* wrapFade mixes a bar toward the background colour but keeps it opaque,
       so it ends as a solid of background colour still hiding the bars behind
       it — and when it wraps they reappear in one frame. wrapFadeOut (0..1)
       takes the bar's opacity to zero over that last fraction of the near-end
       ramp, where it is already almost background colour, so the bars behind
       come up through it instead of popping in. Keep it small: any earlier and
       the still-coloured bar reads as glass. 0 disables. */
    wrapFadeOut: 0,
    /* Chips: flat accent rectangles in a darker ink, living entirely in SCREEN
       space. They have no depth at all — no projection, no perspective scaling,
       no depth fade, and they do not ride the field's travel. But they are NOT
       a layer on top: each one is spliced into the bar draw order at its own
       fixed depth, so slabs pass in front of some and behind others. Flat in
       shape, interleaved in stacking. They drift on their own slow clock.
       Sizes are fractions of the viewport so they hold across a resize. */
    chips: 0, chipCol: '#17287F',
    chipMinW: 0.035, chipMaxW: 0.22,   // width, as a fraction of viewport width
    chipMinH: 5, chipMaxH: 26,         // height in CSS px
    chipDrift: 0.012,                  // viewport widths per second
    // 0 = behind every bar, 1 = in front of every bar
    chipDepthMin: 0.12, chipDepthMax: 0.95,
    /* Words: lines of type flying down the same corridor. They live in the
       field proper, not on top of it — same cloud, same wrap, same depth fade,
       projected through the same point — so each one is spliced into the bar
       order at its own depth and slabs pass in front of it and behind it.

       Every word is laid along the line from the vanishing point out through
       its own position, which is the axis the bars converge on, so the type
       streams out of the knot rather than lying flat across the frame.

       White fill, hairline in the ink: over the white ground the outline is
       what carries it, over a blue slab the fill is. Either way it reads, which
       a single-colour word cannot do on a field that is both. */
    words: [], wordCount: 0,
    wordFill: '#ffffff', wordStroke: '#024AD8', wordEdge: 1,
    wordFamily: '"IBM Plex Mono",ui-monospace,monospace', wordWeight: 500,
    wordSize: 150,        // cap height in world units; screen px = wordSize * f/z
    wordSpread: 1,        // radius multiplier against the bar cloud
    /* Below the floor the outline is thicker than the letter it is drawing and
       the word turns to grit; above the ceiling it is a wall of type crossing
       the frame. Outside both it is simply not drawn — it is about to wrap
       either way. */
    wordMinPx: 13, wordMaxPx: 320,
    // view
    fov: 62, vpX: 0.86, vpY: 0.52,
    // style
    col: '#024AD8', bg: '#ffffff', wash: 0.34, washCol: '#5C7BE6', washR: 0.55,
    /* Falloff of the bloom. A plain 2-stop gradient has a flat core and a hard
       shoulder; this is a gaussian normalised to reach exactly zero at washR,
       so the light disperses instead of stopping. Lower = softer and wider. */
    washSoft: 3,
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
    this.clock = 0;          // chips drift on this, not on travel
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
      next.thick != null || next.thickVar != null || next.flat != null || next.flatVar != null ||
      next.chips != null || next.chipMinW != null || next.chipMaxW != null ||
      next.chipMinH != null || next.chipMaxH != null ||
      next.chipDepthMin != null || next.chipDepthMax != null ||
      next.words != null || next.wordCount != null || next.wordSpread != null)) {
      this.bars = null;
    }
    return this;
  };

  ExtrusionField.prototype._cacheColors = function () {
    var P = this.P;
    this.COL = hex(P.col);
    this.BG = hex(P.bg);
    this.WASH = hex(P.washCol);
    this.EDGE = hex(P.edgeCol);
    this.CHIP = hex(P.chipCol);
    this.WFILL = hex(P.wordFill);
    this.WSTROKE = hex(P.wordStroke);
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

    /* Their own stream from the same generator, so a seed reproduces both. */
    var chips = [];
    for (var c = 0; c < Math.round(P.chips); c++) {
      var ang = r() * TAU;
      chips.push({
        // start positions span a margin past each edge so a chip is already
        // off-screen by the time its drift wraps it — no pop at the border
        nx: r(), ny: r(),
        // width biased small, so most are stubs and a few run long
        w: lerp(P.chipMinW, P.chipMaxW, Math.pow(r(), 1.7)),
        // height picked independently of width — that is what makes the set
        // read as varied rather than as one shape at several scales
        h: lerp(P.chipMinH, P.chipMaxH, Math.pow(r(), 1.4)),
        vx: Math.cos(ang) * lerp(0.35, 1, r()),
        vy: Math.sin(ang) * lerp(0.35, 1, r()) * 0.45,
        layer: lerp(P.chipDepthMin, P.chipDepthMax, r())
      });
    }
    this.chips = chips;

    /* Drawn from the same generator AFTER the bars and the chips, so adding
       words cannot move a single slab: a seed still reproduces the corridor it
       always did, and the type is a new stream on the end of it. */
    var words = [], src = P.words || [];
    for (var q = 0; src.length && q < Math.round(P.wordCount); q++) {
      words.push({
        th: r() * TAU,
        /* Floored well outside the bars' own hole. A word that spawns on the
           view axis sits ON the vanishing point, where its own perspective
           scale is smallest and the wash is brightest — it arrives as a smudge
           in the middle of the knot and grows into the reader's face. */
        rad: lerp(Math.max(P.hole, 0.18), 1, Math.pow(r(), Math.max(0.05, P.clump))),
        base: lerp(P.zNear, P.zFar, Math.pow(r(), Math.max(0.05, P.zPow))),
        text: src[Math.floor(r() * src.length) % src.length],
        x: 0, y: 0, z0: 0
      });
    }
    this.words = words;
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

    /* One falloff curve, used by BOTH the painted gradient and bgAt below. If
       they ever disagree, every bar is mixed toward a background colour that
       is not the one actually behind it, and the field separates from its own
       wash. */
    var K = Math.max(0.2, P.washSoft), E = Math.exp(-K), N = 1 - E;
    function fall(u) {
      if (u >= 1) return 0;
      if (u <= 0) return 1;
      return (Math.exp(-K * u * u) - E) / N;
    }

    // the colour actually sitting behind a point on the canvas — bg plus wash
    function bgAt(x, y) {
      if (wash <= 0) return BG;
      return mix(BG, WASH, wash * fall(Math.hypot(x - px, y - py) / washR));
    }

    ctx.clearRect(0, 0, W, H);
    if (!P.transparent) { ctx.fillStyle = css(BG); ctx.fillRect(0, 0, W, H); }
    if (wash > 0) {
      var g = ctx.createRadialGradient(px, py, 0, px, py, washR);
      // sampled rather than 2-stop, so the curve above is what actually paints
      for (var gs = 0; gs <= 16; gs++) {
        var gu = gs / 16;
        g.addColorStop(gu, 'rgba(' + WASH[0] + ',' + WASH[1] + ',' + WASH[2] + ',' +
          (wash * fall(gu)).toFixed(4) + ')');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // advance every bar, wrapping far→near so the stream never runs out
    var bars = this.bars, travel = this.travel, i, b, wi;
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

    /* Bucket each chip against the bar it should appear directly in front of.
       Drawing is otherwise strictly far-to-near, so this is all the ordering
       control a flat mark needs. */
    var self = this, chipAt = null;
    if (this.chips && this.chips.length && bars.length) {
      chipAt = {};
      var ct = this.clock * P.chipDrift, CSPAN = 1.4, COFF = -0.2;
      for (var ci = 0; ci < this.chips.length; ci++) {
        var cch = this.chips[ci];
        var slot = clamp(Math.floor(cch.layer * bars.length), 0, bars.length - 1);
        (chipAt[slot] || (chipAt[slot] = [])).push(cch);
      }
    }

    /* Words ride the same loop as the bars, then merge into their draw order.
       Both lists are sorted far-to-near, so one walk down the bars is enough to
       find, for each word, the first bar standing in front of it — that index
       is the word's slot. A word nearer than every bar lands in the slot past
       the end of the array and is painted after the loop. */
    var words = this.words, wordAt = null;
    if (words && words.length) {
      for (i = 0; i < words.length; i++) {
        var wd = words[i];
        var wz = P.zNear + (((wd.base - travel - P.zNear) % span) + span) % span;
        var wopen = lerp(1, P.cone, (wz - P.zNear) / span);
        wd.z0 = wz;
        wd.x = Math.cos(wd.th) * wd.rad * P.spread * P.aspectXY * wopen * P.wordSpread;
        wd.y = Math.sin(wd.th) * wd.rad * P.spread * wopen * P.wordSpread;
      }
      words.sort(function (a, c) { return c.z0 - a.z0; });
      wordAt = {};
      for (i = 0, wi = 0; i < words.length; i++) {
        while (wi < bars.length && bars[wi].z > words[i].z0) wi++;
        (wordAt[wi] || (wordAt[wi] = [])).push(words[i]);
      }
    }
    function paintChips(list) {
      ctx.fillStyle = css(self.CHIP);
      for (var q = 0; q < list.length; q++) {
        var ch = list[q];
        var cw = ch.w * W;
        var ux = COFF + (((ch.nx + ch.vx * ct) % CSPAN) + CSPAN) % CSPAN;
        var uy = COFF + (((ch.ny + ch.vy * ct) % CSPAN) + CSPAN) % CSPAN;
        var rx = ux * W - cw / 2, ry = uy * H - ch.h / 2;
        ctx.fillRect(rx, ry, cw, ch.h);
        if (P.edge > 0) {
          // the same hairline the bars carry, so the marks belong to the set
          ctx.strokeStyle = P.edgeCol;
          ctx.lineWidth = P.edge;
          ctx.strokeRect(rx, ry, cw, ch.h);
        }
      }
    }

    var C = new Array(8), minA = P.minPx * P.minPx, EDGE = this.EDGE;
    // capped: the two ramps must not overlap, or every bar is permanently faded
    var wf = Math.min(P.wrapFade, 0.45) * span;

    /* How far outside the frame a point has drifted, 1 inside → 0 a full margin
       out. Smoothstepped so there is no moment the dissolve starts or stops. */
    var ef = P.borderFade, efx = W * ef, efy = H * ef;
    function edgeAt(x, y) {
      var ox = Math.max(0, -x, x - W) / efx;
      var oy = Math.max(0, -y, y - H) / efy;
      var t = 1 - Math.max(ox, oy);
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t * t * (3 - 2 * t);
    }
    ctx.lineJoin = 'round';

    /* One word. The angle is the ray from the vanishing point out through the
       word's own position — the same line its neighbouring bars are drawn
       along — flipped by half a turn on the left of the frame so the type is
       never upside down. Everything else is the bar's own treatment: the depth
       fade, the wrap ramp, the border ramp, and a fill mixed toward whatever
       the wash has put behind it, so a word dissolves into the corridor rather
       than floating over it. */
    function paintWords(list) {
      for (var q = 0; q < list.length; q++) {
        var wd = list[q], sc = f / wd.z0, size = P.wordSize * sc;
        if (size < P.wordMinPx || size > P.wordMaxPx) continue;
        var sx = px + wd.x * sc, sy = py + wd.y * sc;

        var a = clamp(1 - P.fade * Math.pow(clamp((wd.z0 - P.zNear) / span, 0, 1), pw), 0, 1);
        if (wf > 0) {
          var wr = Math.min((wd.z0 - P.zNear) / wf, (P.zFar - wd.z0) / wf);
          if (wr <= 0) continue;
          if (wr < 1) a *= wr * wr * (3 - 2 * wr);
        }
        if (ef > 0) a *= edgeAt(sx, sy);
        if (a <= 0.02) continue;

        var ang = Math.atan2(sy - py, sx - px);
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        var behind = bgAt(sx, sy);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.font = P.wordWeight + ' ' + size.toFixed(1) + 'px ' + P.wordFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        /* Stroke first, fill over it: the other way round the outline eats into
           the letterform and a word at 14px closes up into a blue smear. */
        if (P.wordEdge > 0) {
          ctx.lineWidth = P.wordEdge;
          ctx.strokeStyle = css(mix(self.WSTROKE, behind, 1 - a));
          ctx.strokeText(wd.text, 0, 0);
        }
        ctx.fillStyle = css(mix(self.WFILL, behind, 1 - a));
        ctx.fillText(wd.text, 0, 0);
        ctx.restore();
      }
    }

    var drawn = 0;

    for (i = 0; i < bars.length; i++) {
      ctx.globalAlpha = 1;   // wrapFadeOut sets it per bar; chips and words stay opaque
      if (chipAt && chipAt[i]) paintChips(chipAt[i]);
      if (wordAt && wordAt[i]) paintWords(wordAt[i]);
      b = bars[i];
      if (b.z0 < 24) continue;

      var hw = b.hw, hh = b.hh;

      // project the 8 corners once
      var vis = false;
      for (var s = 0; s < 8; s++) {
        var cx = b.x + (s & 1 ? hw : -hw);
        var cy = b.y + (s & 2 ? hh : -hh);
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

      /* One factor for the whole bar, driven by z0 — the coordinate that
         actually wraps — so a bar dissolves as a unit rather than shearing. */
      var oNear = 1, oFar = 1;
      if (P.wrapFadeOut > 0 && wf > 0) {
        var wo = (b.z0 - P.zNear) / (wf * P.wrapFadeOut);
        if (wo < 1) oNear = oFar = wo <= 0 ? 0 : wo * wo * (3 - 2 * wo);
      }
      if (wf > 0) {
        var w = Math.min((b.z0 - P.zNear) / wf, (P.zFar - b.z0) / wf);
        if (w <= 0) continue;
        if (w < 1) {
          // smoothstep, so the dissolve has no visible start or end
          w = w * w * (3 - 2 * w);
          if (P.wrapFadePow !== 1) w = Math.pow(w, P.wrapFadePow);
          aNear *= w; aFar *= w;
        }
      }

      var nf = f / b.z0, ff = f / zf;
      var nx = px + b.x * nf, ny = py + b.y * nf;
      var fx = px + b.x * ff, fy = py + b.y * ff;

      if (ef > 0) {
        aNear *= edgeAt(nx, ny);
        aFar *= edgeAt(fx, fy);
        // with wrapFadeOut a background-coloured bar still covers what is
        // behind it until its opacity is gone, so keep drawing it till then
        if (aNear <= 0.002 && aFar <= 0.002 && !(P.wrapFadeOut > 0 && oNear > 0.002)) continue;
      }

      ctx.globalAlpha = oNear;
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
          var poly4 = [q0, q1, q2, q3];
          ctx.beginPath();
          ctx.moveTo(q0.px, q0.py); ctx.lineTo(q1.px, q1.py);
          ctx.lineTo(q2.px, q2.py); ctx.lineTo(q3.px, q3.py);
          ctx.closePath();
          ctx.fillStyle = P.grad > 0
            ? this._grad(nx, ny, fx, fy, base, behindN, behindF, aNear, aFar, poly4)
            : css(mix(base, behindN, 1 - aNear));
          ctx.fill();
          if (P.edge > 0) {
            ctx.strokeStyle = P.edgeFade
              ? this._grad(nx, ny, fx, fy, EDGE, behindN, behindF, aNear, aFar, poly4)
              : P.edgeCol;
            ctx.lineWidth = P.edge;
            ctx.stroke();
          }
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
            ? this._grad(nx, ny, fx, fy, this.COL, behindN, behindF, aNear, aFar, h2)
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
    // nearer than every bar, so nothing was left to paint them in front of
    ctx.globalAlpha = 1;
    if (wordAt && wordAt[bars.length]) paintWords(wordAt[bars.length]);
    this.drawn = drawn;
  };

  /* The ramp is laid across THE FACE, not across the bar's end-to-end line.
     Those two are not the same thing: when a bar's near and far ends project
     close together but its face is large, a gradient built on that short line
     squeezes the whole transition into a narrow band and holds flat colour
     either side of it — which is exactly the hard diagonal edge. Projecting the
     face's own corners onto the gradient axis and spanning that instead means
     the transition always uses the full width of the shape, and nothing clamps
     inside it. */
  ExtrusionField.prototype._grad = function (x0, y0, x1, y1, base, behindN, behindF, aN, aF, pts) {
    var dx = x1 - x0, dy = y1 - y0;
    var L = Math.hypot(dx, dy);
    var cN = mix(base, behindN, 1 - aN), cF = mix(base, behindF, 1 - aF);
    // bar pointing straight at the camera — no axis to ramp along
    if (L < 0.01) return css(cN);

    var ux = dx / L, uy = dy / L;
    var smin = Infinity, smax = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      var sp = (pts[i].px - x0) * ux + (pts[i].py - y0) * uy;
      if (sp < smin) smin = sp;
      if (sp > smax) smax = sp;
    }

    // face is edge-on to the axis: one flat tone at its own position on the bar
    if (smax - smin < 0.5) {
      return css(mix(cN, cF, clamp((smin + smax) * 0.5 / L, 0, 1)));
    }

    var g = this.ctx.createLinearGradient(
      x0 + ux * smin, y0 + uy * smin,
      x0 + ux * smax, y0 + uy * smax);

    var n = Math.max(2, this.P.gradStops), sp2 = smax - smin;
    for (var k = 0; k <= n; k++) {
      var u = k / n;
      // back into the bar's own 0..1 span, then eased — a straight linear ramp
      // is what the eye catches as an edge
      var t = clamp((smin + sp2 * u) / L, 0, 1);
      t = t * t * (3 - 2 * t);
      g.addColorStop(u, css(mix(cN, cF, t)));
    }
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
    this.clock += dt;
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

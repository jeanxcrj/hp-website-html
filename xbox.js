/* Extruded box — the field's geometry applied to a DOM element.

   A button is drawn as a slab receding toward the SAME vanishing point the
   field converges on, so the CTA and the background agree about where the
   camera is. The maths is the one screen-space fact that makes this cheap:
   an axis-aligned box receding along the view axis contracts UNIFORMLY toward
   the vanishing point, so the far face is just the near rect scaled about the
   VP. No 3D transform needed, and it stays exact at any viewport size.

   Face tones and the white hairline are lifted straight from field.js so a
   button and a bar shade identically. */

(function (global) {
  'use strict';

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function hex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  var NS = 'http://www.w3.org/2000/svg';

  var DEF = {
    col: '#1E44D6',
    bg: '#ffffff',
    edgeCol: '#ffffff',
    edge: 1,
    faceShade: 0.34,   // same contrast knob as the field
    depth: 0.055,      // how far the slab recedes, as a fraction of its own size
    hoverDepth: 0.105, // thicker on hover — the box leans toward you
    ease: 0.14,
    // where the vanishing point sits, in viewport fractions. Overwritten live
    // by site.js so it tracks the field's own (parallaxed) vanishing point.
    vpX: 0.86, vpY: 0.5
  };

  function ExtrudedBox(el, opts) {
    this.el = el;
    this.P = Object.assign({}, DEF, opts || {});
    this.k = this.P.depth;
    this.kTarget = this.P.depth;

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'xbox__svg');
    svg.setAttribute('aria-hidden', 'true');
    // overflow must stay visible: the extrusion legitimately draws outside the
    // element's own box, and clipping it would shear the slab off
    svg.style.overflow = 'visible';
    this.svg = svg;
    el.insertBefore(svg, el.firstChild);

    this._tone();
    var self = this;
    el.addEventListener('pointerenter', function () { self.kTarget = self.P.hoverDepth; });
    el.addEventListener('pointerleave', function () { self.kTarget = self.P.depth; });
    el.addEventListener('focus', function () { self.kTarget = self.P.hoverDepth; });
    el.addEventListener('blur', function () { self.kTarget = self.P.depth; });
  }

  ExtrudedBox.prototype._tone = function () {
    var P = this.P, COL = hex(P.col), BG = hex(P.bg);
    this.COL = COL;
    this.BG = BG;
    this.EDGE = P.edgeCol;
    // FACE tonal steps from field.js: front 1, left/right .62, top/bottom .34
    this.sideCol = css(mix(COL, BG, (1 - 0.62) * P.faceShade));
    this.capCol = css(mix(COL, BG, (1 - 0.34) * P.faceShade));
    this.faceCol = css(COL);
  };

  ExtrudedBox.prototype.set = function (next) {
    Object.assign(this.P, next);
    if (next && (next.col || next.bg || next.faceShade != null || next.edgeCol)) this._tone();
    return this;
  };

  ExtrudedBox.prototype.draw = function () {
    var el = this.el, P = this.P;
    var r = el.getBoundingClientRect();
    var w = r.width, h = r.height;
    if (!w || !h) return;

    this.k += (this.kTarget - this.k) * P.ease;

    // vanishing point in the element's own coordinate space
    var vx = P.vpX * global.innerWidth - r.left;
    var vy = P.vpY * global.innerHeight - r.top;

    // uniform contraction toward the VP is exactly what perspective does to an
    // axis-aligned box receding along the view axis
    var s = clamp(1 - this.k, 0.2, 0.999);
    var N = [[0, 0], [w, 0], [w, h], [0, h]];
    var F = N.map(function (p) { return [vx + (p[0] - vx) * s, vy + (p[1] - vy) * s]; });

    var parts = [];
    var stroke = ' stroke="' + this.EDGE + '" stroke-width="' + P.edge + '" stroke-linejoin="round"';

    for (var i = 0; i < 4; i++) {
      var j = (i + 1) % 4;
      var q = [N[i], N[j], F[j], F[i]];
      // signed area — backface cull, same test the field runs on its six faces
      var a = 0;
      for (var m = 0; m < 4; m++) {
        var b = q[(m + 1) % 4];
        a += q[m][0] * b[1] - b[0] * q[m][1];
      }
      if (a >= 0) continue;                       // facing away, hidden behind the front face
      // edges 0 and 2 are the horizontal ones → the flatter top/bottom tone
      var tone = (i % 2 === 0) ? this.capCol : this.sideCol;
      parts.push('<polygon points="' + q.map(function (p) {
        return Math.round(p[0] * 100) / 100 + ',' + Math.round(p[1] * 100) / 100;
      }).join(' ') + '" fill="' + tone + '"' + stroke + '/>');
    }

    // the near face last, so it caps the slab
    parts.push('<polygon points="' + N.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      '" fill="' + this.faceCol + '"' + stroke + '/>');

    this.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);
    this.svg.innerHTML = parts.join('');
  };

  ExtrudedBox.DEF = DEF;
  global.ExtrudedBox = ExtrudedBox;
})(window);

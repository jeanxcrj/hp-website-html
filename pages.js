/* Everything that draws itself out of tour.js.

   The schedule, the speaker slots, the band's campus menu and the registration
   page are all the same twelve rows seen from different angles, so they are
   built here rather than typed into three files by hand. Typing them by hand
   is how a stop ends up on the schedule with no registration page behind it. */
(function (global) {
  'use strict';

  var T = global.TOUR;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* A field nobody has filled in yet renders as its own label, greyed — so the
     gap is visible as a gap instead of as an accidentally empty line. */
  function or(v, placeholder) {
    return v ? esc(v) : '<span class="tbc">' + esc(placeholder) + '</span>';
  }

  /* ---------- the schedule, as cards ----------
     The schedule and the registration list were the same twelve rows printed
     twice — one as a table you read, one as cards you clicked. They are one
     thing now: one grid of cards carrying the date and the campus, each linking
     at its own registration page. The band's REGISTER opens the same list as a
     menu, so the campus you want is one click from anywhere on the site.

     The staging day has no card. It is on the planning sheet because the trucks
     move that day, not because anyone can come to it. */
  /* One form, two errands. Register and Workshop ask a student for exactly the
     same six things; only the button and the one open question differ, so those
     are arguments rather than a second copy of the form — the comment under
     reg__fields already warns that two spellings of one form is two forms to
     keep in step. data-kind rides along so the acknowledgement can name which
     errand was sent without re-reading the URL. */
  function fields(stop, kind) {
    var ws = kind === 'workshop';
    return '<form class="rform" novalidate data-stop="' + esc(stop.slug) + '"' +
      ' data-kind="' + (ws ? 'workshop' : 'register') + '">' +
      '<label class="field"><span>FULL NAME</span>' +
        '<input name="name" autocomplete="name" required></label>' +
      '<label class="field"><span>EMAIL</span>' +
        '<input name="email" type="email" autocomplete="email" required></label>' +
      '<label class="field"><span>SCHOOL</span>' +
        '<input name="school" value="' + esc(stop.school) + '"></label>' +
      '<label class="field"><span>YEAR AND PROGRAMME</span>' +
        '<input name="year" placeholder="e.g. 3rd year, B.Arch"></label>' +
      '<label class="field field--wide"><span>' +
        (ws ? 'WHAT DO YOU WANT TO WORK ON?' : 'WHAT ARE YOU BRINGING?') + '</span>' +
        '<textarea name="project" placeholder="' + (ws
          ? 'The thing you would put on a bench for two hours. Optional.'
          : 'A project and an idea of where it is stuck. Optional.') +
        '"></textarea></label>' +
      '<label class="check field--wide"><input type="checkbox" name="updates">' +
        '<span>Email me if this date moves. Half the calendar is still being agreed.</span>' +
        '</label>' +
      '<div class="field--wide"><button class="send" type="submit">' +
        (ws ? 'REGISTER FOR THE WORKSHOP' : 'REGISTER') + '</button>' +
        '<p class="sent" hidden></p></div>' +
      '</form>';
  }

  function cards(el) {
    if (!el) return;
    var open = T.stops.filter(function (s) { return !s.staging; });
    /* add, not assign: on the index this container already carries .rise, and
       overwriting className would silently drop it out of the reveal */
    el.classList.add('rcards');
    el.innerHTML = open.map(function (s) {
      var bill = T.speakersFor(s);
      return '<article class="rcard" id="stop-' + esc(s.slug) + '">' +
        '<div class="rcard__top"><p class="rcard__date">' + esc(numDate(s.date)) + '</p></div>' +
        /* Where it is, as one block: the campus and the room it happens in are
           one answer, so they sit tight together and the card's spacing treats
           them as a single group. */
        '<div class="rcard__where">' +
          '<h3 class="rcard__name">' + esc(s.school) + '</h3>' +
          (s.venue ? '<p class="rcard__venue">' + esc(s.venue) + '</p>' : '') +
        '</div>' +
          /* Chapter and bill, one line. The chapter used to sit above the
             campus as its own eyebrow, which split the card into four loose
             bands and put the host body further from the speakers it hosts
             than from the date. Both of these say who is behind THIS evening —
             the grid below is the whole tour's bill — so they read as one line
             with a rule between them, and the name and its venue close up into
             the single block they always were. Either half can be missing: a
             stop with no chapter, or none assigned yet, drops its half and the
             separator with it rather than leaving a dangling bar. */
          (function () {
            var meta = [];
            if (s.chapter) meta.push(esc(s.chapter));
            if (bill.length) {
              meta.push('Speakers: ' +
                esc(bill.map(function (sp) { return sp.name; }).join(', ')));
            }
            return meta.length
              ? '<p class="rcard__bill">' +
                  meta.join('<span class="rcard__sep">|</span>') + '</p>'
              : '';
          }()) +
        '<div class="rcard__actions">' +
          '<a class="rcard__go" href="register.html?stop=' + encodeURIComponent(s.slug) + '">' +
            'REGISTER</a>' +
          '<a class="rcard__go rcard__go--workshop" href="workshop.html?stop=' + encodeURIComponent(s.slug) + '">' +
            'WORKSHOP REGISTRATION</a>' + 
        '</div>' +
        /** 
        '<div class="rcard__workshop">' +
          (s.exhibitionName
            ? '<div class="rcard__exhibition">' +
                '<p class="rcard__exhibition-name">' + esc(s.exhibitionName) + '</p>' +
                (s.exhibitionDescription
                  ? '<p class="rcard__exhibition-description">' + esc(s.exhibitionDescription) + '</p>'
                  : '') +
              '</div>'
            : '') +
        '</div>' + */
        '</article>';
    }).join('');

  }

  /* No endpoint exists yet. Saying so beats a success state for something that
     did not happen — point the form at a real action and delete this. Delegated
     from a container rather than bound per form, because the cards build their
     forms from tour.js and there is no moment where all of them exist to bind. */
  function wireSubmit(scope) {
    scope.addEventListener('submit', function (e) {
      var form = e.target.closest('.rform');
      if (!form) return;
      e.preventDefault();
      var stop = T.bySlug(form.dataset.stop);
      var out = form.querySelector('.sent');
      out.hidden = false;
      var ws = form.dataset.kind === 'workshop';
      out.textContent = 'Not submitted — this form has no endpoint behind it yet. ' +
        (ws ? 'Workshop places for ' : 'Registration for ') +
        (stop ? T.stopName(stop) : 'this stop') +
        (ws ? ' open once the date is confirmed.' : ' opens once the date is confirmed.');
    });
  }

  /* ---------- gallery ----------
     One row, filterable by campus. The filter is the reason this is not just a
     strip of pictures: eleven stops will produce more photographs than anyone
     scrolls through, and the question people actually arrive with is "what did
     my campus look like".

     It works before there is anything to filter. With TOUR.photos empty every
     campus falls through to the same empty template, and the caption names the
     campus you picked — so the control visibly answers rather than looking
     broken, and it needs no second code path once the photographs land. */
  var TILES = 4;

  function gallery(el) {
    if (!el) return;
    el.classList.add('gal');   // carries the grid's column count and gap
    var campuses = [];
    var seen = {};
    T.stops.forEach(function (st) {
      if (st.staging || seen[st.school]) return;
      seen[st.school] = true;
      campuses.push(st.school);
    });

    var CHEV = '<svg width="11" height="7" viewBox="0 0 11 7" aria-hidden="true">' +
      '<path d="M1 1l4.5 4.5L10 1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

    el.innerHTML =
      '<div class="galpick">' +
        '<div class="galpick__top">' +
          '<p class="galpick__label">SORT BY SCHOOL</p>' +
          '<p class="gal__soon" id="gal-note"></p>' +
        '</div>' +
        '<div class="galpick__wrap">' +
          '<button class="galpick__btn" type="button" aria-expanded="false" ' +
            'aria-controls="gal-menu"><span id="gal-current">All campuses</span>' +
            CHEV + '</button>' +
          '<div class="navdrop galdrop" id="gal-menu" hidden>' +
            ['', ].concat(campuses).map(function (c) {
              return '<a href="#gallery" data-school="' + esc(c) + '">' +
                esc(c || 'All campuses') + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid" id="gal-grid"></div>';

    var grid = el.querySelector('#gal-grid');
    var note = el.querySelector('#gal-note');
    var btn = el.querySelector('.galpick__btn');
    var menu = el.querySelector('#gal-menu');
    var current = el.querySelector('#gal-current');
    var school = '';

    function open(on) {
      menu.hidden = !on;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    function draw() {
      current.textContent = school || 'All campuses';
      var shots = (T.photos || []).filter(function (ph) {
        return !school || ph.school === school;
      });

      if (shots.length) {
        note.textContent = shots.length + (shots.length === 1 ? ' PHOTO' : ' PHOTOS');
        grid.innerHTML = shots.map(function (ph) {
          return '<div class="shot"><img src="' + esc(ph.src) + '" alt="' +
            esc(ph.alt || ph.school || '') + '"><span class="shot__soon">Coming Soon</span></div>';
        }).join('');
        return;
      }

      /* Nothing for this campus — or nothing at all yet. Same template either
         way; only the caption knows the difference. */
      note.textContent = (school ? school.toUpperCase() + ' — ' : '') +
        'PHOTOS COMING SOON';
      var tiles = '';
      for (var i = 0; i < TILES; i++) {
        tiles += '<div class="shot shot--empty"><span class="shot__soon">Coming Soon</span></div>';
      }
      grid.innerHTML = tiles;
    }

    /* Click, not hover. The band's menu opens on hover because it is navigation
       you are reaching for; this one is full-bleed across the section, and a
       panel that drops every time the pointer crosses the gallery on its way
       down the page is a trapdoor. */
    btn.addEventListener('click', function () { open(menu.hidden); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      school = a.dataset.school || '';
      open(false);
      draw();
    });
    addEventListener('pointerdown', function (e) {
      if (!el.contains(e.target)) open(false);
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); }
    });

    draw();
  }

  /* ---------- socials ----------
     Three vertical slots for the social cuts, under the gallery. They are
     9:16 plates in the site's own border, not embeds: an Instagram iframe
     brings its own chrome, its own fonts and a login wall on a good day, and
     on a bad one it is a blank rectangle nobody notices has failed.

     A slot with a `src` plays it inline, muted and looping, the way a reel
     autoplays in a feed; a slot without one is an empty plate that still opens
     the account. Dropping the files into tour.js HYPE is the whole job. */
  function hype(el) {
    if (!el) return;
    el.classList.add('hype');
    el.innerHTML = (T.hype || []).map(function (v, i) {
      var n = i + 1;
      /* No file of our own yet: Instagram's player, which does load for a
         visitor who is not logged in. */
      if (!v.src && v.ig) {
        return '<div class="hype__slot hype__slot--ig">' +
          '<iframe src="https://www.instagram.com/p/' + encodeURIComponent(v.ig) + '/embed/" ' +
            'title="' + esc(v.title || 'Reel 0' + n) + '" loading="lazy" scrolling="no" ' +
            'allowtransparency="true" allow="autoplay; encrypted-media; picture-in-picture"></iframe>' +
          '</div>';
      }
      return '<a class="hype__slot" href="' + esc(v.href || '#') + '"' +
        (v.href ? ' target="_blank" rel="noopener"' : '') + '>' +
        (v.src
          ? '<video src="' + esc(v.src) + '" muted loop autoplay playsinline></video>'
          : '<span class="hype__empty">VIDEO 0' + n + '</span>') +
        '<span class="hype__cap">' + or(v.title, 'Reel 0' + n) + '</span>' +
        '</a>';
    }).join('');
  }

  /* ---------- speakers ---------- */
  function speakers(el) {
    if (!el) return;
    el.innerHTML = T.speakers.map(function (p) {
      var n = p.id < 10 ? '0' + p.id : '' + p.id;
      var venues = T.stopsFor(p).map(function (stop) { return stop.venue; }).filter(Boolean);
      return '<article class="spk__card">' +
        '<div class="spk__photo' + (p.photo ? ' has-photo' : '') + '">' +
          (p.photo
            ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.name || '') + '" loading="lazy">'
            /* the slot number is the label on an EMPTY plate; over a portrait it
               is a watermark on someone's face */
            : '<span>PHOTO ' + n + '</span>') +
        '</div>' +
        '<div class="spk__body">' +
          '<h3 class="spk__name">' + or(p.name, 'Speaker ' + n) + '</h3>' +
          /* Role and company, always both. A missing one draws as its own
             greyed slot rather than closing the line up — the gap is the point,
             and it is one field to fill in tour.js when the titles arrive. */
          '<p class="spk__role">' + or(p.role, 'Role') +
            '<span class="spk__dot"> · </span>' + or(p.company, 'Company') + '</p>' +
          '<p class="spk__bio">' + or(p.bio, T.speakerBio) + '</p>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------- workshops ----------
     One card per partner workshop, three across: the partner's logo on top,
     then the company, the workshop and what it covers. The per-campus register list follows, unchanged. */
  function workshops(el) {
    if (!el) return;
    var stops = T.stops.filter(function (s) { return !s.staging; });
    el.innerHTML =
      '<div class="workshop__speakers">' +
        (T.workshops || []).map(function (w) {
          return '<article class="workshop__speaker">' +
            '<div class="workshop__logo">' +
              (w.logo
                ? '<img src="' + esc(w.logo) + '" alt="' + esc(w.company) + '">'
                : '<span>WORKSHOP</span>') +
            '</div>' +
            '<div class="workshop__speaker-body">' +
              '<h3>' + or(w.company, 'Company') + '</h3>' +
              '<p class="workshop__speaker-role">' + or(w.name, 'Workshop name') + '</p>' +
              '<div class="workshop__copy">' +
                (w.description
                  ? [].concat(w.description).map(function (para) {
                      return '<p class="workshop__desc">' + esc(para) + '</p>';
                    }).join('')
                  : '<p class="workshop__desc">' + or(null, T.workshopDesc) + '</p>') +
                (w.note
                  ? '<p class="workshop__desc"><strong>NOTE:</strong> ' + esc(w.note) + '</p>'
                  : '') +
              '</div>' +
            '</div>' +
          '</article>';
        }).join('') +
      '</div>' +
      '<div class="workshop__list">' +
        '<div class="workshop__listhead">' +
          '<h3>Register</h3>' +
          '<p>Workshop places are limited at every stop. Find your school below.</p>' +
        '</div>' +
        stops.map(function (s) {
          return '<div class="workshop__row">' +
            '<div><h3>' + esc(s.school) + '</h3>' +
              '<p>' + esc(s.exhibitionName || 'Workshop') + '</p></div>' +
            '<a class="workshop__register" href="workshop.html?stop=' + encodeURIComponent(s.slug) + '">REGISTER</a>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  /* The planning sheet writes dates as "Oct 18–19"; the cards want them numeric,
     the way a ticket does. Derived rather than stored as a second field — two
     spellings of the same date in tour.js is two things to keep in step. */
  var MON = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function numDate(str) {
    var month = 0;
    return str.split('/').map(function (part) {
      part = part.trim();
      var m = part.match(/^([A-Za-z]{3})[a-z]*\s*(.*)$/);
      if (m && MON[m[1]]) { month = MON[m[1]]; part = m[2]; }
      if (!month) return part;
      return part.split(/[–-]/).map(function (d) {
        d = d.trim();
        return d ? pad(month) + '.' + pad(parseInt(d, 10)) : '';
      }).filter(Boolean).join('–');
    }).join(' / ');
  }

  /* ---------- registration ----------
     ?stop=<slug> opens one stop on its own, which is what a link shared into a
     chapter's group chat needs. With no slug — or one that does not match
     anything, which is what a stale link looks like — the page falls back to
     the same card grid the schedule uses, so the link still lands somewhere. */
  /* The campus, with its chapter stepped back. stopName() stays the plain-text
     join — it feeds document.title and the submit acknowledgement, where markup
     would show up as literal angle brackets — so the marked-up spelling is
     built here rather than by changing what stopName returns. */
  function stopHeading(stop) {
    return esc(stop.school) +
      (stop.chapter ? ' <span class="reg__chapter">' + esc(stop.chapter) + '</span>' : '');
  }

  function signup(root, kind) {
    if (!root) return;
    var ws = kind === 'workshop';
    var slug = new URLSearchParams(location.search).get('stop');
    var stop = slug ? T.bySlug(slug) : null;

    /* There is no standalone registration page any more — the schedule IS the
       registration list. These files survive only as the per-stop form a card
       links at; reached without a stop, or with one that no longer exists,
       they hand you back to the schedule rather than inventing a second list. */
    if (!stop) { location.replace('index.html#schedule'); return; }

    var name = T.stopName(stop);
    document.title = (ws ? 'Workshop' : 'Register') + ' · ' + name +
      ' — HP USA College Tour 2026';
    root.innerHTML =
      '<h2>' + stopHeading(stop) + '</h2>' +
      '<div class="reg">' +
        '<div class="reg__meta">' +
          '<div class="reg__line"><b>SCHOOL</b><span>' + esc(stop.school) + '</span></div>' +
          '<div class="reg__line"><b>CHAPTER</b><span>' + esc(stop.chapter || '—') + '</span></div>' +
          '<div class="reg__line"><b>DATE</b><span>' + esc(stop.date) + '</span></div>' +
          /* The session, as another row of the same panel. It was a kicker
             beside the h2 for a moment; in the panel it sits with the school,
             the chapter and the date — the four facts about this evening, read
             the same way, instead of one of them being set apart as a
             subtitle. The name and the blurb are already on the stop: they
             were written for the schedule card and commented out of it, and
             this is the page they describe. A stop with neither gets no row
             rather than an empty one. */
          (ws && (stop.exhibitionName || stop.exhibitionDescription)
            ? '<div class="reg__line reg__line--ws"><b>WORKSHOP</b><span>' +
                esc(stop.exhibitionName || 'Workshop') +
                (stop.exhibitionDescription
                  ? '<span class="reg__wsnote">' + esc(stop.exhibitionDescription) + '</span>'
                  : '') +
              '</span></div>'
            : '') +
        '</div>' +
        /* the same fields the cards open, from the same function — two spellings
           of one form is two forms to keep in step */
        '<div class="reg__fields">' + fields(stop, kind) + '</div>' +
      '</div>';
    wireSubmit(root);
  }

  function register(root) { signup(root, 'register'); }
  function workshop(root) { signup(root, 'workshop'); }

  /* ---------- the corridor, on a sub-page ----------
     The index flies down the corridor and freezes it; a sub-page has no hero to
     fly through, so it opens on the frozen wireframe directly. These are the
     values applyMorph() lands on at the end of the index's whiten — fills the
     same white as the ground, hairline in the ink, every fade off — copied as a
     starting state rather than run as an animation nobody would see.

     Both fade ramps have to stay at 0. They mix the OUTLINE as well as the
     fill, so a ramped slab gets an edge that dissolves partway along itself
     while its white fill stays solid: a half-drawn shape.

     No rAF: speedScale is 0 and nothing else moves, so a loop would redraw
     identical geometry sixty times a second. Scroll drives travel and asks for
     one frame. */
  function backdrop(canvas) {
    if (!canvas || !global.ExtrusionField) return;
    /* Off, with the index's. wordCount is 0 below and 10 was the tuning — fewer
       than the hero carries, because this field is at fov 28, which magnifies
       everything about the vanishing point, and the page's own plate is sitting
       on top. Switch the two back on together or a sub-page's frozen corridor
       stops being the index's frozen corridor. */
    var words = ['WIN A FREE LAPTOP', 'STUDENT EXHIBITIONS', 'OPEN BENCHES',
      'EXPLORING TOMORROW', 'EMPOWERING TODAY'];
    T.stops.forEach(function (st) {
      words.push(st.school.replace(/^University of /, '').toUpperCase());
    });
    var field = new global.ExtrusionField(canvas, {
      count: 220, seed: 12,
      spread: 1500, aspectXY: 1.15, clump: 0.55, hole: 0.13, cone: 0.55,
      zNear: 620, zFar: 10000, zPow: 1.35,
      lenMin: 900, lenMax: 5600, lenDepth: 0.8,
      thick: 400, thickVar: 0.5, flat: 0.30, flatVar: 0.6,
      faces: true, faceShade: 0,
      fade: 0, grad: 0, wrapFade: 0, borderFade: 0,
      minPx: 4, edge: 0.52, edgeCol: '#024AD8', edgeFade: true,
      chips: 0,
      fov: 28, vpX: 0.37, vpY: 0.58,
      col: '#ffffff', bg: '#ffffff', wash: 0,
      words: words, wordCount: 0, wordSize: 108, wordSpread: 1.12,
      wordMinPx: 12, wordMaxPx: 230,
      wordFill: '#ffffff', wordStroke: '#024AD8', wordEdge: 1,
      wordFamily: '"forma-djr-mono",ui-monospace,SFMono-Regular,Menlo,monospace',
      speed: 0, parallax: 0, ease: 0.05
    });
    field.speedScale = 0;

    var SCRUB = 2.4;              // world units per pixel of scroll, as on the index
    var base = field.travel, queued = false;
    function paint() {
      queued = false;
      field.travel = base + scrollY * SCRUB;
      field.draw();
    }
    function ask() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', function () { field.resize(); paint(); });
    if (document.fonts) document.fonts.ready.then(paint);
    paint();
  }

  /* ---------- the register menu ----------
     REGISTER in the band opens the campus list rather than going to a page that
     is itself only a list. The anchor keeps its href: with no JS it is still a
     link to the registration page, and the menu is the enhancement on top.

     Built here rather than written into three <header>s, because it is the tour
     and the tour lives in tour.js — a stop added there appears in the menu on
     every page without anyone remembering to update a nav. */
  function nav(bar) {
    if (!bar) return;
    var btn = bar.querySelector('.host');
    if (!btn) return;

    var wrap = document.createElement('div');
    wrap.className = 'nav__wrap';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    /* One entry per campus, not per stop. Without the chapter beside it, UPenn
       and NYU would each appear twice as the same words — so they collapse to
       one, pointing at the first of their two dates. The schedule below still
       shows both, which is where the difference actually matters. */
    var seen = {}, campuses = [];
    T.stops.forEach(function (st) {
      if (st.staging || seen[st.school]) return;
      seen[st.school] = true;
      campuses.push(st);
    });

    var menu = document.createElement('div');
    menu.className = 'navdrop';
    menu.id = 'nav-register';
    menu.hidden = true;
    /* Straight to that campus's form. The menu is a shortcut past the schedule,
       not a way of scrolling to a card in it — someone who already knows their
       campus should not have to find it in a grid first. */
    menu.innerHTML = campuses.map(function (st) {
      return '<a href="register.html?stop=' + encodeURIComponent(st.slug) + '">' +
        esc(st.school) + '</a>';
    }).join('');
    wrap.appendChild(menu);

    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', menu.id);

    var shutTimer = null;
    function open(on) {
      clearTimeout(shutTimer);
      menu.hidden = !on;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    /* Hover on a pointer that can hover; tap and keyboard still toggle, because
       a menu that only opens on hover is a menu a phone cannot open at all.
       The close is delayed: the panel sits flush under the button, but a
       diagonal path to the far column still leaves the wrap for a frame or two
       and an immediate close makes the menu impossible to reach. */
    if (matchMedia('(hover:hover)').matches) {
      wrap.addEventListener('pointerenter', function () { open(true); });
      wrap.addEventListener('pointerleave', function () {
        shutTimer = setTimeout(function () { open(false); }, 220);
      });
    }
    btn.addEventListener('click', function (e) {
      /* The href is #schedule — a real destination, and the no-JS fallback. On
         a pointer device the menu is already open, so let the click through and
         go there; on touch the first tap opens the menu instead. */
      if (matchMedia('(hover:hover)').matches) return;
      e.preventDefault();
      open(menu.hidden);
    });
    addEventListener('pointerdown', function (e) {
      if (!wrap.contains(e.target)) open(false);
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { open(false); btn.focus(); }
    });
    menu.addEventListener('click', function () { open(false); });
    /* it is anchored to a fixed band, so a scroll leaves it hanging over
       content it no longer belongs to */
    addEventListener('scroll', function () { open(false); }, { passive: true });
  }

  /* ---------- footer ----------
     One builder for all three pages. It was three copies of the same markup for
     about a day, which is one day longer than three copies of anything stays
     identical.

     The panel inverts the page: white hairlines on the ink instead of blue
     hairlines on white. That is the engine's own trick, used the other way
     round — a slab's fill is mixed toward whatever is behind it, so setting the
     fill colour and the ground to the same blue makes every fill disappear and
     leaves nothing but the outline. */
  var LINKS = {
    NAVIGATE: [
      ['ABOUT', 'index.html#about'],
      ['COMPETITION', 'index.html#competition'],
      ['SCHEDULE', 'index.html#schedule'],
      ['SPEAKERS', 'index.html#speakers'],
      ['GALLERY', 'index.html#gallery'],
      ['MORE ABOUT HP', 'index.html#hype'],
      ['REGISTER', 'index.html#schedule']
    ],
    /* Instagram is the real account — it is where the tour's own cuts are
       posted, and the socials strip links the same place. The rest are
       still placeholders: a social link that goes to the wrong account is
       worse than one that goes nowhere. */
    FOLLOW: [
      ['INSTAGRAM', 'https://www.instagram.com/zbyhp/'],
      ['LINKEDIN', '#'],
      ['YOUTUBE', '#'],
      ['X', '#'],
      ['EMAIL US', 'mailto:andrew@non-studio.us']
    ]
  };

  function footer(el) {
    if (!el) return;
    el.className = 'foot';
    el.innerHTML =
      '<canvas class="foot__field" aria-hidden="true"></canvas>' +
      '<div class="foot__in">' +
        '<div class="foot__cols">' +
          Object.keys(LINKS).map(function (head) {
            return '<nav class="foot__col"><h3>' + head + '</h3>' +
              LINKS[head].map(function (l) {
                return '<a href="' + l[1] + '">' + l[0] + '</a>';
              }).join('') + '</nav>';
          }).join('') +
        '</div>' +
        '<img class="foot__mark" src="hp-lockup.svg" alt="HP USA College Tour 2026">' +
      '</div>';

    /* Fires once, when a quarter of the panel is up. Once, because a footer
       that re-animates every time it scrolls back into view is a tic, and this
       is the last thing on the page — you will cross it more than once. */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !global.IntersectionObserver) {
      el.classList.add('is-up');
    } else {
      new IntersectionObserver(function (e, o) {
        if (!e[0].isIntersecting) return;
        el.classList.add('is-up');
        o.disconnect();
      }, { threshold: 0.25 }).observe(el);
    }

    if (!global.ExtrusionField) return;   // no engine on this page; panel stays flat
    var f = new global.ExtrusionField(el.querySelector('.foot__field'), {
      count: 150, seed: 21,
      spread: 1500, aspectXY: 1.15, clump: 0.55, hole: 0.13, cone: 0.55,
      zNear: 620, zFar: 10000, zPow: 1.35,
      lenMin: 900, lenMax: 5600, lenDepth: 0.8,
      thick: 400, thickVar: 0.5, flat: 0.30, flatVar: 0.6,
      /* Fill and ground are the same blue, so every face vanishes into the
         panel and the hairline is the whole drawing.

         Which is exactly why wrapFade and borderFade belong ON here, though
         they are off in the frozen wireframe. There the worry is that a fade
         mixes the OUTLINE as well as the fill, so a ramped slab gets an edge
         that dissolves partway along itself while its white fill stays solid —
         a half-drawn shape. Here there is no fill to disagree with: fading the
         hairline fades the entire shape, evenly, which is the only way a bar
         can leave the panel without being guillotined at the canvas edge.
         faceShade stays off — it is a tonal step between faces, and there are
         no faces. */
      faces: true, faceShade: 0,
      fade: 0, grad: 0, wrapFade: 0.22, borderFade: 0.44,
      minPx: 4, edge: 0.5, edgeCol: '#ffffff', edgeFade: false,
      chips: 0,
      fov: 40, vpX: 0.97, vpY: 0.62,
      col: '#024AD8', bg: '#024AD8', wash: 0,
      /* A tenth of the hero's pace. The footer is somewhere you arrive, not
         somewhere you are travelling, so it drifts rather than flies. */
      speed: 70, parallax: 0, ease: 0.05
    });
    addEventListener('resize', function () { f.resize(); });

    /* Off-screen it stops entirely. A second requestAnimationFrame loop running
       under the fold for the whole visit is the kind of cost that never shows up
       in a screenshot. */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { f.draw(); return; }
    if (global.IntersectionObserver) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) f.start(); else f.stop();
      }, { rootMargin: '120px' }).observe(el);
    } else { f.start(); }
  }

  /* ---------- arrival ----------
     Per block, fired once. A stagger that replays every time a block passes the
     fold turns into a tic. */
  function reveal() {
    /* .promo is a plate too, for this purpose: it sits BESIDE a .blk rather
       than inside one, so watching only .blk left it at opacity 0 forever. */
    var blocks = document.querySelectorAll('.blk, .promo');
    if (!global.IntersectionObserver) {
      [].forEach.call(blocks, function (b) { b.classList.add('is-up'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-up');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    [].forEach.call(blocks, function (b) { io.observe(b); });
  }

  /* Does the loaded kit actually carry a Medium? A font-weight:500 declaration
     silently resolves to Regular when it does not, which looks like a CSS bug
     and is not one — so ask the font set directly rather than trusting the
     declaration. document.fonts is populated from the kit's @font-face rules,
     which have parsed by the time this script runs; the fonts.ready re-probe is
     for the case where they have not. */
  function weightProbe() {
    var has = false;
    try {
      global.document.fonts.forEach(function (f) {
        if (f.family.replace(/["']/g, '') === 'forma-djr-mono' && String(f.weight) === '500') has = true;
      });
    } catch (e) { has = false; }
    document.documentElement.classList.toggle('no-medium', !has);
  }
  if (global.document.fonts) {
    weightProbe();
    global.document.fonts.ready.then(weightProbe);
  } else {
    document.documentElement.classList.add('no-medium');
  }

  global.PAGES = {
    cards: cards, gallery: gallery, speakers: speakers, workshops: workshops, hype: hype,
    nav: nav, backdrop: backdrop,
    register: register, workshop: workshop, reveal: reveal, footer: footer
  };
})(window);

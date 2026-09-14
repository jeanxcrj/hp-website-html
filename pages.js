/* Everything that draws itself out of tour.js.

   The schedule, the gallery groups, the speaker slots and the registration
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

  function chip(s) {
    var st = T.status[s.status];
    return '<span class="chip ' + st.cls + '">' + st.label + '</span>';
  }

  /* ---------- schedule ---------- */
  function schedule(el) {
    if (!el) return;
    el.innerHTML = T.bySchool().map(function (g) {
      return '<div class="sked__grp">' +
        '<h3 class="sked__school">' + esc(g.school) + '</h3>' +
        g.stops.map(function (s) {
          return '<div class="sked__row' + (s.staging ? ' is-staging' : '') + '">' +
            '<span class="sked__date">' + esc(s.date) + '</span>' +
            '<span class="sked__what">' + esc(s.chapter || 'Main stop') + '</span>' +
            chip(s) +
            '<a class="sked__go" href="register.html?stop=' + encodeURIComponent(s.slug) + '">REGISTER →</a>' +
            (s.note ? '<p class="sked__note">' + esc(s.note) + '</p>' : '') +
            '</div>';
        }).join('') +
        '</div>';
    }).join('');
  }

  /* ---------- gallery ----------
     Grouped by school and empty on purpose. Each group is a drop zone: put the
     files in photos/ and swap the tile's inner markup for an <img>. The tile
     count is fixed at four per school so the grid has a shape to hold. */
  function gallery(el) {
    if (!el) return;
    el.innerHTML = T.bySchool({ skipStaging: true }).map(function (g) {
      return '<section class="gal__grp">' +
        '<div class="gal__head">' +
          '<h3 class="gal__school">' + esc(g.school) + '</h3>' +
          '<p class="gal__soon">PHOTOS COMING SOON</p>' +
        '</div>' +
        '<div class="grid">' +
          [1, 2, 3, 4].map(function (n) {
            return '<div class="shot shot--empty"><span>' +
              esc(g.school.split(' ')[0].toUpperCase()) + ' 0' + n + '</span></div>';
          }).join('') +
        '</div>' +
        '</section>';
    }).join('');
  }

  /* ---------- speakers ---------- */
  function speakers(el) {
    if (!el) return;
    el.innerHTML = T.speakers.map(function (p) {
      var where = !p.stops || !p.stops.length
        ? 'ALL STOPS'
        : p.stops.map(function (slug) {
            var s = T.bySlug(slug);
            return s ? T.stopName(s).toUpperCase() : slug.toUpperCase();
          }).join(' · ');
      var n = p.id < 10 ? '0' + p.id : '' + p.id;
      return '<article class="spk__card">' +
        '<div class="spk__photo">' +
          (p.photo ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.name || '') + '">' : '') +
          '<span>PHOTO ' + n + '</span>' +
        '</div>' +
        '<div class="spk__body">' +
          '<h3 class="spk__name">' + or(p.name, 'Speaker ' + n) + '</h3>' +
          '<p class="spk__role">' + or(p.role, 'Position') + ' · ' + or(p.company, 'Company') + '</p>' +
          '<p class="spk__bio">' + or(p.bio, 'Description to come — one short paragraph on what they work on and what they are bringing to the bench.') + '</p>' +
          '<p class="spk__stops">' + esc(where) + '</p>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------- registration ----------
     ?stop=<slug> selects the school. With no slug — or one that does not match
     anything, which is what a stale link looks like — the page becomes the
     chooser instead of erroring, so the link still lands somewhere useful. */
  function register(root) {
    if (!root) return;
    var slug = new URLSearchParams(location.search).get('stop');
    var stop = slug ? T.bySlug(slug) : null;

    if (!stop) {
      root.innerHTML =
        '<p class="eyebrow">REGISTRATION</p>' +
        '<h2>Pick your campus.</h2>' +
        '<p class="lede">One registration per stop, because the dates and the rooms are ' +
        'different at each. Two schools host two chapters on separate days — those are ' +
        'listed separately for the same reason.</p>' +
        '<div class="sked" id="chooser"></div>';
      schedule(document.getElementById('chooser'));
      document.title = 'Register — HP USA College Tour 2026';
      return;
    }

    var name = T.stopName(stop);
    document.title = 'Register · ' + name + ' — HP USA College Tour 2026';

    root.innerHTML =
      '<p class="eyebrow">REGISTRATION</p>' +
      '<h2>' + esc(name) + '</h2>' +
      '<div class="reg">' +
        '<div class="reg__meta">' +
          '<div class="reg__line"><b>SCHOOL</b><span>' + esc(stop.school) + '</span></div>' +
          '<div class="reg__line"><b>CHAPTER</b><span>' + esc(stop.chapter || '—') + '</span></div>' +
          '<div class="reg__line"><b>DATE</b><span>' + esc(stop.date) + '</span></div>' +
          '<div class="reg__line"><b>STATUS</b><span>' + chip(stop) + '</span></div>' +
          (stop.note ? '<p class="sked__note">' + esc(stop.note) + '</p>' : '') +
          '<p class="sked__note">Free, and open to any enrolled student. No portfolio ' +
          'review and no prior experience with anything on the benches.</p>' +
        '</div>' +
        '<form class="reg__form" novalidate>' +
          '<label class="field"><span>FULL NAME</span><input name="name" autocomplete="name" required></label>' +
          '<label class="field"><span>EMAIL</span><input name="email" type="email" autocomplete="email" required></label>' +
          '<label class="field"><span>SCHOOL</span><input name="school" value="' + esc(stop.school) + '"></label>' +
          '<label class="field"><span>YEAR AND PROGRAMME</span><input name="year" placeholder="e.g. 3rd year, B.Arch"></label>' +
          '<label class="field"><span>WHAT ARE YOU BRINGING?</span>' +
            '<textarea name="project" placeholder="A project and an idea of where it is stuck. Optional."></textarea></label>' +
          '<label class="check"><input type="checkbox" name="updates">' +
            '<span>Email me if this date moves. Half the calendar is still being agreed.</span></label>' +
          '<button class="send" type="submit">REGISTER</button>' +
          '<p class="sent" hidden></p>' +
        '</form>' +
      '</div>';

    /* No endpoint exists yet. Saying so beats a success state for something
       that did not happen — point the form at a real action and delete this. */
    var form = root.querySelector('.reg__form');
    var out = root.querySelector('.sent');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      out.hidden = false;
      out.textContent = 'Not submitted — this form has no endpoint behind it yet. ' +
        'Registration for ' + name + ' opens once the date is confirmed.';
    });
  }

  /* ---------- arrival ----------
     Per block, fired once. A stagger that replays every time a block passes the
     fold turns into a tic. */
  function reveal() {
    var blocks = document.querySelectorAll('.blk');
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

  global.PAGES = {
    schedule: schedule, gallery: gallery, speakers: speakers,
    register: register, reveal: reveal
  };
})(window);

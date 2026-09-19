/* The tour, in one place.

   Every surface reads from here: the schedule on the index, the campus menu in
   the band, and the per-stop registration pages. Adding a stop is one entry in
   STOPS and it appears on all three
   — which is the whole reason this file exists rather than four copies of the
   same rows drifting apart.

   The list is the confirmed and in-negotiation columns of the planning sheet —
   the green and orange rows. The yellow ones (NYU UDAS, UPenn AIAS, MassArt,
   Thomas Jefferson NOMAS and the RPI weekday date) are off the schedule until
   they firm up, and the staging days were never public stops. CMU is held at
   Oct 28 while Lori Claus looks into Tepper and Rangos.

   `status` is the colour coding off that sheet. It is kept as data but no
   longer rendered: CONFIRMED / TARGETING is how the tour is tracked internally,
   not something a student needs on a schedule. It stays because it is the truth
   about each date, and it is the source if the labels come back:

     set     the date is agreed with the chapter
     target  a date we are aiming at, not yet confirmed

   `note` is the sheet's own wording where it says more than the date does. Like
   `status` it is kept but no longer rendered — a student reading a schedule
   needs the date, not the state of the negotiation behind it.

   `speakers` is the bill for that campus, by SPEAKERS id. The tour asked for a
   line of names under each school and the real split is not decided yet, so
   these are a shuffle of the five names we have rather than a promise — swap
   the ids as each campus is settled and both the card and the speaker grid
   follow. */
(function (global) {
  'use strict';

  var STOPS = [
    { slug: 'cornell-aias', school: 'Cornell University', chapter: 'AIAS',
      date: 'Oct 17', status: 'set', speakers: [1, 4],
      note: 'Confirmed — Milstein Auditorium and the Milstein dome.' },

    { slug: 'upenn-air', school: 'University of Pennsylvania', chapter: 'AIR',
      date: 'Oct 18', status: 'set', speakers: [2, 3, 5],
      note: 'Confirmed for the Sunday.' },

    { slug: 'pratt-aias', school: 'Pratt Institute', chapter: 'AIAS',
      date: 'Oct 23–24', status: 'set', speakers: [3, 4], note: null },

    { slug: 'cmu', school: 'Carnegie Mellon University', chapter: null,
      date: 'Oct 28', status: 'target', speakers: [1, 2, 5],
      note: 'Targeting Oct 28 — AIAS with ACM.' },

    { slug: 'nyu-tech', school: 'New York University', chapter: 'Tech',
      date: 'Oct 30', status: 'set', speakers: [4, 5],
      note: '12pm to 6pm.' },

    { slug: 'harvard-recompute', school: 'Harvard University', chapter: 'Recompute',
      date: 'Oct 31', status: 'set', speakers: [1, 3],
      note: 'Lecture hall reserved; the gallery space is still being found.' },

    { slug: 'rpi-soa', school: 'Rensselaer Polytechnic Institute',
      chapter: 'School of Architecture',
      date: 'Nov 3', status: 'target', speakers: [2, 4],
      note: 'EMPAC, on hold with the dean.' },

    { slug: 'princeton', school: 'Princeton University', chapter: 'Hacking Club',
      date: 'Nov 1 / Nov 7', status: 'target', speakers: [5, 1],
      note: 'A weekend date, Nov 1 or Nov 7 — TBD.' }
  ];

  /* Names, companies and portraits lifted from the earlier HP USA Tour deck, so
     these are the real bill rather than placeholders. `role` is still null on
     every one: that file carried a name and an organisation and nothing else,
     and a job title is not something to fill in on someone's behalf. The card
     now draws the slot either way — a greyed ROLE line where the title belongs —
     so filling one in here is the whole job.

     Which campuses each of them takes is held on the STOPS side rather than
     here: one list, read in both directions by speakersFor() and stopsFor(). */
  var SPEAKERS = [
    { id: 1, name: 'Mariana Cabugueira', role: null, company: '[MC] Studio',
      bio: null, photo: 'photos/mariana-cabugueira.jpg' },
    { id: 2, name: 'Greg Demchek', role: null, company: 'Bentley Labs',
      bio: null, photo: 'photos/greg-demchek.jpg' },
    { id: 3, name: 'Andy Christoforou', role: null, company: 'KPF',
      bio: null, photo: 'photos/andy-christoforou.jpg' },
    { id: 4, name: 'Show It Better', role: null, company: '816K followers',
      bio: null, photo: 'photos/show-it-better.jpg' },
    { id: 5, name: 'Learn Upstairs', role: null, company: '700K followers',
      bio: null, photo: 'photos/learn-upstairs.jpg' }
  ];

  /* Photographs, keyed to the school they were taken at. Empty until the tour
     runs — the gallery reads the length of this and shows the empty template
     when there is nothing yet, so filling it in is the whole job:

       { school: 'Cornell University', src: 'photos/cornell-01.jpg',
         alt: 'Open benches at Cornell' }

     `school` must match a STOPS entry's school exactly; that string is what the
     filter groups on. */
  var PHOTOS = [];

  /* Vertical cuts for the "Learn more about HP" strip. Three slots, in the order
     they appear. `src` is an mp4 or webm sitting beside the site; until one
     lands, a slot renders as an empty 9:16 plate that still opens its `href`.

     PLACEHOLDERS. These point at HP's accounts, not at three particular reels.
     Instagram serves nothing to a fetch, so a reel URL cannot be checked before
     it goes in, and a link that 404s on the tour's own site is worse than a link
     to the feed it came from. To pin three actual reels: paste the permalinks
     into `href` below, and drop the mp4s beside the site and name them in `src`
     — which is also the only way the plates will PLAY anything, since these are
     the site's own plates rather than embeds. */
  var HYPE = [
    { title: 'Reel 01', href: 'https://www.instagram.com/hp/reels/', src: null },
    { title: 'Reel 02', href: 'https://www.instagram.com/zbyhp/', src: null },
    { title: 'Reel 03', href: 'https://www.youtube.com/@hpofficialchannel/shorts', src: null }
  ];

  /* The chapter is what separates two stops at the same school, so a stop's
     name is the school plus the chapter when there is one. Used as the page
     title on a registration page and as the row label in the schedule. */
  function stopName(s) {
    return s.chapter ? s.school + ' ' + s.chapter : s.school;
  }

  function bySlug(slug) {
    for (var i = 0; i < STOPS.length; i++) if (STOPS[i].slug === slug) return STOPS[i];
    return null;
  }

  function byId(id) {
    for (var i = 0; i < SPEAKERS.length; i++) if (SPEAKERS[i].id === id) return SPEAKERS[i];
    return null;
  }

  /* The bill for one stop, in the order the ids are written. Unknown ids drop
     out rather than rendering as a hole. */
  function speakersFor(stop) {
    return (stop && stop.speakers || []).map(byId).filter(Boolean);
  }

  /* The other direction, derived rather than stored: a second list of stops on
     each speaker is a second thing to keep in step with this one. */
  function stopsFor(speaker) {
    return STOPS.filter(function (s) {
      return (s.speakers || []).indexOf(speaker.id) !== -1;
    });
  }

  /* Schools in the order they are first visited, each carrying its own stops.
     A school can host two chapters on different dates, so the grouping has to
     be school -> [stops] rather than one row per school. */
  function bySchool(opts) {
    var skipStaging = opts && opts.skipStaging;
    var order = [], map = {};
    STOPS.forEach(function (s) {
      if (skipStaging && s.staging) return;
      if (!map[s.school]) { map[s.school] = { school: s.school, stops: [] }; order.push(map[s.school]); }
      map[s.school].stops.push(s);
    });
    return order;
  }

  global.TOUR = {
    stops: STOPS, speakers: SPEAKERS, photos: PHOTOS, hype: HYPE,
    stopName: stopName, bySlug: bySlug, byId: byId,
    speakersFor: speakersFor, stopsFor: stopsFor, bySchool: bySchool
  };
})(window);

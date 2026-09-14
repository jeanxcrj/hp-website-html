/* The tour, in one place.

   Every surface reads from here: the schedule on the index, the campus menu in
   the band, and the per-stop registration pages. Adding a stop is one entry in
   STOPS and it appears on all three
   — which is the whole reason this file exists rather than four copies of the
   same twelve rows drifting apart.

   `status` is the colour coding off the planning sheet. It is kept as data but
   no longer rendered: CONFIRMED / TARGETING / ON HOLD is how the tour is tracked
   internally, not something a student needs on a schedule. It stays because it
   is the truth about each date, and it is the source if the labels come back:

     set     the date is agreed with the chapter
     target  a date we are aiming at, not yet confirmed
     hold    booked but being moved; treat the date as wrong

   `note` is the sheet's own wording where it says more than the date does. Like
   `status` it is kept but no longer rendered — "Targeting Oct 20-22, exact day
   TBD" and "On hold, the chapter has asked to move" are how the tour is tracked
   internally, and a student reading a schedule needs the date, not the state of
   the negotiation behind it. */
(function (global) {
  'use strict';

  var STOPS = [
    { slug: 'cornell-staging', school: 'Cornell University', chapter: 'Staging',
      date: 'Oct 16', status: 'set', staging: true,
      note: 'Build and staging day — not a public stop.' },

    { slug: 'cornell-aias', school: 'Cornell University', chapter: 'AIAS',
      date: 'Oct 17', status: 'set', note: null },

    { slug: 'upenn-air', school: 'University of Pennsylvania', chapter: 'AIR',
      date: 'Oct 18–19', status: 'set', note: null },

    { slug: 'nyu-udas', school: 'New York University', chapter: 'UDAS',
      date: 'Oct 20–22', status: 'target', note: 'Targeting Oct 20–22, exact day TBD.' },

    { slug: 'rpi', school: 'Rensselaer Polytechnic Institute', chapter: null,
      date: 'Oct 21', status: 'target', note: 'TBD — Oct 21 preferred.' },

    { slug: 'pratt-aias', school: 'Pratt Institute', chapter: 'AIAS',
      date: 'Oct 23–24', status: 'set', note: null },

    { slug: 'harvard-recompute', school: 'Harvard University', chapter: 'Recompute',
      date: 'Oct 25', status: 'hold',
      note: 'On hold — the chapter has asked to move to Oct 31.' },

    { slug: 'nyu-tech', school: 'New York University', chapter: 'Tech',
      date: 'Oct 25', status: 'target', note: 'Targeting Oct 25, end of October.' },

    { slug: 'upenn-aias', school: 'University of Pennsylvania', chapter: 'AIAS',
      date: 'Oct 26', status: 'target', note: 'Targeting Oct 26.' },

    { slug: 'cmu', school: 'Carnegie Mellon University', chapter: null,
      date: 'Oct 28', status: 'target', note: 'Targeting Oct 28.' },

    { slug: 'massart', school: 'Massachusetts College of Art and Design', chapter: null,
      date: 'Oct 28', status: 'target', note: null },

    { slug: 'thomas-jefferson-nomas', school: 'Thomas Jefferson University', chapter: 'NOMAS',
      date: 'Oct 30 / Nov 6', status: 'target',
      note: 'Oct 30 or Nov 6, both TBD.' }
  ];

  /* Names, companies and portraits lifted from the earlier HP USA Tour deck, so
     these are the real bill rather than placeholders. `role` is still null on
     every one: that file carried a name and an organisation and nothing else,
     and a job title is not something to fill in on someone's behalf — it renders
     is not rendered at all until someone supplies it.

     `stops` is kept but not shown: the bill is the same at every campus for
     now, so a line saying so on all five cards was five repetitions of nothing.
     Fill it with slugs from STOPS once it is split campus by campus. */
  var SPEAKERS = [
    { id: 1, name: 'Mariana Cabugueira', role: null, company: '[MC] Studio',
      stops: [], bio: null, photo: 'photos/mariana-cabugueira.jpg' },
    { id: 2, name: 'Greg Demchek', role: null, company: 'Bentley Labs',
      stops: [], bio: null, photo: 'photos/greg-demchek.jpg' },
    { id: 3, name: 'Andy Christoforou', role: null, company: 'KPF',
      stops: [], bio: null, photo: 'photos/andy-christoforou.jpg' },
    { id: 4, name: 'Show It Better', role: null, company: '816K followers',
      stops: [], bio: null, photo: 'photos/show-it-better.jpg' },
    { id: 5, name: 'Learn Upstairs', role: null, company: '700K followers',
      stops: [], bio: null, photo: 'photos/learn-upstairs.jpg' }
  ];

  /* Photographs, keyed to the school they were taken at. Empty until the tour
     runs — the gallery reads the length of this and shows the empty template
     when there is nothing yet, so filling it in is the whole job:

       { school: 'Cornell University', src: 'photos/cornell-01.jpg',
         alt: 'Open benches at Cornell' }

     `school` must match a STOPS entry's school exactly; that string is what the
     filter groups on. */
  var PHOTOS = [];

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

  /* Schools in the order they are first visited, each carrying its own stops.
     UPenn and NYU each host two chapters on different dates, so the grouping
     has to be school -> [stops] rather than one row per school. */
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
    stops: STOPS, speakers: SPEAKERS, photos: PHOTOS,
    stopName: stopName, bySlug: bySlug, bySchool: bySchool
  };
})(window);

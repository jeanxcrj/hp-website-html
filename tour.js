/* The tour, in one place.

   Every surface reads from here: the schedule on the index, the stop filter on
   the speakers page, the per-school registration pages, and the gallery's
   school groups. Adding a stop is one entry in STOPS and it appears on all four
   — which is the whole reason this file exists rather than four copies of the
   same twelve rows drifting apart.

   `status` carries the colour coding off the planning sheet, because on that
   sheet the colour IS the information — half these dates are not agreed yet and
   a schedule that prints them all in the same weight would be lying:

     set     the date is agreed with the chapter
     target  a date we are aiming at, not yet confirmed
     hold    booked but being moved; treat the date as wrong

   `note` is the sheet's own wording where it says more than the date does.
   Leave it null when the date speaks for itself. */
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

  var STATUS = {
    set:    { label: 'CONFIRMED', cls: 'is-set' },
    target: { label: 'TARGETING', cls: 'is-target' },
    hold:   { label: 'ON HOLD',   cls: 'is-hold' }
  };

  /* Speakers are slots, not people. Every field a real entry needs is here and
     empty, so filling one in is typing over a blank rather than reverse
     engineering the card from its CSS. `photo` takes a path under photos/;
     null draws the empty plate instead. `stops` takes slugs from STOPS, and
     an empty array reads as "all stops" on the card. */
  var SPEAKERS = [
    { id: 1, name: null, role: null, company: null, stops: [], bio: null, photo: null },
    { id: 2, name: null, role: null, company: null, stops: [], bio: null, photo: null },
    { id: 3, name: null, role: null, company: null, stops: [], bio: null, photo: null },
    { id: 4, name: null, role: null, company: null, stops: [], bio: null, photo: null },
    { id: 5, name: null, role: null, company: null, stops: [], bio: null, photo: null },
    { id: 6, name: null, role: null, company: null, stops: [], bio: null, photo: null }
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
    stops: STOPS, speakers: SPEAKERS, status: STATUS,
    stopName: stopName, bySlug: bySlug, bySchool: bySchool
  };
})(window);

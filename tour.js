/* The tour, in one place.

   Every surface reads from here: the schedule on the index, the campus menu in
   the band, and the per-stop registration pages. Adding a stop is one entry in
   STOPS and it appears on all three
   — which is the whole reason this file exists rather than four copies of the
   same rows drifting apart.

   The list is the confirmed and in-negotiation columns of the planning sheet —
   the green and orange rows. The yellow ones (NYU UDAS, UPenn AIAS, MassArt,
   Thomas Jefferson NOMAS) are off the schedule until they firm up, and the
   staging days were never public stops. Venues and dates match the D5 page
   of Oct 3; CMU has been dropped from the tour.

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
   these are a shuffle of the names we have rather than a promise — swap
   the ids as each campus is settled and both the card and the speaker grid
   follow. */
(function (global) {
  'use strict';

  var STOPS = [
    { slug: 'cornell-aias', school: 'Cornell University', chapter: 'AIAS',
      date: 'Oct 17', status: 'set', venue: 'Milstein Hall Dome', speakers: [1, 4],
      exhibitionName: 'Material Futures',
      exhibitionDescription: 'A gathering of speculative materials, spatial ideas, and new ways to build.' ,
      note: 'Confirmed — the Milstein dome.' },

    { slug: 'upenn-air', school: 'University of Pennsylvania', chapter: 'AIR',
      date: 'Oct 18', status: 'set', venue: 'Amy Gutmann Hall Auditorium & Lobby', speakers: [3, 5],
      exhibitionName: 'Open Practice',
      exhibitionDescription: 'Projects that show how experimentation can move between design, technology, and culture.',
      note: 'Confirmed for the Sunday.' },

    { slug: 'pratt-aias', school: 'Pratt Institute', chapter: 'AIAS',
      date: 'Oct 23–24', status: 'set', venue: 'Higgins Hall Pit & Lecture Hall', speakers: [1, 2],
      exhibitionName: 'Making Visible',
      exhibitionDescription: 'A showcase of work that turns research, process, and making into public form.', note: null },

    { slug: 'nyu-tech', school: 'New York University', chapter: 'Tech',
      date: 'Oct 30', status: 'set', venue: 'Leslie eLab', speakers: [4, 5],
      exhibitionName: 'Next Signals',
      exhibitionDescription: 'Emerging ideas at the intersection of creative practice, technology, and everyday life.',
      note: '12pm to 6pm.' },

    { slug: 'harvard-recompute', school: 'Harvard University', chapter: 'Recompute',
      date: 'Oct 31', status: 'set', venue: 'Northwest Science Building B100', speakers: [3, 2],
      exhibitionName: 'Recompute',
      exhibitionDescription: 'A collection of projects that question familiar systems and propose more responsive futures.',
      note: null },

    { slug: 'rpi-soa', school: 'Rensselaer Polytechnic Institute',
      chapter: 'School of Architecture',
      date: 'Nov 3', status: 'set', venue: 'EMPAC Building', speakers: [2, 4],
      exhibitionName: 'Prototype / Perform',
      exhibitionDescription: 'Experiments in architecture, media, and performance developed through iterative making.',
      note: null },

    { slug: 'yale', school: 'Yale University', chapter: null,
      date: 'Nov 6', status: 'set', venue: 'CEID Building', speakers: [1, 3],
      exhibitionName: 'Workshop',
      exhibitionDescription: null,
      note: null },

    { slug: 'princeton', school: 'Princeton University', chapter: 'Hacking Club',
      date: 'Nov 7', status: 'set', venue: 'Julis Romo Rabinowitz (JRR) Atrium', speakers: [5],
      exhibitionName: 'Ideas in Public',
      exhibitionDescription: 'A student-led exhibition about turning ambitious ideas into shared experiences.',
      note: null }
  ];

  /* Alphabetical by first name, so the grid implies no billing order — except
     Remy Zee, who sits beside Jangho Yun by request. Roles and
     bios still marked placeholder are stand-ins until the real copy arrives. */
  var SPEAKER_BIO = 'Placeholder description. A short paragraph will go here on who this speaker is, the work they are known for, and the perspective they are bringing to the tour.';

  var SPEAKERS = [
    { id: 1, name: 'Andreas Palfinger', role: 'Designer', company: 'Zaha Hadid Architects',
      bio: null, photo: 'photos/andreas-palfinger.jpg' },
    { id: 2, name: 'Fred Liu', role: null, company: null,
      bio: null, photo: 'photos/fred-liu.jpg' },
    { id: 3, name: 'Hena Yang', role: 'Cofounder', company: 'Inyo',
      bio: null, photo: 'photos/hena-yang.jpg' },
    { id: 4, name: 'Jangho Yun', role: 'Head of Marketing', company: 'Cluely',
      bio: null, photo: 'photos/jangho-yun.jpg' },
    { id: 6, name: 'Remy Zee', role: 'Creator', company: '@remyzeee',
      bio: null, photo: 'photos/remy-zee.jpg' },
    { id: 5, name: 'Nino Ferrari-Mathis', role: null, company: '@ninosbuildings',
      bio: null, photo: 'photos/nino-ferrari-mathis.jpg' }
  ];

  /* The three partner workshops, one row each. `description` is a string or a
     list of paragraphs; null falls back to the placeholder copy until the
     partner sends theirs. `note` prints last, after a bold NOTE. */
  var WORKSHOP_DESC = 'Placeholder description. This workshop is a hands-on session where students work directly with professional software on a real project brief, guided by the team that builds the tools. Expect a short introduction to the platform and where it fits in a modern design and engineering workflow, followed by a live demonstration and time at the workstations to try it yourself. Along the way the session covers practical techniques, common pitfalls, and the habits professionals use to move faster. Bring your questions and your own work. No prior experience is required, and every attendee leaves with resources to keep going.';

  var WORKSHOPS = [
    { company: 'Bentley Systems', logo: 'logos/bentley.png',
      name: 'Drive the Future of AEC Workflows',
      description: [
        'In this workshop, you\u2019ll experience an early-access AEC design workflow in three connected steps from design intent into multi-disciplinary collaboration and stakeholder engagement:',
        'Accelerate your design intent through AI-assisted modeling and design exploration. (MicroStation w/ MCP)',
        'Bring your model into the cloud to collaborate in a project-centric environment, connecting data, teams, and decisions. (Bentley Infrastructure Cloud)',
        'Transform your model into an immersive digital experience that supports stakeholder communication, project understanding, and informed decision-making. (iTwin Engage)'
      ],
      speakers: ['Greg Demchek'] },
    { company: 'D5 Render', logo: 'logos/d5.png',
      name: 'Minutes, Not Days: The AI-Powered D5 Rendering Workflow',
      description: [
        'Forget overnight render queues. This session shows what AI-powered rendering actually feels like: a Rhino model turns into a cinematic image in minutes, live on stage - one that communicates not just what a space looks like, but how it feels.',
        'D5\u2019s AI understands your scene, builds the atmosphere and context around it, and refines the result to presentation quality, so you spend your studio hours designing, not tweaking sliders.',
        'You\u2019ll see the full workflow demonstrated end to end, then try it yourself.',
        'No rendering experience required: this is simply how the next generation of architects will work.'
      ],
      speakers: ['Jessie Huang'] },
    { company: 'SOLIDWORKS', logo: 'logos/solidworks.png',
      name: 'Design Smarter with SOLIDWORKS: Modeling, Simulation & AI',
      description: [
        'Think you\u2019re fast in SOLIDWORKS? Prove it. You\u2019ll model a component against the clock, then run a simulation to see how well it holds up.',
        'Next, make it stronger with less material, using the same simulation and optimization workflow engineers use on the job. We\u2019ll finish with a look at new AI tools that help you explore more options and iterate faster.'
      ],
      note: 'The workshop is designed for students with prior experience in parametric CAD modeling.',
      speakers: [] }
  ];

  /* Photographs, keyed to the school they were taken at. Empty until the tour
     runs — the gallery reads the length of this and shows the empty template
     when there is nothing yet, so filling it in is the whole job:

       { school: 'Cornell University', src: 'photos/cornell-01.jpg',
         alt: 'Open benches at Cornell' }

     `school` must match a STOPS entry's school exactly; that string is what the
     filter groups on. */
  var PHOTOS = [];

  /* Vertical cuts for the "More about HP" strip, in the order they appear.
     `ig` is the post's shortcode: the slot embeds Instagram's own player for
     it, because Instagram will not hand a reel's file to anything that is not
     logged in. Drop an mp4 beside the site and name it in `src` and the slot
     plays that instead, in the site's own plate. */
  var HYPE = [
    { title: 'Reel 01', href: 'https://www.instagram.com/reel/Db817DDClLL/', ig: 'Db817DDClLL', src: null },
    { title: 'Reel 02', href: 'https://www.instagram.com/p/DcjZWdQgDqd/', ig: 'DcjZWdQgDqd', src: null },
    { title: 'Reel 03', href: 'https://www.instagram.com/p/DbuAL3uFMtJ/', ig: 'DbuAL3uFMtJ', src: null }
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
    stops: STOPS, speakers: SPEAKERS, speakerBio: SPEAKER_BIO,
    workshops: WORKSHOPS, workshopDesc: WORKSHOP_DESC,
    photos: PHOTOS, hype: HYPE,
    stopName: stopName, bySlug: bySlug, byId: byId,
    speakersFor: speakersFor, stopsFor: stopsFor, bySchool: bySchool
  };
})(window);

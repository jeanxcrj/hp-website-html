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
      date: 'Oct 17', status: 'set', venue: 'Milstein Hall Dome', speakers: [7, 1],
      club: 'Cornell AIAS',
      luma: { tour: 'https://luma.com/ru47828y',
        bentley: 'https://luma.com/als8c6tm',
        d5: 'https://luma.com/yhgqvp08',
        solidworks: 'https://luma.com/w88pkahx' },
      exhibitionName: 'Material Futures',
      exhibitionDescription: 'A gathering of speculative materials, spatial ideas, and new ways to build.' ,
      note: 'Confirmed — the Milstein dome.' },

    { slug: 'upenn-air', school: 'University of Pennsylvania', chapter: 'AIR',
      date: 'Oct 18', status: 'set', venue: 'Amy Gutmann Hall Auditorium & Lobby', speakers: [3, 1],
      club: 'PennAiR',
      luma: { tour: 'https://luma.com/249mwrur',
        bentley: 'https://luma.com/4ruup0qh',
        d5: 'https://luma.com/event/evt-tjYAHrossWGwp4h',
        solidworks: 'https://luma.com/jzn18yw6' },
      exhibitionName: 'Open Practice',
      exhibitionDescription: 'Projects that show how experimentation can move between design, technology, and culture.',
      note: 'Confirmed for the Sunday.' },

    { slug: 'pratt-aias', school: 'Pratt Institute', chapter: 'AIAS',
      date: 'Oct 23–24', status: 'set', venue: 'Higgins Hall Pit & Lecture Hall', speakers: [7, 8],
      club: 'Pratt AIAS',
      luma: { tour: 'https://luma.com/i8k6mpgv',
        bentley: 'https://luma.com/j9i2u203',
        d5: 'https://luma.com/fflthcfd',
        solidworks: 'https://luma.com/event/evt-QlDmLRo0LgmEv2r' },
      exhibitionName: 'Making Visible',
      exhibitionDescription: 'A showcase of work that turns research, process, and making into public form.', note: null },

    { slug: 'nyu-tech', school: 'New York University', chapter: 'Tech',
      date: 'Oct 25', status: 'set', venue: 'Kimmel Floor 4', speakers: [2, 4, 3],
      club: 'Tech @ NYU',
      luma: { tour: 'https://luma.com/i4df9dm5',
        bentley: 'https://luma.com/0luhptdp',
        d5: 'https://luma.com/1blesmnw',
        solidworks: 'https://luma.com/uyy4g7gg' },
      exhibitionName: 'Next Signals',
      exhibitionDescription: 'Emerging ideas at the intersection of creative practice, technology, and everyday life.',
      note: null },

    { slug: 'harvard-recompute', school: 'Harvard University', chapter: 'Recompute',
      date: 'Oct 31', status: 'set', venue: 'Northwest Science Building B100', speakers: [9, 4, 3],
      club: 'ReCompute & HUPC',
      luma: { tour: 'https://luma.com/rz4kxann',
        bentley: 'https://luma.com/k12oqpos',
        d5: 'https://luma.com/akx45zlg',
        solidworks: 'https://luma.com/grjbiiw5' },
      exhibitionName: 'Recompute',
      exhibitionDescription: 'A collection of projects that question familiar systems and propose more responsive futures.',
      note: null },

    { slug: 'rpi-soa', school: 'Rensselaer Polytechnic Institute',
      chapter: 'School of Architecture',
      date: 'Nov 4', status: 'set', venue: 'EMPAC Building', speakers: [8],
      club: 'RPI NOMAS',
      luma: { tour: 'https://luma.com/3fpjs1sk',
        bentley: 'https://luma.com/event/evt-9Asw65DVntZKrim',
        d5: 'https://luma.com/ymkg16bz',
        solidworks: 'https://luma.com/pa9apqgm' },
      exhibitionName: 'Prototype / Perform',
      exhibitionDescription: 'Experiments in architecture, media, and performance developed through iterative making.',
      note: null },

    { slug: 'yale', school: 'Yale University', chapter: null,
      date: 'Nov 6', status: 'set', venue: 'CEID Building', speakers: [5],
      club: 'CEID',
      luma: { tour: 'https://luma.com/climvw2h',
        bentley: 'https://luma.com/gkdpegnv',
        d5: 'https://luma.com/udrze508',
        solidworks: 'https://luma.com/event/evt-EpNNqLlfODZfiDb' },
      exhibitionName: 'Workshop',
      exhibitionDescription: null,
      note: null },

    { slug: 'princeton', school: 'Princeton University', chapter: 'Hacking Club',
      date: 'Nov 7', status: 'set', venue: 'Julis Romo Rabinowitz (JRR) Atrium', speakers: [5, 4, 10],
      club: 'HackPrinceton',
      luma: { tour: 'https://luma.com/sbjgapnu',
        bentley: 'https://luma.com/event/evt-7AnBICjkuTJyAX2',
        d5: 'https://luma.com/9diuk7u7',
        solidworks: 'https://luma.com/de4xk276' },
      exhibitionName: 'Ideas in Public',
      exhibitionDescription: 'A student-led exhibition about turning ambitious ideas into shared experiences.',
      note: null }
  ];

  /* Alphabetical by first name, so the grid implies no billing order. Roles and
     bios still marked placeholder are stand-ins until the real copy arrives. */
  var SPEAKER_BIO = 'Placeholder description. A short paragraph will go here on who this speaker is, the work they are known for, and the perspective they are bringing to the tour.';

  var SPEAKERS = [
    { id: 1, name: 'Andreas Palfinger', role: 'Artist, Architect', company: 'ZHA',
      bio: 'Andreas is an artist and works as an architectural designer at ZHA (formerly Zaha Hadid Architects), based in London and New York. The talk follows Andreas\u2019 journey through multiple disciplines and continents: from graphic design to painting, animation film, sculpture and architecture; from the Austrian alps to New York, Beijing, Mumbai and London.',
      photo: 'photos/andreas-palfinger.jpg?v=3' },
    { id: 7, name: 'Brey Tucker', role: 'Senior Industry Manager, Project Delivery', company: 'Autodesk',
      /* drawn from the University of Houston alumni spotlight — confirm with Brey */
      bio: 'I trained as an architect and went from practice at HOK into design technology, leading BIM, VR, and digital fabrication work at firms like Perkins+Will and Stantec. Today I help shape the cloud collaboration tools architects and engineers use to deliver projects at Autodesk.',
      photo: 'photos/brey-tucker.jpg' },
    { id: 10, name: 'Daniel Min', role: 'Founder & Content Creator (190K+)', company: 'Mints Media',
      /* drawn from Daniel's LinkedIn */
      bio: 'I\u2019m the founder of Mints Media and a content creator with 190K+ followers, and I film vlogs on my YouTube channel, Daniel Mints. I studied at Wharton and am based in New York.',
      photo: 'photos/daniel-min.jpg?v=2' },
    { id: 9, name: 'Duke Pan', role: '350K+ YouTuber, YC Founder', company: 'SWE @ Meta, Tesla AI, Coinbase',
      bio: 'Duke Pan, known online as Frying Pan, is a content creator, software engineer, and Y Combinator-backed founder. He\u2019ll share his unconventional path from a low-income upbringing in Canada to acting in China, studying computer science, YouTube, and big tech, graduating during the 2022 layoffs, and life as a founder. Drawing on his work building AI agents, he\u2019ll also discuss how students can create their own opportunities as AI changes engineering and work.',
      photo: 'photos/duke-pan.jpg?v=2' },
    { id: 2, name: 'Fred Liu', role: 'Designer', company: 'Creator',
      /* stand-in copy, written for the layout — swap for Fred's own when it arrives */
      bio: 'I work across design, technology, and the internet, making things and sharing the process along the way.', photo: 'photos/fred-liu.jpg' },
    { id: 3, name: 'Hena Yang', role: 'Creator & Cofounder', company: 'Inyo',
      bio: 'I\u2019m a fine arts student, creator, and cofounder of Inyo, where I combine my creative background with technology to rethink how people connect. I\u2019ll be speaking about building a career across art, social media, and entrepreneurship, and how embracing an unconventional path can open doors to opportunities you never expected.',
      photo: 'photos/hena-yang.jpg?v=2' },
    { id: 4, name: 'Jangho Yun', role: 'Head of Marketing', company: 'Cluely',
      bio: 'I\u2019ve spent the past year and a half working at early-stage startups and currently do marketing at Cluely. I\u2019ll talk about how I got to where I am, what I\u2019ve learned about breaking through early-stage growth roles, and what working inside a fast-moving startup actually looks like.',
      photo: 'photos/jangho-yun.jpg' },
    { id: 8, name: 'Kenton Grant', role: 'Director of Technology', company: 'Olson Kundig',
      /* drawn from the Olson Kundig profile — confirm with Kenton */
      bio: 'I lead design and information technology across Olson Kundig\u2019s offices, after two decades in architecture and engineering, including design technology at Gensler and work for a Fortune 500 defense contractor.',
      photo: 'photos/kenton-grant.jpg' },
    { id: 5, name: 'Nino Ferrari-Mathis', role: 'Creator', company: 'NinosBuildings',
      bio: 'I will be talking about my experience as an architecture student who went into digital storytelling, tying in my multi-cultural background and experience in inter-disciplinary creative work.', photo: 'photos/nino-ferrari-mathis.jpg?v=2' }
  ];

  /* The three partner workshops, one row each. `description` is a string or a
     list of paragraphs; null falls back to the placeholder copy until the
     partner sends theirs. `note` prints last, after a bold NOTE. */
  var WORKSHOP_DESC = 'Placeholder description. This workshop is a hands-on session where students work directly with professional software on a real project brief, guided by the team that builds the tools. Expect a short introduction to the platform and where it fits in a modern design and engineering workflow, followed by a live demonstration and time at the workstations to try it yourself. Along the way the session covers practical techniques, common pitfalls, and the habits professionals use to move faster. Bring your questions and your own work. No prior experience is required, and every attendee leaves with resources to keep going.';

  var WORKSHOPS = [
    { key: 'bentley', company: 'Bentley Systems', logo: 'logos/bentley.png',
      name: 'Drive the Future of AEC Workflows',
      description: [
        'In this workshop, you\u2019ll experience an early-access AEC design workflow in three connected steps from design intent into multi-disciplinary collaboration and stakeholder engagement:',
        'Accelerate your design intent through AI-assisted modeling and design exploration. (MicroStation w/ MCP)',
        'Bring your model into the cloud to collaborate in a project-centric environment, connecting data, teams, and decisions. (Bentley Infrastructure Cloud)',
        'Transform your model into an immersive digital experience that supports stakeholder communication, project understanding, and informed decision-making. (iTwin Engage)'
      ],
      speakers: ['Greg Demchek'] },
    { key: 'd5', company: 'D5 Render', logo: 'logos/d5.png',
      name: 'Minutes, Not Days: The AI-Powered D5 Rendering Workflow',
      description: [
        'Forget overnight render queues. This session shows what AI-powered rendering actually feels like: a Rhino model turns into a cinematic image in minutes, live on stage - one that communicates not just what a space looks like, but how it feels.',
        'D5\u2019s AI understands your scene, builds the atmosphere and context around it, and refines the result to presentation quality, so you spend your studio hours designing, not tweaking sliders.',
        'You\u2019ll see the full workflow demonstrated end to end, then try it yourself.',
        'No rendering experience required: this is simply how the next generation of architects will work.'
      ],
      speakers: ['Jessie Huang'] },
    { key: 'solidworks', company: 'SOLIDWORKS', logo: 'logos/solidworks.png',
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

  /* Every registration lives on Luma: one event per stop for the tour itself
     (`luma.tour`) and one per partner workshop, keyed by WORKSHOPS[].key. */
  function registerUrl(s) {
    return s && s.luma && s.luma.tour || null;
  }
  function workshopUrl(s, key) {
    return s && s.luma && s.luma[key] || null;
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
    registerUrl: registerUrl, workshopUrl: workshopUrl,
    speakersFor: speakersFor, stopsFor: stopsFor, bySchool: bySchool
  };
})(window);

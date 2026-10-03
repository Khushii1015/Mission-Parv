/* =====================================================================
   MISSION: PARV  —  YOUR SETTINGS FILE
   ---------------------------------------------------------------------
   This is the ONLY file you need to edit. Everything personal lives here:
   names, dates, photos, the song, your letters, and the coupons.

   RULES SO NOTHING BREAKS
   • Text inside "double quotes" stays on one line.
   • Letters use `backticks` so you can press Enter for new lines.
     Just don't type a backtick ( ` ) inside a letter.
   • Keep the commas at the end of each line.
   ===================================================================== */

const CONFIG = {

  /* ---------- NAMES & DATES ---------- */
  commanderName: "Parv",
  yourName: "Khushi",
  askedOutDate: "2025-01-23",          // the night he asked you (YYYY-MM-DD)
  welcomeNote: "Welcome aboard, Commander ♥",   // sticky note on his locker

  /* ---------- THE SONG (Mission 4) ---------- */
  song: {
    title: "Kajra Re",
    youtubeId: "4dsFQFCvVGU",          // the part after watch?v= in the link
    startSeconds: 350                  // 5:50  →  5 × 60 + 50 = 350
  },

  /* ---------- PHOTOS ----------
     Put your photos in the "images" folder, named EXACTLY like below.
     Names are case-sensitive on GitHub (photo.JPG ≠ photo.jpeg).
     If your file is a .png or .jpeg, just change the ending here.
     Captions are the handwritten text under each polaroid.          */
  photos: {
    commanderBadge: { src: "images/parv-badge.jpeg",   caption: "" },                       // his face, for his crew ID card
    copilotBadge:   { src: "images/khushi-badge.jpeg", caption: "" },                       // your face, for the co-pilot form
    bench:          { src: "images/bench.jpeg",        caption: "our bench by the river" }, // Mission 1
    boo:            { src: "images/boo.jpeg",          caption: "boo!" },                   // Mission 2 jump scare (a silly photo of you)
    museum:         { src: "images/museum.jpeg",       caption: "Museum of Illusions" },    // Mission 3
    freshKitchen:   { src: "images/fresh-kitchen.jpeg",caption: "Fresh Kitchen ♥" },        // Mission 3
    dorm:           { src: "images/dorm.jpeg",         caption: "January 23" },             // Mission 5
    finale:         { src: "images/us.jpeg",           caption: "us" },                     // Final transmission

    // Polaroids floating around the station that he can grab and click. Add or remove freely.
    floating: [
      { src: "images/float-1.jpeg", caption: "" },
      { src: "images/float-2.jpeg", caption: "" },
      { src: "images/float-3.jpeg", caption: "" }
    ]
  },

  /* ---------- YOUR LETTERS ----------
     Replace each ✏️ placeholder with your own words.
     Change the titles too if you like.                               */
  letters: {

    cupola: {                                   // Mission 1: the telescope finds your bench
      title: "The bench by the river",
      text: `✏️ Write your letter here.

(About the forest walks and sitting on the bench watching the river, before you two were dating.)`
    },

    nightOps: {                                 // Mission 2: lights out, jump scare
      title: "Scaring each other at night",
      text: `✏️ Write your letter here.

(About sitting on that bench in the forest at night and scaring each other.)`
    },

    anniversary: {                              // Mission 3: downtown Toronto
      title: "Our first anniversary",
      text: `✏️ Write your letter here.

(About your 1-year anniversary: the Museum of Illusions and Fresh Kitchen + Juice Bar.)`
    },

    song: {                                     // Mission 4: Kajra Re
      title: "Our frequency",
      text: `✏️ Write your letter here.

(About Kajra Re, or anything the song reminds you of.)`
    },

    crewQuarters: {                             // Mission 5: the dorm, Jan 23
      title: "The night you asked",
      text: `✏️ Write your letter here.

(About the night he asked you to be his girlfriend in his dorm room.)`
    },

    lifeSupport: {                              // Mission 6: kisses
      title: "Kiss reserves",
      text: `✏️ Write your letter here.

(Something cute and short about kisses.)`
    },

    final: {                                    // The big one, after he floats out of the airlock
      title: "Final transmission",
      text: `✏️ Write your final letter here.

This is the last thing he reads, floating in space above Earth.`
    }
  },

  /* ---------- COUPONS (unlocked in Mission 6) ----------
     Edit, add or remove. Keep each one short.                        */
  coupons: [
    { icon: "💋", title: "Unlimited kisses",        note: "No expiry date" },
    { icon: "🎬", title: "Movie night",             note: "Your pick, no complaints" },
    { icon: "🥗", title: "Fresh Kitchen date",      note: "My treat" },
    { icon: "💆", title: "20-minute back rub",       note: "Redeem anytime" },
    { icon: "🌲", title: "Forest walk + bench",      note: "Scaring allowed" },
    { icon: "🏆", title: "Win one argument",         note: "Instantly. No questions." }
  ],

  /* ---------- BOARDING PASS (the very end) ---------- */
  boardingPass: {
    note: "You said you want to go to space at least once. Until then, I built you a station. Seat 1A is reserved for you.",
    date: "SOMEDAY",
    seat: "1A",
    companionSeat: "1B"
  }
};

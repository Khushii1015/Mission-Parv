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
    title: "Your favourite song lyrics",
    youtubeId: "4dsFQFCvVGU",          // the part after watch?v= in the link
    startSeconds: 351                  // 5:51  →  5 × 60 + 50 = 351
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
      text: `I still remember the time when we used to go to the forest near campus and there was a bench beside the river. Those were the days before we started dating and who knew we would come this far and be so close. I remember you telling me that you were contemplating wether you put your arm around me and I'm glad you did. We shared a beautiful moment and deep down we both knew where this was going to be in the future. We were just waiting for the right time to come!`
    },

    nightOps: {                                 // Mission 2: lights out, jump scare
      title: "Scaring each other at night",
      text: `Ouuu I remember when in first year we used to go into the forest on campus at night. I used to have classes some days till 8 and 9pm and you used to take me to the forest in front of Erindale and scare me. We would sit on the bench and tell each other scary stories and the speakers used to make scary noises that would add onto the fun. Those times are so fun to remember, we should explore a real haunted location one day! I also remember one night I grabbed your arm and walked you arund the fire pit there pertending we were taking our wedding pheras. You jumped into the fire pit. Hope you don't do that in real life. But yesss I can't wait for that day to become reality and one day we actually walk around a fire getting closer to being husband and wife with every step we take!`
    },

    anniversary: {                              // Mission 3: downtown Toronto
      title: "Our first anniversary",
      text: `Our 1 year anniversary was my first full day date and I loved every moment of it. Spending that much time with you never made me feel like I needed a break. Normally, with anyone else I'd be mentaly tired with that much time but with you every second felt like it was worth it! I can't image not spending my life with someone who recharges my batter rather than drain it. That day was amazingggg! I loves the museum time and the food we had later on! We will always spend our anniversary day together and embrace the year we spent together!`
    },

    song: {                                     // Mission 4: Kajra Re
      title: "Your frequency",
      text: `I still remember a very long time ago, just once, you told me there was something about this song lyric that hits you different. I still remember it because it really does sound like something different, something nice. Some day, maybe we can dance ot this song together?`
    },

    crewQuarters: {                             // Mission 5: the dorm, Jan 23
      title: "The night you asked",
      text: `The day in the OPH dorm, Jan 23, 2025, you asked me to be your girlfriend. It was an moment that started with an unexpected peck on the lips. Who knew that peck would turn into something crazy within a few seconds. That was the moment everything started, the ups and downs, the crazy and cozy, the fast and slow moments. It was the begining to a journey that I hope will last till death! Nothing can make me forget that day, the day we decided that we would take this step together to be in a relationship. You have since then truly shown me what it takes to carry forward a healthy relationship. The challenges were also a learning point for me and I'm glad we had all those moments. We truly have grown together and we will continue to. I will always be your biggest supporter to the best of my abbility, I promise.`
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
    { icon: "🎬", title: "Movie time",             note: "Your pick, no complaints" },
    { icon: "🥗", title: "Food date",      note: "My treat" },
    { icon: "🤫", title: "Be quiet for 2 minutes",       note: "Redeem anytime" },
    { icon: "🌲", title: "A wlak in the forest",      note: "Scaring allowed" },
    { icon: "🏆", title: "Win one argument",         note: "Instantly. No questions." }
  ],

  /* ---------- BOARDING PASS (the very end) ---------- */
  boardingPass: {
    note: "You said you want to go to space at least once. Until then, I built you a station. Seat 1A is reserved for you.",
    date: "ONE DAY",
    seat: "1A",
    companionSeat: "1B"
  }
};

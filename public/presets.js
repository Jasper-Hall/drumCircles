// Genre presets for drum-circles -- DIALLED BY EAR on the tuning desk, 2026-09-12.
// Params are the source of truth. `plays` is what those params actually produce
// over one bar (recomputed by tools/solve.js). `target` is the first-pass canonical
// guess and is KNOWN TO BE WRONG for several genres -- a research pass is replacing
// it; until then treat plays, not target, as the intended pattern.
// verified:false entries need an OR mask of two rings. See tools/dof.js.
window.GENRE_PRESETS = [
  {
    "id": "house",
    "label": "House",
    "bpm": 124,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x...",
        "plays": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 47,
        "target": "....x.......x...",
        "plays": "....x.......x..."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "..x...x...x...x."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "reggaeton",
    "label": "Reggaeton",
    "bpm": 96,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "target": "x.......x.......",
        "plays": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": "x..x....x..x....",
        "plays": "...x..x....x..x."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x.x.x.x.x.x.x.x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 50,
        "plays": "x.x..x..x.x..x.."
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 50,
        "plays": "x...x...x...x..."
      },
      "poly": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "plays": "x....x....x....."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "dancehall",
    "label": "Dancehall",
    "bpm": 100,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 41,
        "target": "x.......x.......",
        "plays": "x..x....x..x...."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 6,
        "distribution": 41,
        "target": "x..x....x..x....",
        "plays": "......x.......x."
      },
      "hat": {
        "steps": 16,
        "pulses": 9,
        "rotation": 2,
        "distribution": 61,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x...xxx.x.xx.xx."
      },
      "pluck": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 70,
        "plays": "....x.x.x.x.x.x."
      },
      "fm": {
        "steps": 16,
        "pulses": 7,
        "rotation": 0,
        "distribution": 72,
        "plays": "....x.xx.x.xx.x."
      },
      "poly": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 95,
        "plays": "..........xxx.xx"
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "dembow",
    "label": "Dembow Dominicano",
    "bpm": 115,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.......x.......",
        "plays": "x.......x......."
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x.",
        "plays": "x..x..x.x..x..x."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x.x.x.x.x.x.x.x."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "bailefunk",
    "label": "Baile Funk",
    "bpm": 130,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "target": "x..x..x...x..x..",
        "plays": "x.......x......."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": "....x.......x...",
        "plays": "...x..x....x..x."
      },
      "hat": {
        "steps": 2,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "................"
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "kuduro",
    "label": "Kuduro",
    "bpm": 140,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x.",
        "plays": "x..x..x.x..x..x."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x...",
        "plays": "....x.......x..."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x.x.x.x.x.x.x.x."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "bouyon",
    "label": "Bouyon",
    "bpm": 150,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x...",
        "plays": "x...x...x...x..."
      },
      "snare": {
        "steps": 16,
        "pulses": 5,
        "rotation": 3,
        "distribution": 43,
        "target": "x..x..x.x..x..x.",
        "plays": "...x..x.x..x..x."
      },
      "hat": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "target": "xxxxxxxxxxxxxxxx",
        "plays": "..x...x...x...x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 12,
        "rotation": 0,
        "distribution": 50,
        "plays": "xxx.xxx.xxx.xxx."
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 45,
        "plays": "..x...x..x...x.."
      },
      "poly": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 50,
        "plays": "x...x...x...x..."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "cumbia",
    "label": "Cumbia",
    "bpm": 95,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x...",
        "plays": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "target": "....x.......x...",
        "plays": "x...x...x...x..."
      },
      "hat": {
        "steps": 4,
        "pulses": 2,
        "rotation": 2,
        "distribution": 24,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "..xx..xx..xx..xx"
      },
      "pluck": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "plays": "..x...x...x...x."
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "plays": "..x...x...x...x."
      },
      "poly": {
        "steps": 16,
        "pulses": 4,
        "rotation": 11,
        "distribution": 50,
        "plays": "...x...x...x...x"
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "tribal",
    "label": "Tribal (Mexican)",
    "bpm": 126,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x...",
        "plays": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x.",
        "plays": "x..x..x.x..x..x."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "..x...x...x...x."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "ukfunky",
    "label": "UK Funky",
    "bpm": 130,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 47,
        "target": "x..x..x...x.....",
        "plays": "x...x...x..x...."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": "....x.......x...",
        "plays": "...x..x....x..x."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "..x...x...x...x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 7,
        "rotation": 0,
        "distribution": 50,
        "plays": "x.x.x.x..x.x.x.."
      },
      "fm": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 50,
        "plays": "x..x..x..x..x..."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "ukdrill",
    "label": "UK Drill",
    "bpm": 142,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 2,
        "rotation": 10,
        "distribution": 39,
        "target": "x.........x.....",
        "plays": "x.........x....."
      },
      "snare": {
        "steps": 16,
        "pulses": 6,
        "rotation": 8,
        "distribution": 50,
        "target": "........x.......",
        "plays": "x.x..x..x.x..x.."
      },
      "hat": {
        "steps": 6,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "(polyrhythm N=6)"
      },
      "pluck": {
        "steps": 16,
        "pulses": 7,
        "rotation": 6,
        "distribution": 50,
        "plays": ".x.x..x.x.x.x..x"
      },
      "fm": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 50,
        "plays": "x.x..x..x.x..x.."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "ukgarage",
    "label": "UK Garage",
    "bpm": 135,
    "verified": false,
    "unreachable": "kick",
    "note": "kick x.....x...x..... needs an OR mask of two rings; not reachable with one ring. See tools/dof.js",
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 3,
        "rotation": 4,
        "distribution": 70,
        "target": "x.....x...x.....",
        "plays": "x........x...x.."
      },
      "snare": {
        "steps": 16,
        "pulses": 2,
        "rotation": 4,
        "distribution": 46,
        "target": "....x.......x...",
        "plays": "....x......x...."
      },
      "hat": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 78,
        "target": "..x...x...x...x.",
        "plays": "......xx.x.xx.x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 46,
        "plays": "x....x...x......"
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 59,
        "plays": "..x...x..x...x.."
      },
      "poly": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "plays": "x....x....x....."
      }
    }
  },
  {
    "id": "hyphy",
    "label": "Hyphy",
    "bpm": 105,
    "verified": false,
    "unreachable": "kick",
    "note": "kick x.....x...x.x... needs an OR mask of two rings. See tools/dof.js",
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 28,
        "target": "x.....x...x.x...",
        "plays": "x..x..x........."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x...",
        "plays": "....x.......x..."
      },
      "hat": {
        "steps": 6,
        "pulses": 6,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "(polyrhythm N=6)"
      }
    }
  }
];

// Synth parameter overrides on top of SYNTH_DEFS (synths.js), dotted paths.
window.SYNTH_DEFAULTS = {
  "hat": {
    "envelope.decay": 0.017,
    "envelope.release": 0.001
  },
  "kick": {
    "envelope.decay": 0.885,
    "envelope.sustain": 0.543
  },
  "pluck": {
    "dampening": 7300,
    "resonance": 0.85,
    "attackNoise": 2.6
  },
  "snare": {
    "envelope.decay": 0.179
  },
  "fm": {
    "modulationEnvelope.attack": 0.001,
    "modulationEnvelope.decay": 0.409,
    "envelope.attack": 0.001,
    "modulationIndex": 36.2,
    "harmonicity": 1
  },
  "poly": {
    "envelope.attack": 0.023,
    "envelope.release": 0.601,
    "oscillator.spread": 42,
    "envelope.decay": 0.172
  }
};

// Note-grid seeds per track: indices into the 3x8 grid.
window.NOTE_SEEDS = {
  "kick": [],
  "snare": [],
  "pluck": [
    0,
    1,
    2,
    3,
    4,
    5,
    7
  ],
  "fm": [
    4,
    6,
    11,
    15
  ],
  "poly": [
    8,
    9,
    16,
    17,
    18,
    20
  ]
};

window.TUNED_SCALE = {"scale":"minor","root":"C"};

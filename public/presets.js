// Genre presets for drum-circles.
//
// PARAMS (steps/pulses/rotation/distribution) are the source of truth: dialled by ear on
// the tuning desk, 2026-09-12. `plays` is what they produce over one bar.
//
// TARGET is the researched canonical pattern (tools/research-genres.md, 2026-09-12), with
// targetConfidence carried from the research: 'high' has a notated source, 'low' means no
// notated source was found and the ear should win. targetParams is the one-ring setting
// that reproduces the target exactly, or null if no single ring can.
//
// verified:true  = every canonical pattern for this genre is reachable with one ring.
// verified:false = at least one is not (unreachable says which); needs ring B.
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
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 47,
        "target": "....x.......x...",
        "plays": "....x.......x...",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 4,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "..x...x...x...x.",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 2,
          "distribution": 50
        }
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 124,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md"
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
        "target": "x..x....x..x....",
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 8,
          "pulses": 2,
          "rotation": 7,
          "distribution": 55
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": "...x..x....x..x.",
        "plays": "...x..x....x..x.",
        "targetParams": {
          "steps": 8,
          "pulses": 2,
          "rotation": 2,
          "distribution": 55
        }
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x.x.x.x.x.x.x.x.",
        "targetParams": {
          "steps": 2,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 95,
    "targetConfidence": "medium-high",
    "targetSource": "tools/research-genres.md"
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
        "target": "x..x....x..x....",
        "plays": "x..x....x..x....",
        "targetParams": {
          "steps": 8,
          "pulses": 2,
          "rotation": 7,
          "distribution": 55
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 6,
        "distribution": 41,
        "target": "......x.......x.",
        "plays": "......x.......x.",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 6,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 16,
        "pulses": 9,
        "rotation": 2,
        "distribution": 61,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "x...xxx.x.xx.xx.",
        "targetParams": {
          "steps": 2,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 100,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md"
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
        "target": "x...x...x...x...",
        "plays": "x.......x.......",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "...x..x....x..x.",
        "plays": "x..x..x.x..x..x.",
        "targetParams": {
          "steps": 8,
          "pulses": 2,
          "rotation": 2,
          "distribution": 55
        }
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "xxxxxxxxxxxxxxxx",
        "plays": "x.x.x.x.x.x.x.x.",
        "targetParams": {
          "steps": 1,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 122,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md"
  },
  {
    "id": "bailefunk",
    "label": "Baile Funk",
    "bpm": 130,
    "verified": false,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "target": "x.....x...x.....",
        "plays": "x.......x.......",
        "targetParams": null
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": "..x...x.....x.x.",
        "plays": "...x..x....x..x.",
        "targetParams": null
      },
      "hat": {
        "steps": 2,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x...",
        "plays": "................",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      }
    },
    "unreachable": "kick+snare",
    "note": "canonical kick and snare need a second ring; see tools/dof.js and research-genres.md",
    "researchBpm": 130,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md"
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
        "target": "x...x...x...x...",
        "plays": "x..x..x.x..x..x.",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "x.....x.........",
        "plays": "....x.......x...",
        "targetParams": {
          "steps": 16,
          "pulses": 2,
          "rotation": 13,
          "distribution": 59
        }
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "..xx..xx..xx..xx",
        "plays": "x.x.x.x.x.x.x.x.",
        "targetParams": {
          "steps": 4,
          "pulses": 2,
          "rotation": 1,
          "distribution": 63
        }
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md"
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
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 16,
        "pulses": 5,
        "rotation": 3,
        "distribution": 43,
        "target": "....x.......x...",
        "plays": "...x..x.x..x..x.",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 4,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "target": "xxxxxxxxxxxxxxxx",
        "plays": "..x...x...x...x.",
        "targetParams": {
          "steps": 1,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md"
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
        "target": "x...x.x.x...x.x.",
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 8,
          "pulses": 3,
          "rotation": 2,
          "distribution": 65
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 2,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 4,
        "pulses": 2,
        "rotation": 2,
        "distribution": 24,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "..xx..xx..xx..xx",
        "targetParams": {
          "steps": 2,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 100,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md"
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
        "plays": "x...x...x...x...",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "..x...x...x...x.",
        "plays": "x..x..x.x..x..x.",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 2,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "..x...x...x...x.",
        "targetParams": {
          "steps": 2,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 135,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md"
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
        "target": "x...x...x...x...",
        "plays": "x...x...x..x....",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "target": ".......x.......x",
        "plays": "...x..x....x..x.",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 7,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x.",
        "plays": "..x...x...x...x.",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 2,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 130,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md"
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
        "target": "x.............x.",
        "plays": "x.........x.....",
        "targetParams": {
          "steps": 16,
          "pulses": 2,
          "rotation": 3,
          "distribution": 88
        }
      },
      "snare": {
        "steps": 16,
        "pulses": 6,
        "rotation": 8,
        "distribution": 50,
        "target": "........x.......",
        "plays": "x.x..x..x.x..x..",
        "targetParams": {
          "steps": 16,
          "pulses": 1,
          "rotation": 8,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 6,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x..x..x.x..x..x.",
        "plays": "(polyrhythm N=6)",
        "targetParams": {
          "steps": 8,
          "pulses": 3,
          "rotation": 0,
          "distribution": 50
        }
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
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md"
  },
  {
    "id": "ukgarage",
    "label": "UK Garage",
    "bpm": 135,
    "verified": true,
    "unreachable": null,
    "note": null,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 3,
        "rotation": 4,
        "distribution": 70,
        "target": "x.........x.....",
        "plays": "x........x...x..",
        "targetParams": {
          "steps": 16,
          "pulses": 2,
          "rotation": 7,
          "distribution": 59
        }
      },
      "snare": {
        "steps": 16,
        "pulses": 2,
        "rotation": 4,
        "distribution": 46,
        "target": "....x.......x...",
        "plays": "....x......x....",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 4,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 78,
        "target": "..x...x...x...x.",
        "plays": "......xx.x.xx.x.",
        "targetParams": {
          "steps": 4,
          "pulses": 1,
          "rotation": 2,
          "distribution": 50
        }
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
    },
    "researchBpm": 138,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md"
  },
  {
    "id": "hyphy",
    "label": "Hyphy",
    "bpm": 105,
    "verified": true,
    "unreachable": null,
    "note": null,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 28,
        "target": "x.......x.......",
        "plays": "x..x..x.........",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x...",
        "plays": "....x.......x...",
        "targetParams": {
          "steps": 8,
          "pulses": 1,
          "rotation": 4,
          "distribution": 50
        }
      },
      "hat": {
        "steps": 6,
        "pulses": 6,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x.",
        "plays": "(polyrhythm N=6)",
        "targetParams": {
          "steps": 2,
          "pulses": 1,
          "rotation": 0,
          "distribution": 50
        }
      }
    },
    "researchBpm": 95,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md"
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

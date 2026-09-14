// Genre presets for drum-circles.
//
// PARAMS (steps/pulses/rotation/distribution) are the source of truth: dialled by ear on
// the tuning desk, 2026-09-14. `plays` is what they produce over one bar.
//
// TARGET is the researched canonical pattern (tools/research-genres.md, 2026-09-12), with
// targetConfidence carried from the research: 'high' has a notated source, 'low' means no
// notated source was found and the ear should win. targetParams is the one-ring setting
// that reproduces the target exactly, or null if no single ring can.
//
// verified:true  = every canonical pattern for this genre is reachable with one ring.
// verified:false = at least one is not (unreachable says which); needs ring B.
//
// Each track: ring A flat (steps/pulses/rotation/distribution), `probability`
// 0-100 for both rings, and `b` = a second ring played after A (its own four
// params) or null. `swing` is bipolar MPC-style: 50 straight, >50 off-beat 16ths
// late (67 = triplet), <50 pulled early (cumbia) -- see engine.js swingOffsetSeconds.





window.GENRE_PRESETS = [
  {
    "id": "house",
    "label": "House",
    "bpm": 124,
    "swing": 62,
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 1,
        "distribution": 63,
        "target": "..x...x...x...x.",
        "probability": 100,
        "b": null
      },
      "bass": {
        "steps": 16,
        "pulses": 4,
        "rotation": 3,
        "distribution": 37,
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 40,
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 5,
        "rotation": 2,
        "distribution": 34,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 1,
        "rotation": 15,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 124,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "punchDepth": 84,
        "punchLength": 123,
        "bodyTone": 0.096,
        "timbreX": 0.791,
        "sustain": 46,
        "release": 152
      },
      "snare": {
        "sample": 4
      },
      "hat": {
        "envelope.attack": 0.041
      },
      "fm": {
        "harmonicity": 2.1,
        "modulationIndex": 38.9,
        "modulationEnvelope.attack": 0.001,
        "modulationEnvelope.decay": 0.007,
        "modulationEnvelope.release": 0.001,
        "envelope.decay": 0.167,
        "envelope.release": 0.034,
        "envelope.sustain": 0.15,
        "envelope.attack": 0.013
      },
      "poly": {
        "envelope.release": 0.113
      },
      "bass": {
        "envelope.decay": 0.14,
        "filter.Q": 4.8,
        "filterEnvelope.baseFrequency": 131
      }
    }
  },
  {
    "id": "reggaeton",
    "label": "Reggaeton",
    "bpm": 96,
    "swing": 50,
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 50,
        "plays": "x.x..x..x.x..x..",
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 8,
        "pulses": 4,
        "rotation": 0,
        "distribution": 24,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "plays": "x....x....x.....",
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 95,
    "targetConfidence": "medium-high",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 115,
        "release": 183,
        "timbreX": 0.817,
        "timbreY": 0.762,
        "bodyTone": 0.083,
        "contour": 0.851,
        "punchDepth": 80.4,
        "punchLength": 181
      },
      "snare": {
        "release": 0.03
      },
      "fm": {
        "modulationIndex": 0.1,
        "modulationEnvelope.release": 0.001,
        "envelope.decay": 0.349,
        "envelope.release": 0.001,
        "envelope.sustain": 0.07,
        "envelope.attack": 0.001
      }
    }
  },
  {
    "id": "dancehall",
    "label": "Dancehall",
    "bpm": 100,
    "swing": 50,
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 70,
        "plays": "....x.x.x.x.x.x.",
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 7,
        "rotation": 0,
        "distribution": 72,
        "plays": "....x.xx.x.xx.x.",
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 95,
        "plays": "..........xxx.xx",
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 16,
        "pulses": 3,
        "rotation": 15,
        "distribution": 95,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 100,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "timbreX": 0.972,
        "contour": 0.307,
        "bodyTone": 0.029,
        "sustain": 200,
        "release": 234,
        "punchDepth": 15.3,
        "freq": 60.3
      },
      "snare": {
        "sample": 0,
        "release": 0.02,
        "pitch": 0
      },
      "fm": {
        "modulationIndex": 3,
        "envelope.release": 0.001,
        "harmonicity": 8,
        "modulationEnvelope.attack": 0.001,
        "modulationEnvelope.decay": 0.001,
        "modulationEnvelope.release": 0.001
      }
    }
  },
  {
    "id": "dembow",
    "label": "Dembow Dominicano",
    "bpm": 140,
    "swing": 50,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null,
        "target": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 37,
        "probability": 100,
        "b": null,
        "target": "...x..x....x..x."
      },
      "hat": {
        "steps": 9,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null,
        "target": "xxxxxxxxxxxxxxxx"
      },
      "perc": {
        "steps": 16,
        "pulses": 4,
        "rotation": 6,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 122,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 236,
        "release": 248,
        "bodyTone": 0.082,
        "timbreX": 0.735
      },
      "snare": {
        "pitch": 3
      },
      "perc": {
        "sample": 3
      }
    }
  },
  {
    "id": "bailefunk",
    "label": "Baile Funk",
    "bpm": 130,
    "swing": 44,
    "verified": false,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 2,
        "rotation": 15,
        "distribution": 3,
        "probability": 100,
        "b": null,
        "target": "x.....x...x....."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "probability": 100,
        "b": {
          "steps": 8,
          "pulses": 2,
          "rotation": 7,
          "distribution": 71
        },
        "target": "..x...x.....x.x."
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
        },
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 8,
        "pulses": 2,
        "rotation": 2,
        "distribution": 55,
        "probability": 100,
        "b": {
          "steps": 8,
          "pulses": 2,
          "rotation": 7,
          "distribution": 71
        }
      },
      "fm": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 40,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": "kick+snare",
    "note": "canonical kick and snare need a second ring; see tools/dof.js and research-genres.md",
    "researchBpm": 130,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "punchDepth": 84,
        "release": 204,
        "bodyTone": 0.797,
        "punchLength": 44,
        "timbreX": 0.051,
        "contour": 0.502,
        "sustain": 76,
        "level": 0.464,
        "timbreY": 0.921,
        "freq": 60.5
      },
      "perc": {
        "sample": 1
      },
      "fm": {
        "modulationIndex": 0.1,
        "harmonicity": 2.7,
        "modulationEnvelope.release": 0.165
      },
      "snare": {
        "sample": 3,
        "pitch": 4
      }
    }
  },
  {
    "id": "kuduro",
    "label": "Kuduro",
    "bpm": 140,
    "swing": 50,
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md",
    "synth": {}
  },
  {
    "id": "bouyon",
    "label": "Bouyon",
    "bpm": 150,
    "swing": 50,
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
        },
        "probability": 100,
        "b": null
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "probability": 100,
        "b": {
          "steps": 8,
          "pulses": 2,
          "rotation": 2,
          "distribution": 50
        },
        "target": "....x.......x..."
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
        },
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 0,
        "rotation": 2,
        "distribution": 45,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 50,
        "plays": "x...x...x...x...",
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 8,
        "pulses": 3,
        "rotation": 3,
        "distribution": 34,
        "probability": 100,
        "b": {
          "steps": 16,
          "pulses": 0,
          "rotation": 0,
          "distribution": 50
        }
      },
      "bass": {
        "steps": 16,
        "pulses": 4,
        "rotation": 6,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 67,
        "contour": 0.77,
        "release": 113,
        "bodyTone": 0.02,
        "timbreX": 0.83,
        "punchDepth": 21.8,
        "punchLength": 43
      },
      "perc": {
        "sample": 4
      },
      "snare": {
        "sample": 4
      },
      "bass": {
        "filterEnvelope.octaves": 0.3,
        "oscillator.type": "sine",
        "filterEnvelope.baseFrequency": 590
      }
    }
  },
  {
    "id": "cumbia",
    "label": "Cumbia",
    "bpm": 93,
    "swing": 44,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x.x.x...x.x.",
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "plays": "..x...x...x...x.",
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 50,
        "plays": "..x...x...x...x.",
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 4,
        "rotation": 11,
        "distribution": 50,
        "plays": "...x...x...x...x",
        "probability": 100,
        "b": null
      },
      "bass": {
        "steps": 8,
        "pulses": 3,
        "rotation": 2,
        "distribution": 65,
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 100,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 102,
        "release": 118,
        "timbreX": 0.04,
        "bodyTone": 0.044,
        "punchDepth": 59.9
      },
      "bass": {
        "filterEnvelope.baseFrequency": 161,
        "filterEnvelope.octaves": 0,
        "filterEnvelope.decay": 0.33,
        "filter.Q": 0.4,
        "envelope.decay": 0.23,
        "envelope.release": 0.16
      },
      "snare": {
        "sample": 4
      },
      "hat": {
        "envelope.attack": 0.035,
        "resonance": 6400,
        "harmonicity": 1.3,
        "modulationIndex": 8,
        "frequency": 246
      },
      "perc": {
        "sample": 1,
        "pitch": 7,
        "release": 0.12
      }
    },
    "swingNote": "research: no micro-timing study of cumbia exists; 44-48 (off-beats pulled early) is an inference from the Latin/samba anticipation literature, low confidence -- dial by ear (tools/research-swing.md)"
  },
  {
    "id": "tribal",
    "label": "Tribal (Mexican)",
    "bpm": 126,
    "swing": 50,
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 135,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md",
    "synth": {}
  },
  {
    "id": "ukfunky",
    "label": "UK Funky",
    "bpm": 130,
    "swing": 57,
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
        },
        "probability": 100,
        "b": null
      },
      "snare": {
        "steps": 16,
        "pulses": 3,
        "rotation": 3,
        "distribution": 6,
        "probability": 100,
        "b": {
          "steps": 16,
          "pulses": 2,
          "rotation": 0,
          "distribution": 50
        },
        "target": ".......x.......x"
      },
      "hat": {
        "steps": 4,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null,
        "target": "..x...x...x...x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 37,
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 50,
        "plays": "x..x..x..x..x...",
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 8,
        "pulses": 2,
        "rotation": 3,
        "distribution": 41,
        "probability": 100,
        "b": {
          "steps": 8,
          "pulses": 2,
          "rotation": 1,
          "distribution": 50
        }
      },
      "poly": {
        "steps": 16,
        "pulses": 4,
        "rotation": 3,
        "distribution": 47,
        "probability": 76,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 130,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "punchLength": 124,
        "contour": 0.654,
        "bodyTone": 0.112,
        "timbreX": 0,
        "release": 245,
        "sustain": 122
      },
      "snare": {
        "pitch": 2,
        "sample": 4
      },
      "perc": {
        "sample": 3,
        "pitch": -6
      },
      "hat": {
        "envelope.attack": 0.016,
        "octaves": 2,
        "resonance": 5300,
        "modulationIndex": 89,
        "harmonicity": 8.3
      },
      "fm": {
        "modulationIndex": 5.1,
        "harmonicity": 2.3,
        "envelope.attack": 0.094
      }
    }
  },
  {
    "id": "ukdrill",
    "label": "UK Drill",
    "bpm": 150,
    "swing": 50,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 1,
        "rotation": 0,
        "distribution": 24,
        "probability": 100,
        "b": {
          "steps": 16,
          "pulses": 1,
          "rotation": 12,
          "distribution": 50
        },
        "target": "x.............x."
      },
      "snare": {
        "steps": 16,
        "pulses": 1,
        "rotation": 8,
        "distribution": 50,
        "target": "........x.......",
        "probability": 100,
        "b": null
      },
      "hat": {
        "steps": 8,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "probability": 96,
        "b": {
          "steps": 8,
          "pulses": 4,
          "rotation": 2,
          "distribution": 59
        },
        "target": "x..x..x.x..x..x."
      },
      "pluck": {
        "steps": 16,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 31,
        "probability": 70,
        "b": null
      },
      "perc": {
        "steps": 8,
        "pulses": 0,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 6,
        "rotation": 0,
        "distribution": 37,
        "probability": 89,
        "b": null
      }
    },
    "unreachable": null,
    "note": null,
    "researchBpm": 140,
    "targetConfidence": "medium",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 467,
        "release": 66,
        "timbreX": 0.012,
        "bodyTone": 1,
        "contour": 0.289,
        "punchDepth": 7.2
      },
      "snare": {
        "sample": 3,
        "pitch": 4
      },
      "perc": {
        "sample": 0
      },
      "poly": {
        "oscillator.type": "fattriangle"
      },
      "fm": {
        "modulationIndex": 0.8
      },
      "hat": {
        "frequency": 57,
        "harmonicity": 7.5,
        "resonance": 900,
        "octaves": 0.8,
        "envelope.attack": 0.007
      }
    }
  },
  {
    "id": "ukgarage",
    "label": "UK Garage",
    "bpm": 135,
    "swing": 58,
    "verified": true,
    "unreachable": null,
    "note": null,
    "tracks": {
      "kick": {
        "steps": 8,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "probability": 63,
        "b": {
          "steps": 8,
          "pulses": 3,
          "rotation": 1,
          "distribution": 31
        },
        "target": "x.........x....."
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
        },
        "probability": 100,
        "b": null
      },
      "hat": {
        "steps": 16,
        "pulses": 8,
        "rotation": 0,
        "distribution": 83,
        "target": "..x...x...x...x.",
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 46,
        "plays": "x....x...x......",
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 3,
        "rotation": 1,
        "distribution": 56,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "plays": "x....x....x.....",
        "probability": 100,
        "b": null
      }
    },
    "researchBpm": 138,
    "targetConfidence": "high",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "contour": 0.043,
        "sustain": 115,
        "release": 194,
        "punchDepth": 86.2,
        "punchLength": 185,
        "bodyTone": 0.114,
        "timbreX": 0.082
      },
      "bass": {
        "envelope.decay": 0.2
      },
      "fm": {
        "envelope.release": 0.07,
        "harmonicity": 0.5,
        "modulationIndex": 8.9
      },
      "snare": {
        "release": 0.02,
        "sample": 0,
        "pitch": 5
      },
      "poly": {
        "oscillator.type": "fatsquare",
        "envelope.release": 0.034
      },
      "hat": {
        "envelope.attack": 0.013,
        "resonance": 1500
      }
    }
  },
  {
    "id": "hyphy",
    "label": "Hyphy",
    "bpm": 102,
    "swing": 50,
    "verified": true,
    "unreachable": null,
    "note": null,
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 30,
        "target": "x.......x.......",
        "probability": 100,
        "b": null
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
        },
        "probability": 100,
        "b": null
      },
      "hat": {
        "steps": 16,
        "pulses": 3,
        "rotation": 0,
        "distribution": 18,
        "target": "x.x.x.x.x.x.x.x.",
        "probability": 100,
        "b": null
      },
      "perc": {
        "steps": 16,
        "pulses": 4,
        "rotation": 15,
        "distribution": 96,
        "probability": 100,
        "b": null
      },
      "bass": {
        "steps": 16,
        "pulses": 4,
        "rotation": 14,
        "distribution": 92,
        "probability": 100,
        "b": null
      },
      "pluck": {
        "steps": 16,
        "pulses": 4,
        "rotation": 14,
        "distribution": 90,
        "probability": 100,
        "b": null
      },
      "poly": {
        "steps": 16,
        "pulses": 5,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      },
      "fm": {
        "steps": 16,
        "pulses": 4,
        "rotation": 2,
        "distribution": 37,
        "probability": 100,
        "b": null
      }
    },
    "researchBpm": 95,
    "targetConfidence": "low",
    "targetSource": "tools/research-genres.md",
    "synth": {
      "kick": {
        "sustain": 10,
        "release": 529,
        "bodyTone": 0.299,
        "timbreX": 0,
        "punchDepth": 12.3,
        "contour": 0.376
      },
      "perc": {
        "sample": 1
      },
      "snare": {
        "sample": 3,
        "release": 0.02,
        "pitch": 7
      },
      "bass": {
        "filterEnvelope.octaves": 3,
        "filter.Q": 2.8,
        "oscillator.type": "square"
      },
      "poly": {
        "envelope.sustain": 0.21,
        "oscillator.spread": 67,
        "oscillator.type": "fatsquare"
      }
    }
  }
];

// Synth params shared by every genre; a genre's own `synth` block overrides these.
// RHYTHM 001's example rhythms, tuned on the desk like a genre: one track each,
// the rest silent. `kind: 'example'` keeps them out of the app's genre list.
// `notes` pins a melodic track to one grid index (the beep stays one pitch).
window.EXAMPLE_PRESETS = [
  {
    "id": "ex-techno",
    "label": "ex \u00b7 techno",
    "kind": "example",
    "bpm": 120,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(4,16) on the kick",
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 4,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {}
  },
  {
    "id": "ex-footwork",
    "label": "ex \u00b7 footwork",
    "kind": "example",
    "bpm": 160,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(6,16) rot 6 on the kick",
    "tracks": {
      "kick": {
        "steps": 16,
        "pulses": 6,
        "rotation": 6,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {}
  },
  {
    "id": "ex-ewe",
    "label": "ex \u00b7 Ewe bell",
    "kind": "example",
    "bpm": 120,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(7,12), agogo",
    "tracks": {
      "perc": {
        "steps": 12,
        "pulses": 7,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {
      "perc": {
        "sample": 8
      }
    }
  },
  {
    "id": "ex-venda",
    "label": "ex \u00b7 Venda clap",
    "kind": "example",
    "bpm": 120,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(5,12), clap",
    "tracks": {
      "perc": {
        "steps": 12,
        "pulses": 5,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {
      "perc": {
        "sample": 9
      }
    }
  },
  {
    "id": "ex-tresillo",
    "label": "ex \u00b7 tresillo",
    "kind": "example",
    "bpm": 100,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(3,8), clave",
    "tracks": {
      "perc": {
        "steps": 8,
        "pulses": 3,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {
      "perc": {
        "sample": 10
      }
    }
  },
  {
    "id": "ex-cinquillo",
    "label": "ex \u00b7 cinquillo",
    "kind": "example",
    "bpm": 100,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 E(5,8), clave",
    "tracks": {
      "perc": {
        "steps": 8,
        "pulses": 5,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {
      "perc": {
        "sample": 10
      }
    }
  },
  {
    "id": "ex-beep",
    "label": "ex \u00b7 beep (fm)",
    "kind": "example",
    "bpm": 120,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 the clinical beep under the knob turn and the distribution sweep; the pattern is overridden per render",
    "tracks": {
      "fm": {
        "steps": 16,
        "pulses": 7,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {
      "fm": {
        "modulationIndex": 0.1,
        "harmonicity": 1,
        "envelope.attack": 0.001,
        "envelope.decay": 0.06,
        "envelope.sustain": 0.05,
        "envelope.release": 0.001,
        "modulationEnvelope.attack": 0.001,
        "modulationEnvelope.decay": 0.001,
        "modulationEnvelope.release": 0.001
      }
    },
    "notes": {
      "fm": [
        14
      ]
    }
  },
  {
    "id": "ex-hat",
    "label": "ex \u00b7 hat",
    "kind": "example",
    "bpm": 120,
    "swing": 50,
    "note": "RHYTHM 001 \u00b7 the hat alternative to the beep",
    "tracks": {
      "hat": {
        "steps": 16,
        "pulses": 7,
        "rotation": 0,
        "distribution": 50,
        "probability": 100,
        "b": null
      }
    },
    "synth": {}
  }
];

window.SYNTH_DEFAULTS = {
  "hat": {
    "envelope.decay": 0.017,
    "envelope.release": 0.001
  },
  "pluck": {
    "dampening": 7300,
    "resonance": 0.85,
    "attackNoise": 2.6
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
  },
  "kick": {
    "freq": 60,
    "punchDepth": 46.5,
    "punchLength": 125,
    "timbreX": 0.56,
    "timbreY": 0.618,
    "bodyTone": 0.202,
    "contour": 0.447,
    "sustain": 154,
    "release": 230
  }
};

// Scale-degree indices seeded into each melodic track's note grid.
window.NOTE_SEEDS = {
  "kick": [
    8
  ],
  "bass": [
    10,
    13
  ],
  "pluck": [
    0,
    1,
    2
  ],
  "fm": [
    11,
    12,
    21
  ],
  "poly": [
    0,
    1,
    3,
    14
  ]
};

window.TUNED_SCALE = {"scale":"phrygian","root":"C"};

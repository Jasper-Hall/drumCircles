// Genre presets for drum-circles.
// Params verified against the real engine by tools/genpresets.js -- every entry with
// verified:true reproduces its target pattern exactly with ONE bar-aligned ring.
// verified:false entries are NOT reachable with one ring (see tools/dof.js); they carry
// the nearest reachable params and are excluded from the mobile preset row until
// boolean masks land.
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
        "target": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x."
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
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.......x......."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 41,
        "target": "x..x....x..x...."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.......x......."
      },
      "snare": {
        "steps": 8,
        "pulses": 2,
        "rotation": 0,
        "distribution": 41,
        "target": "x..x....x..x...."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "target": "x.......x......."
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "pulses": 5,
        "rotation": 10,
        "distribution": 50,
        "target": "x..x..x...x..x.."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "target": "x..x..x.x..x..x."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
      }
    },
    "unreachable": null,
    "note": null
  },
  {
    "id": "bouyon",
    "label": "Bouyon",
    "bpm": 128,
    "verified": true,
    "tracks": {
      "kick": {
        "steps": 4,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x."
      },
      "hat": {
        "steps": 1,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "xxxxxxxxxxxxxxxx"
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
        "target": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "target": "x...x...x...x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 3,
        "rotation": 6,
        "distribution": 37,
        "target": "x..x..x.x..x..x."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x."
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
        "distribution": 37,
        "target": "x..x..x...x....."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x."
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
        "target": "x.........x....."
      },
      "snare": {
        "steps": 16,
        "pulses": 1,
        "rotation": 8,
        "distribution": 50,
        "target": "........x......."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
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
        "pulses": 2,
        "rotation": 6,
        "distribution": 24,
        "target": "x.....x...x....."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 4,
        "pulses": 1,
        "rotation": 2,
        "distribution": 50,
        "target": "..x...x...x...x."
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
        "pulses": 2,
        "rotation": 10,
        "distribution": 10,
        "target": "x.....x...x.x..."
      },
      "snare": {
        "steps": 8,
        "pulses": 1,
        "rotation": 4,
        "distribution": 50,
        "target": "....x.......x..."
      },
      "hat": {
        "steps": 2,
        "pulses": 1,
        "rotation": 0,
        "distribution": 50,
        "target": "x.x.x.x.x.x.x.x."
      }
    }
  }
];

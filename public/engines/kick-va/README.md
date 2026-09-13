# kick-va — MutaxKick virtual-analog engine, for the web

`kick_va.dsp` is `plugin-freedom-system/plugins/MutaxKick/faust/engines/virtual_analog.dsp`
verbatim, with the three helpers it pulls from the plugin's `lib/` inlined so it compiles
standalone. Control names, ranges and defaults are the plugin's own (`mutaxkick_body.dsp`).

Rebuild after editing the .dsp:

    faust -lang wasm-e -o dsp-module.wasm kick_va.dsp     # also writes dsp-meta.json
    mv kick_va.json dsp-meta.json

Runtime: `@grame/faustwasm` 0.18.4, vendored at `public/vendor/faustwasm/index.js`.
Loader: `public/faust-kick.js`. Every control is an AudioParam, so `gate` and `freq` are
scheduled with `setValueAtTime` on the transport clock.

Note the plugin defaults `sustain 1000 ms / release 1000 ms` are for a slow kick; at dance
tempos they overlap and want dialling down on the tuning desk.

/* faust-kick.js -- the MutaxKick virtual-analog engine, ported to the web.
 *
 * public/engines/kick-va/kick_va.dsp is the plugin's virtual_analog.dsp with its
 * three lib helpers inlined; dsp-module.wasm and dsp-meta.json are what `faust
 * -lang wasm-e` makes of it. The runtime is @grame/faustwasm 0.18.4, vendored
 * under public/vendor/ so the site keeps its no-build-step deal.
 *
 * Every Faust control is exposed as an AudioParam by faustwasm, with sub-block
 * automation, so the gate can be scheduled with setValueAtTime on the same
 * clock Tone.Transport uses -- no setTimeout, no jitter. To change a knob from
 * the UI, use set(); to fire a hit at a transport time, use trigger().
 */
window.createFaustKick = async function createFaustKick(rawContext, opts = {}) {
    const base = new URL(opts.base || 'public/engines/kick-va/', document.baseURI);
    const runtime = new URL(opts.runtime || 'public/vendor/faustwasm/index.js', document.baseURI);

    const { FaustMonoDspGenerator } = await import(runtime.href);
    const meta = await (await fetch(new URL('dsp-meta.json', base))).json();

    // compileStreaming needs a real application/wasm response; static hosts and
    // iOS PWA caches do not always oblige, so fall back to the ArrayBuffer path.
    const resp = await fetch(new URL('dsp-module.wasm', base));
    let module;
    try {
        module = await WebAssembly.compileStreaming(resp.clone());
    } catch (e) {
        module = await WebAssembly.compile(await resp.arrayBuffer());
    }

    const generator = new FaustMonoDspGenerator();
    const node = await generator.createNode(
        rawContext,
        meta.name || 'MutaxKickVA',
        { module, json: JSON.stringify(meta), soundfiles: {} }
    );

    const prefix = '/' + (meta.name || 'MutaxKickVA') + '/';
    const param = (name) => node.parameters.get(prefix + name);

    return {
        node,
        meta,
        prefix,
        /** Immediate parameter change, e.g. from a slider.
         *  Written to the AudioParam, NOT via setParamValue(): faustwasm reads
         *  every AudioParam each block and pushes it to the DSP, so a value set
         *  by message is overwritten by the param's own (default) value on the
         *  next block. The AudioParam is the single source of truth here. */
        set(name, value) {
            const p = param(name);
            if (!p) return;
            p.cancelScheduledValues(rawContext.currentTime);
            p.setValueAtTime(Number(value), rawContext.currentTime);
        },
        get(name) {
            const p = param(name);
            return p ? p.value : undefined;
        },
        /** Fire one hit at transport time `time` (seconds, context clock). */
        trigger(time, freq) {
            const t = Math.max(time, rawContext.currentTime);
            if (freq != null) param('freq').setValueAtTime(freq, t);
            const gate = param('gate');
            gate.setValueAtTime(1, t);
            // The AHR envelope is retriggered on the gate's rising edge and times
            // itself from there, so the gate only needs to be a short pulse.
            gate.setValueAtTime(0, t + 0.01);
        },
        dispose() {
            try { node.disconnect(); node.destroy && node.destroy(); } catch (e) { /* already gone */ }
        }
    };
};

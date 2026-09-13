// Standalone MutaxKick virtual-analog engine, for drum-circles.
// Body is virtual_analog.dsp verbatim; the lib helpers it needs are inlined
// so the file compiles without the plugin's lib/ path.
import("stdfaust.lib");
declare name "MutaxKickVA";

// --- lib/common.lib ---
linInterp(a, b, f) = a + f * (b - a);
msToSamples(ms) = ms * ma.SR / 1000.0;
trigger(g) = g > g';
// --- lib/envelopes.lib ---
adEnv(gate, attackMs, decayMs) = en.ar(attackMs/1000.0, decayMs/1000.0, trigger(gate));
ahrEnv(gate, attackMs, holdMs, releaseMs) = en.asr(attackMs/1000.0, 1.0, releaseMs/1000.0, timedGate)
with {
    trig = trigger(gate);
    totalOnSamps = max(1, msToSamples(holdMs)) + max(1, msToSamples(attackMs));
    counter = +(1) ~ (*(1 - trig));
    timedGate = (counter > 0) & (counter <= totalOnSamps);
};
pitchEnv(gate, punchDepthPct, punchLengthMs, baseFreq) = baseFreq * (1.0 + (punchDepthPct/100.0) * 4.0 * e * e)
with { e = adEnv(gate, 0.5, punchLengthMs); };
// --- lib/filters.lib ---
moogToFreq(toneNorm) = min(80.0 * (200.0^toneNorm), ma.SR/2 - 1);

// --- engines/virtual_analog.dsp ---
virtualAnalog(gate, freq, timbreX, timbreY, contour, bodyTone,
              punchDepth, punchLength, sustainMs, releaseMs) = output
with {
    pitchedFreq = pitchEnv(gate, punchDepth, punchLength, freq);
    tri = os.triangle(pitchedFreq);
    saw = os.sawtooth(pitchedFreq);
    pw = 0.1 + timbreY * 0.8;
    pulse = os.pulsetrain(pitchedFreq, pw);
    sqr = os.square(pitchedFreq);
    zone = timbreX * 3.0;
    osc = select2(zone < 1.0,
        select2(zone < 2.0,
            linInterp(sqr, pulse, zone - 2.0),
            linInterp(saw, sqr, zone - 1.0)),
        linInterp(tri, saw, zone));
    filterEnv = adEnv(gate, 1.0, 50 + (1.0 - contour) * 500);
    baseCutoff = moogToFreq(bodyTone);
    envAmount = contour * baseCutoff * 3.0;
    cutoff = min(baseCutoff + envAmount * filterEnv, ma.SR/2 - 100);
    filtered = osc : ve.moog_vcf_2bn(0.3, cutoff);
    ampEnv = ahrEnv(gate, 0.5, sustainMs, releaseMs);
    output = filtered * ampEnv : fi.dcblocker;
};

// --- UI: same names, ranges and defaults as mutaxkick_body.dsp ---
gate        = button("gate");
freq        = hslider("freq",        60,   20,  200, 0.1);
timbreX     = hslider("timbreX",     0.4,  0,   1,   0.001);
timbreY     = hslider("timbreY",     0.6,  0,   1,   0.001);
punchDepth  = hslider("punchDepth",  50,   0,   100, 0.1);
punchLength = hslider("punchLength", 100,  10,  800, 1);
contour     = hslider("contour",     0.5,  0,   1,   0.001);
sustainMs   = hslider("sustain",     1000, 10,  2000, 1);
releaseMs   = hslider("release",     1000, 10,  2000, 1);
bodyTone    = hslider("bodyTone",    0.5,  0,   1,   0.001);
level       = hslider("level",       0.8,  0,   1,   0.001);

process = virtualAnalog(gate, freq, timbreX, timbreY, contour, bodyTone,
                        punchDepth, punchLength, sustainMs, releaseMs) * level <: _, _;

// engine.js -- the Euclidean rhythm engine, extracted verbatim from groovebox.js
// (2026-09-10) so a standalone tuning page (tune.html/public/tune.js) can use the
// exact same algorithm as the live app without duplicating it. Load this script
// BEFORE groovebox.js (or tune.js) -- these are plain globals, not ES modules.
// Do not change behaviour here without also verifying index.html and tune.html.

// Distribution reads as a signed weighting, not a percentage: negative pulls the
// pulses toward the front of the bar, positive toward the end, and dead centre is
// the unmodified Euclidean pattern. It is stored 0-100 for backward compatibility
// with saved state and the websocket protocol.
const NEUTRAL_DISTRIBUTION = 50;

function formatDistribution(value) {
    const v = Number(value);
    if (v === NEUTRAL_DISTRIBUTION) return 'EUC';
    const signed = (v - 50) / 50;
    return (signed > 0 ? '+' : '') + signed.toFixed(2);
}

class EuclideanSequencer {
    constructor(steps = 16, pulses = 0, rotation = 0, probability = 100, distribution = 50) {
        this.steps = steps;
        this.pulses = pulses;
        this.rotation = rotation;
        this.probability = probability;
        this.distribution = distribution;
        this.pattern = [];
        this.generatePattern();
    }

    generatePattern() {
        let basePattern = this.bjorklund(this.steps, this.pulses);
        // Apply distribution modification
        this.pattern = this.applyDistribution(basePattern); // Call applyDistribution
    }

    // --- Revised applyDistribution method ---
    // distributionValue defaults to the live value; distributionDetents() passes
    // explicit values in to probe the range without mutating the sequencer.
    applyDistribution(pattern, distributionValue = this.distribution) {
        const steps = this.steps;
        const pulses = this.pulses;

        // Edge cases: No change needed
        if (distributionValue === 50 || pulses <= 0 || pulses >= steps) {
            return pattern;
        }

        // Create a new empty pattern
        const newPattern = new Array(steps).fill(false);
        
        // Find positions of active pulses in the original Euclidean pattern
        const activePulsePositions = [];
        for (let i = 0; i < steps; i++) {
            if (pattern[i]) {
                activePulsePositions.push(i);
            }
        }

        // Target positions for each distribution extreme
        const leftTargetPositions = Array.from({length: pulses}, (_, i) => i); // [0,1,2,...]
        const rightTargetPositions = Array.from({length: pulses}, (_, i) => steps - pulses + i); // [steps-pulses, ...]
        
        // Calculate blend factor (0 = pure euclidean, 1 = pure target)
        const blendFactor = Math.abs(distributionValue - 50) / 50;
        const useLeftTarget = distributionValue < 50;
        
        // For each pulse, interpolate between its euclidean position and its target position
        for (let i = 0; i < activePulsePositions.length; i++) {
            const euclideanPos = activePulsePositions[i];
            const targetPos = useLeftTarget ? leftTargetPositions[i] : rightTargetPositions[i];
            
            // Linear interpolation between euclidean and target position
            // As blendFactor goes from 0 to 1, we move from euclidean to target
            let newPos = Math.round(euclideanPos * (1 - blendFactor) + targetPos * blendFactor);
            
            // Ensure the position is within bounds
            newPos = Math.min(Math.max(0, newPos), steps - 1);
            
            // Handle position conflicts by shifting
            while (newPattern[newPos]) {
                // If we're moving left, try the next position to the right
                // If we're moving right, try the next position to the left
                if (useLeftTarget) {
                    newPos = (newPos + 1) % steps;
                } else {
                    newPos = (newPos - 1 + steps) % steps;
                }
            }
            
            // Set the pulse at its new position
            newPattern[newPos] = true;
        }
        
        return newPattern;
    }
    // --- End revised applyDistribution method ---

    // Revised bjorklund method to calculate pattern starting from step 0
    bjorklund(steps, pulses) {
        if (pulses <= 0) return new Array(steps).fill(false);
        if (pulses >= steps) return new Array(steps).fill(true);

        // Initialize pattern array with all false
        const pattern = new Array(steps).fill(false);

        // Normal Euclidean algorithm, but with a consistent starting point
        if (pulses > 0) {
            // This ensures the pattern calculation begins at step 0
            let positions = Array(steps).fill(0).map((_, i) => i); // [0, 1, 2, ...]
            
            // Calculate the step size for even distribution
            let stepSize = steps / pulses;
            
            // Place pulses at positions determined by the step size
            for (let i = 0; i < pulses; i++) {
                let pos = Math.floor(i * stepSize);
                pattern[pos] = true;
            }
            
            // Optional: Adjustment to make patterns more "canonical" for specific cases
            // This helps ensure the first pulse is at position 0 for common patterns
            if (pulses === 2 && steps === 5) {
                pattern.fill(false);
                pattern[0] = true;
                pattern[3] = true;
            } else if (pulses === 3 && steps === 8) {
                pattern.fill(false);
                pattern[0] = true;
                pattern[3] = true;
                pattern[6] = true;
            }
        }
        
        return pattern;
    }

    // --- Distribution detents ---------------------------------------------
    // The distribution range is 0-100, but at any given (steps, pulses) only
    // 14-50 of those positions produce a *different* pattern; the rest are
    // plateaus, and they are not evenly spread. Measured 2026-09-09
    // (tools/plateau.js): N=16 K=5 yields 45 distinct patterns across 101
    // positions, with plateaus up to 7 positions long, and K=6/K=7 have a
    // 6-position dead band sitting right on top of the centre -- exactly where
    // fine control matters most, since that is the approach to the Euclidean
    // pattern.
    //
    // So the knob is detented onto the values where the pattern actually
    // changes. Every step of the knob is then a new rhythm, the throw is
    // allocated by where the parameter does something rather than uniformly
    // across a number line, and the dead band at centre disappears.
    distributionDetents() {
        const base = this.bjorklund(this.steps, this.pulses);

        // Group the 0-100 range into plateaus of identical output.
        const plateaus = [];
        let previous = null;
        for (let d = 0; d <= 100; d++) {
            const key = this.applyDistribution(base, d)
                .map(hit => (hit ? '1' : '0'))
                .join('');
            if (key === previous) {
                plateaus[plateaus.length - 1].push(d);
            } else {
                plateaus.push([d]);
                previous = key;
            }
        }

        // Represent each plateau by its member nearest dead centre. Taking the
        // first member instead would put the neutral detent at the *start* of the
        // centre plateau (typically 47, not 50), so the unmodified Euclidean
        // pattern would read as an offset value and a reset would land off centre.
        return plateaus.map(group =>
            group.reduce((best, d) =>
                (Math.abs(d - NEUTRAL_DISTRIBUTION) < Math.abs(best - NEUTRAL_DISTRIBUTION) ? d : best),
                group[0])
        );
    }

    getStep(step) {
        // Rotate the step counter-clockwise (opposite of the visual rotation)
        const rotatedStep = (step - this.rotation + this.steps) % this.steps;
        
        // Apply probability
        if (Math.random() * 100 > this.probability) {
            return false;
        }
        
        // Return the pattern value at the rotated position
        return this.pattern && this.pattern.length > rotatedStep ? this.pattern[rotatedStep] : false;
    }

    updateParams(steps, pulses, rotation, probability = this.probability, distribution = this.distribution) {
        const oldSteps = this.steps;
        const oldRotation = this.rotation;
        const stepsChanged = this.steps !== steps;
        const pulsesChanged = this.pulses !== pulses;
        const distributionChanged = this.distribution !== distribution; // Check if distribution changed

        // 1. Update steps first
        this.steps = Math.min(Math.max(1, steps), 16);

        // 2. Update rotation, clamping it based on the NEW steps value
        // Use modulo to wrap rotation within the bounds [0, steps-1]
        this.rotation = (rotation % this.steps + this.steps) % this.steps;

        // 3. Ensure pulses is never greater than the NEW steps
        this.pulses = Math.min(Math.max(0, pulses), this.steps);

        // 4. Update probability and distribution
        this.probability = Math.min(Math.max(0, probability), 100);
        this.distribution = Math.min(Math.max(0, distribution), 100);

        // Regenerate pattern if steps, pulses, or distribution changed
        if (stepsChanged || pulsesChanged || distributionChanged) {
             this.generatePattern();
        }
        // Note: Rotation and Probability changes don't require regenerating the base pattern
        // Return true if rotation was clamped by the steps change
        return stepsChanged && oldRotation >= this.steps;
    }
}


/* ---- Swing ----------------------------------------------------------------
 * Bipolar, MPC-numbered. 50 = straight. Above 50 the off-beat 16ths (the 2nd
 * and 4th of each beat) are pushed LATE, on the MPC scale where the off-beat
 * lands at swing% of the 8th-note pair: 66.7 = triplet feel, 75 = dotted.
 * Below 50 is the mirror -- the off-beats are pulled EARLY -- which no MPC
 * offers and which cumbia's anticipated scraper/conga up-beat needs
 * (tools/research-swing.md). Both apps apply this per event instead of using
 * Tone's Transport.swing, which is positive-only.
 *
 * offset = (swing - 50) / 50 * one 16th step, so 75 -> +half a step and
 * 25 -> -half a step. The pulled-early side relies on the scheduler's 300 ms
 * look-ahead (below) so the shifted time is still in the future.
 */
const NEUTRAL_SWING = 50;
const SWING_MIN = 25;
const SWING_MAX = 75;
function swingOffsetSeconds(step, swingPct, stepSeconds) {
    if (step % 2 === 0) return 0;
    const s = Math.min(SWING_MAX, Math.max(SWING_MIN, Number(swingPct) || NEUTRAL_SWING));
    return (s - NEUTRAL_SWING) / 50 * stepSeconds;
}
function formatSwing(v) {
    const s = Math.round(Number(v));
    return s === NEUTRAL_SWING ? 'straight' : s + '%' + (s < NEUTRAL_SWING ? ' (early)' : '');
}

/* ---- Scheduler hardening ----------------------------------------------
 * Shared by index.html and tune.html; must run before any Tone node exists,
 * which is why it sits at load time in this file (loaded right after Tone).
 *
 * Symptom this addresses: on a low battery (macOS/iOS Low Power Mode) the
 * browser coarsens its timers, Tone's ticker fires late, and events land in
 * the past -- steps bunch up or skip. Tone's defaults (100 ms look-ahead,
 * 30 ms tick) leave no slack for that. A sequencer has no live input to make
 * latency matter, so trade it for headroom:
 *  - latencyHint 'playback': larger hardware buffers, fewer underruns, and
 *    less CPU per callback (the thing Low Power Mode is starving).
 *  - lookAhead 300 ms: events are committed to the audio thread well before
 *    they are due, so a tick that arrives 150 ms late still lands on time.
 *  - updateInterval 50 ms: fewer, fatter ticks; the Worker clock source is
 *    kept because Workers are throttled less than main-thread timers.
 */
const SCHEDULER = { latencyHint: 'playback', lookAhead: 0.3, updateInterval: 0.05 };
function hardenScheduler() {
    try {
        const ctx = new Tone.Context({
            latencyHint: SCHEDULER.latencyHint,
            lookAhead: SCHEDULER.lookAhead,
            updateInterval: SCHEDULER.updateInterval,
        });
        const stale = Tone.getContext();
        Tone.setContext(ctx);
        // Tone's global `Tone.Transport` / `Tone.Draw` were captured from the
        // context that existed at load time; the apps must go through
        // Tone.getTransport() / Tone.getDraw() so they follow this one.
        stale.dispose();
    } catch (e) {
        // Fall back to tuning the context Tone already made.
        const ctx = Tone.getContext();
        ctx.lookAhead = SCHEDULER.lookAhead;
        ctx.updateInterval = SCHEDULER.updateInterval;
    }
}
hardenScheduler();

/* ---- iOS Safari audio ---------------------------------------------------
 * Shared by index.html and tune.html. Two separate problems, both silent:
 *  1. The hardware mute switch silences WebAudio unless the page declares a
 *     'playback' audio session (iOS 17+). Harmless elsewhere.
 *  2. The AudioContext only starts inside a user gesture, and iOS wants a real
 *     buffer played through it before it will pass audio at all. Done once on
 *     the first touch/click/key, and re-armed if iOS suspends the context after
 *     a lock or app switch.
 */
function setPlaybackAudioSession() {
    try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) {
        /* unsupported (older iOS / other browsers): harmless */
    }
}

let audioUnlocked = false;
async function unlockAudio() {
    if (audioUnlocked) return;
    try {
        // Resumes Tone's context synchronously within the gesture.
        await Tone.start();
        const ctx = Tone.context.rawContext || Tone.context;
        if (ctx.state !== 'running' && ctx.resume) {
            await ctx.resume();
        }
        // A one-sample silent buffer fully wakes the iOS audio pipeline.
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        audioUnlocked = true;
        // iOS can "interrupt" (suspend) the context after a lock/app-switch;
        // re-arm so the next tap unlocks again.
        if (ctx.onstatechange === null) {
            ctx.onstatechange = () => {
                if (ctx.state !== 'running') audioUnlocked = false;
            };
        }
    } catch (e) {
        // leave audioUnlocked false so a later gesture retries
    }
}

['touchend', 'pointerdown', 'mousedown', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockAudio, { passive: true });
});


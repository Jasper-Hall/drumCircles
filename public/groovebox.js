class Groovebox {
    constructor() {
        this.isPlaying = false;
        this.steps = 16;
        this.currentScale = 'major';
        this.currentStep = 0;
        this.rows = 12; // One octave of notes
        this.lastStepTime = 0;
        this.humanizeMs = 0; // groove: ± timing jitter applied in triggerSynth
        this.delaySynced = false; // groove: fx delay-time slider in seconds vs tempo-synced notes

        // Keep existing scales
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            phrygian: [0, 1, 3, 5, 7, 8, 10],
            lydian: [0, 2, 4, 6, 7, 9, 11],
            mixolydian: [0, 2, 4, 5, 7, 9, 10]
        };

        // Initialize Tone.js
        Tone.Transport.bpm.value = 120;

        // Initialize audio context and effects
        this.setupEffects();

        // Setup synths and mixer channels
        this.setupSynths();

        // Setup transport
        this.setupTransport();

        // Create UI elements
        this.createUI();

        this.setupEventListeners();

        // Initialize WebSocket (multiplayer is opt-in: local development only,
        // production static hosting has no WebSocket server)
        this.ws = null;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(`${protocol}//${window.location.hostname}:${window.location.port}`);
                this.initializeWebSocketHandlers();
            } catch (error) {
                console.warn('WebSocket unavailable, running in single-player mode:', error);
                this.ws = null;
            }
        }

        this.currentTrack = 'pluck'; // or whatever default track you want
        this.selectedNotes = new Set();

        // Add help system initialization
        this.helpMode = false;
        this.tooltip = this.createHelpTooltip();
        this.helpContent = {
            // Transport controls
            'playButton': 'Start or stop playback of all sequencers',
            'bpmControl': 'Set the tempo in beats per minute (60-200 BPM). Higher values = faster playback',
            'swingControl': 'Swing - Delays every other 16th note for a shuffled feel. 0% is straight, higher values push the offbeats later',
            'humanizeControl': 'Humanize - Adds a small random timing offset (in ms) to every triggered note so the groove feels less quantized',

            // Sequencer visualization
            'circular-sequencer': 'Visual pattern display: Outer ring shows first pattern, inner ring shows second pattern. Lit steps will trigger notes',
            
            // Sequencer controls - use more specific selector
            'knob-controls': `Euclidean Rhythm Controls:
                - Steps: Set sequence length (1-16)
                - Pulses: Set number of active beats (0-16)
                - Rotation: Shift pattern left/right 
                - Distribution: Change pulse spacing (Center: even, Left: front-bias, Right: end-bias)
                - Probability: Chance of triggers (0-100%)
                
                Outer ring controls the first pattern
                Inner ring controls the second pattern`,
            
            // Logic and Note Selection
            'pattern-sequence-controls': 'Sequential Pattern Mode: Patterns will play one after another instead of being combined',
            
            // Mixer controls
            'fader-container[data-channel="master"]': 'Master Volume Control - Adjusts the overall volume of all tracks',
            'fader-container:not([data-channel="master"])': 'Track volume control. Drag up/down to adjust how loud this track plays',
            'pan-container': 'Stereo position control. Left = sound comes from left speaker, Right = sound comes from right speaker',
            'mixer-sends': 'Sends - This channel\'s own reverb/delay send levels, tapped after its volume/pan/mute/solo so a muted or faded-down track stays out of the shared reverb/delay',
            'mixer-channel button.mute': 'Mute button (M) - Click to silence this track',
            'mixer-channel button.solo': 'Solo button (S) - Click to hear only this track',
            
            // Effects controls
            'reverbMix': 'Reverb Mix - Amount of reverb effect. Higher values create more space and atmosphere',
            'reverbDecay': 'Reverb Decay - How long the reverb tail lasts. Higher values create longer echoes',
            'delayMix': 'Delay Mix - Amount of delay/echo effect. Higher values create more pronounced echoes',
            'delayTime': 'Delay Time - Time between echo repeats. Higher values create longer gaps between echoes. When "sync" is on, snaps to tempo-synced note values instead of seconds',
            'delayFeedback': 'Delay Feedback - Number of echo repeats. Higher values create more repeats',
            'delaySyncToggle': 'Sync - When on, the delay time slider snaps to tempo-synced note values (16n, 8n, 8n., 4n, 4n., 2n) instead of raw seconds',

            // Synth controls
            'synth-controls': 'Sound shaping controls specific to this instrument. Adjust to change the character of the sound',
            'groove-controls': 'Groove - Accent (velocity contrast) and gate (note length as a multiple of the 16th-note grid slot) for this track\'s hits. Reverb/delay send levels live on this track\'s mixer channel strip now',
            'filter-controls': 'Filter - A lowpass filter between this track\'s synth and its mixer channel. Cutoff sets where the top end rolls off; resonance adds emphasis around the cutoff',

            // smpl track
            'sample-select': 'Sample - Choose which one-shot this track plays. Grid notes still repitch the sample up or down the scale, so it plays like a melodic percussion instrument',

            // poly track
            'wave-select': 'Waveform - Oscillator shape for this voice. The "fat" types layer several detuned oscillators (see spread) for a thicker unison sound',
            'osc-spread-control': 'Spread - Detune spread (in cents) between the layered oscillators of a fat waveform. Wider spread = thicker, more chorused unison',
            'chord-toggle': 'Chord - Off: cycles through this track\'s selected notes one per trigger. On: triggers every selected note together as a chord (capped at 8 voices)',

            // noise track
            'noise-color-select': 'Noise Color - Changes the frequency spectrum of the noise: white is even across all frequencies, pink rolls off highs, brown rolls off highs more steeply',

            // Update the note selection help content to match both classes
            'note-selection': 'Grid of available notes - Click notes to select which ones will be played by the sequencer',
            'note-button': 'Click to toggle this note on/off in the sequence. Selected notes will be played in order.',
            
            // Scale Selection controls
            'scale-selector': 'Change the musical scale and root note to define which notes are available in the grid',
            'scaleSelect': 'Choose the musical scale (e.g., major, minor, pentatonic) to determine the note intervals',
            'rootNote': 'Set the root note (C, C#, etc.) - all notes in the grid will be based on this starting point',
            
            // Compressor controls
            'compressor-controls': 'Master Compressor - Shapes the overall dynamics of the sound',
            'compThreshold': 'Threshold - Volume level where compression begins. Lower values = more compression',
            'compRatio': 'Ratio - Amount of compression applied. Higher values = more aggressive compression',
            'compAttack': 'Attack - How quickly compression is applied. Lower values = faster response',
            'compRelease': 'Release - How quickly compression recovers. Higher values = smoother recovery',
            'compKnee': 'Knee - Smoothness of compression onset. Higher values = gentler transition',
        };

        this.setupHelpSystem();
    }

    initializeWebSocketHandlers() {
        if (!this.ws) return;
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received WebSocket message:', data);
                
                switch (data.type) {
                    case 'INIT_STATE':
                    case 'STATE_UPDATE':
                        console.log('Applying state update:', data.state);
                        this.syncState(data.state);
                        break;
                    case 'KNOB_CHANGE':
                        // Check if the message is for the current client to avoid loopback
                        if (data.clientId !== this.clientId) {
                             this.handleKnobChange(data.payload);
                        }
                        break;
                    case 'LOGIC_CHANGE':
                        this.updateTrackControl(data.trackId, 'logicOperator', data.operator);
                        break;
                    case 'MIXER_CHANGE':
                        this.updateMixerControl(data.channelId, data.parameter, data.value);
                        break;
                    case 'TRANSPORT_CHANGE':
                        this.handleRemoteTransportChange(data);
                        break;
                    case 'SYNTH_PARAM_CHANGE':
                        this.updateSynthParam(data.trackId, data.parameter, data.value);
                        break;
                    case 'NOTE_SELECTION_CHANGE':
                        this.handleRemoteNoteSelection(data);
                        break;
                    case 'EFFECTS_CHANGE':
                        this.handleEffectsChange(data);
                        break;
                    case 'EFFECT_PARAM_CHANGE':
                        this.handleEffectParamChange(data);
                        break;
                    default:
                        console.warn('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    setupEffects() {
        // Create master channel and compressor
        this.masterCompressor = new Tone.Compressor({
            threshold: -24,
            ratio: 4,
            attack: 0.003,
            release: 0.25,
            knee: 30
        });
        
        this.mixer = new Tone.Gain(1);
        
        // Connect mixer -> compressor -> destination
        this.mixer.connect(this.masterCompressor);
        this.masterCompressor.toDestination();

        // Create effects
        this.reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.3,
            preDelay: 0.1
        });

        this.delay = new Tone.FeedbackDelay({
            delayTime: "8n",
            feedback: 0.4,
            wet: 0.3
        });

        // No global pre-fader sends here: each Track owns its own
        // reverbSend/delaySend Gain nodes, tapped from that track's mixer
        // Channel OUTPUT (see Groovebox.setupSynths()), so mute/solo/fader
        // changes affect what reaches these shared effects.
        this.reverb.connect(this.mixer);
        this.delay.connect(this.mixer);
    }

    setupSynths() {
        // Sampler track ("smpl"): 8 one-shots from the Sonic Pi sample
        // library (public/samples/, CC0 -- see public/samples/README.md),
        // each pre-loaded into its own Tone.Sampler mapped to C3. Only the
        // selected sampler is ever connected into the track's signal chain
        // (see Track.setSample()); the rest sit idle but loaded so switching
        // is instant. Page is served from the repo root (index.html), so
        // the URL is relative to that, not to this script.
        this.sampleKit = [
            { id: 'kick', label: 'kick', file: 'public/samples/drum_heavy_kick.m4a' },
            { id: 'snare', label: 'snare', file: 'public/samples/drum_snare_hard.m4a' },
            { id: 'hat', label: 'hat', file: 'public/samples/drum_cymbal_closed.m4a' },
            { id: 'openhat', label: 'open hat', file: 'public/samples/drum_cymbal_open.m4a' },
            { id: 'tom', label: 'tom', file: 'public/samples/drum_tom_mid_hard.m4a' },
            { id: 'cowbell', label: 'cowbell', file: 'public/samples/drum_cowbell.m4a' },
            { id: 'snap', label: 'snap', file: 'public/samples/perc_snap.m4a' },
            { id: 'esnare', label: 'e-snare', file: 'public/samples/elec_hi_snare.m4a' }
        ];
        const samplers = {};
        this.sampleKit.forEach(({ id, file }) => {
            samplers[id] = new Tone.Sampler({ C3: file });
        });

        // Initialize synths with their full parameter controls
        this.synths = {
            pluck: new Track('pluck', new Tone.PluckSynth({
                attackNoise: 1,
                dampening: 4000,
                resonance: 0.7
            }), {
                attackNoise: { min: 0.1, max: 20, step: 0.1, default: 1 },
                dampening: { min: 100, max: 8000, step: 100, default: 4000 },
                resonance: { min: 0.1, max: 0.9, step: 0.01, default: 0.7 }
            }, this),
            fm: new Track('fm', new Tone.FMSynth({
                harmonicity: 3,
                modulationIndex: 10,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.2,
                    release: 0.2
                },
                modulation: { type: 'square' },
                modulationEnvelope: {
                    attack: 0.5,
                    decay: 0,
                    sustain: 1,
                    release: 0.5
                }
            }), {
                'harmonicity': { min: 0.1, max: 10, step: 0.1, default: 3 },
                'modulationIndex': { min: 0.1, max: 40, step: 0.1, default: 10 },
                'envelope.attack': { min: 0.001, max: 2, step: 0.001, default: 0.01 },
                'envelope.decay': { min: 0.001, max: 2, step: 0.001, default: 0.2 },
                'envelope.sustain': { min: 0, max: 1, step: 0.01, default: 0.2 },
                'envelope.release': { min: 0.001, max: 4, step: 0.001, default: 0.2 },
                'modulationEnvelope.attack': { min: 0.001, max: 2, step: 0.001, default: 0.5 },
                'modulationEnvelope.decay': { min: 0.001, max: 2, step: 0.001, default: 0 },
                'modulationEnvelope.sustain': { min: 0, max: 1, step: 0.01, default: 1 },
                'modulationEnvelope.release': { min: 0.001, max: 4, step: 0.001, default: 0.5 }
            }, this),
            membrane: new Track('membrane', new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 10,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    sustain: 0.01,
                    release: 0.4,
                    attackCurve: 'exponential'
                },
                frequency: 30
            }), {
                'frequency': { min: 20, max: 200, step: 1, default: 30, label: 'Pitch' },
                'pitchDecay': { min: 0.001, max: 0.5, step: 0.001, default: 0.05, label: 'Pitch Decay' },
                'octaves': { min: 1, max: 12, step: 1, default: 10, label: 'Octave Range' },
                'envelope.attack': { min: 0.001, max: 0.1, step: 0.001, default: 0.001, label: 'Attack' },
                'envelope.decay': { min: 0.001, max: 1, step: 0.001, default: 0.4, label: 'Decay' },
                'envelope.sustain': { min: 0.001, max: 1, step: 0.001, default: 0.01, label: 'Sustain' },
                'envelope.release': { min: 0.001, max: 1, step: 0.001, default: 0.4, label: 'Release' }
            }, this),
            metal: new Track('metal', new Tone.MetalSynth({
                frequency: 200,
                envelope: {
                    attack: 0.001,
                    decay: 1.4,
                    release: 0.2
                },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5
            }), {
                'frequency': { min: 50, max: 1000, step: 1, default: 200 },
                'harmonicity': { min: 0.1, max: 10, step: 0.1, default: 5.1 },
                'modulationIndex': { min: 1, max: 100, step: 1, default: 32 },
                'resonance': { min: 100, max: 8000, step: 100, default: 4000 },
                'octaves': { min: 0.5, max: 4, step: 0.1, default: 1.5 },
                'envelope.attack': { min: 0.001, max: 1, step: 0.001, default: 0.001 },
                'envelope.decay': { min: 0.001, max: 2, step: 0.001, default: 1.4 },
                'envelope.release': { min: 0.001, max: 2, step: 0.001, default: 0.2 }
            }, this),
            // NOTE: the 2-arg `new Tone.PolySynth(voice, options)` form maps
            // `options` entirely to per-voice construction options (Tone
            // 14.8.49's optionsFromArguments keys are ["voice","options"]
            // for that arity) -- a maxPolyphony field nested in there is
            // silently ignored, not read as the instance's polyphony cap.
            // maxPolyphony is set as a plain property right after
            // construction below instead, which _getNextAvailableVoice()
            // reads dynamically and does take effect.
            poly: new Track('poly', new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: 'fatsawtooth',
                    count: 3,
                    spread: 24
                },
                envelope: {
                    attack: 0.05,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 0.8
                }
            }), {
                'envelope.attack': { min: 0.001, max: 2, step: 0.001, default: 0.05 },
                'envelope.decay': { min: 0.001, max: 2, step: 0.001, default: 0.3 },
                'envelope.sustain': { min: 0, max: 1, step: 0.01, default: 0.4 },
                'envelope.release': { min: 0.001, max: 4, step: 0.001, default: 0.8 }
            }, this),
            noise: new Track('noise', new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0
                }
            }), {
                'envelope.attack': { min: 0.001, max: 1, step: 0.001, default: 0.005 },
                'envelope.decay': { min: 0.001, max: 1, step: 0.001, default: 0.1 },
                'envelope.sustain': { min: 0, max: 1, step: 0.01, default: 0 }
            }, this),
            smpl: new Track('smpl', samplers.kick, {}, this)
        };

        // Wire up the smpl track's sample bank (see Track.setSample() /
        // Track.createControls()) now that the Track exists. Only samplers.kick
        // is connected (done in the Track constructor's generic
        // `this.synth.connect(this.filter)`); the rest stay loaded but idle.
        this.synths.smpl.samplers = samplers;
        this.synths.smpl.sampleKit = this.sampleKit;
        this.synths.smpl.currentSampleId = 'kick';

        // See the NOTE above poly's constructor call: maxPolyphony has to be
        // set here, as a plain property, to actually take effect.
        this.synths.poly.synth.maxPolyphony = 8;

        // Create controls for each track after initialization
        Object.values(this.synths).forEach(track => {
            track.controlsContainer = track.createControls();
        });

        // Initialize mixer channels
        this.mixerChannels = {};
        
        // Set up mixer channels and connect synths
        Object.entries(this.synths).forEach(([name, track]) => {
            // Create mixer channel. poly runs a touch quieter by default --
            // fat saws (x3, chorused) plus optional chord mode are much
            // louder than the other tracks' single-oscillator/sample voices.
            const channel = new Tone.Channel({
                volume: name === 'poly' ? -23 : -20,
                pan: 0,
                mute: false,
                solo: false
            }).connect(this.mixer);
            
            this.mixerChannels[name] = channel;

            // Signal path: synth -> filter (connected in the Track
            // constructor) -> channel -> mixer (dry, connected above) and,
            // in parallel, this track's own reverb/delay sends. The sends
            // tap the channel OUTPUT (post volume/pan/mute/solo) so a muted
            // or faded-down track doesn't bleed into the shared reverb/delay.
            track.filter.connect(channel);
            channel.connect(track.reverbSend);
            track.reverbSend.connect(this.reverb);
            channel.connect(track.delaySend);
            track.delaySend.connect(this.delay);

            // Initialize selectedNotes for the track if not already set
            if (!track.selectedNotes) {
                track.selectedNotes = new Set([0, 4, 7]); // Default to major triad
            }
        });
    }

    setupTransport() {
        // Schedule the repeat function
        Tone.Transport.scheduleRepeat((time) => {
            this.repeat(time);
        }, "16n");

        // Initialize transport controls
        this.setupTransportControls();
    }

    setupTransportControls() {
        const playButton = document.getElementById('playButton');
        const bpmControl = document.getElementById('bpmControl');

        if (!playButton) {
            console.warn('#playButton not found; transport controls not initialized');
            return;
        }

        // Remove existing listeners if any
        const newPlayButton = playButton.cloneNode(true);
        playButton.parentNode.replaceChild(newPlayButton, playButton);

        // Add play button event listener
        newPlayButton.addEventListener('click', async () => {
            try {
                await Tone.start();
                if (Tone.Transport.state === 'started') {
                    Tone.Transport.stop();
                    this.isPlaying = false;
                    newPlayButton.textContent = 'Play';
                } else {
                    Tone.Transport.start();
                    this.isPlaying = true;
                    newPlayButton.textContent = 'Stop';
                }
                newPlayButton.classList.toggle('active', this.isPlaying);
            } catch (error) {
                console.error('Error starting audio context:', error);
            }
        });

        // Set up BPM control
        if (bpmControl) {
            bpmControl.addEventListener('input', (e) => {
                Tone.Transport.bpm.value = parseFloat(e.target.value);
            });
        }

        // Swing: 0-100% mapped to Tone.Transport.swing's 0-1 range.
        Tone.Transport.swingSubdivision = '16n';
        const swingControl = document.getElementById('swingControl');
        if (swingControl) {
            swingControl.addEventListener('input', (e) => {
                const percent = parseFloat(e.target.value);
                Tone.Transport.swing = percent / 100;
                const display = e.target.parentElement.querySelector('.value-display');
                if (display) display.textContent = `${Math.round(percent)}%`;
                this.broadcastStateChange('TRANSPORT_CHANGE', { swing: percent });
            });
        }

        // Humanize: ms of +/- timing jitter, applied per-note in triggerSynth.
        const humanizeControl = document.getElementById('humanizeControl');
        if (humanizeControl) {
            humanizeControl.addEventListener('input', (e) => {
                const ms = parseFloat(e.target.value);
                this.humanizeMs = ms;
                const display = e.target.parentElement.querySelector('.value-display');
                if (display) display.textContent = `${Math.round(ms)}ms`;
                this.broadcastStateChange('TRANSPORT_CHANGE', { humanize: ms });
            });
        }
    }

    repeat(time) {
        if (!this.isPlaying) return;
        
        // Prevent duplicate triggers
        if (time === this.lastStepTime) return;
        this.lastStepTime = time;
        
        // Get current step - use a very large number to prevent resetting too early
        // This allows us to count through all steps of both patterns
        const step = this.currentStep;
        
        // Trigger synths for each track if step is active
        Object.entries(this.synths).forEach(([name, track]) => {
            if (track.getStepValue(step)) {
                track.currentNoteIndex = step;
                this.triggerSynth(name, track, time, step);
            }
        });

        // Update visualization for each track
        Object.values(this.synths).forEach(track => {
            if (track.updateVisualization) {
                track.updateVisualization(step);
            }
        });

        // Advance to next step without constraining to this.steps
        // Each track will handle its own step counting internally
        this.currentStep += 1;
    }

    triggerSynth(name, track, time, step = this.currentStep) {
        // Humanize: small +/- timing jitter (ms -> seconds). Clamped so the
        // scheduled time is never negative regardless of jitter direction.
        const humanizeSeconds = (this.humanizeMs || 0) / 1000;
        const jitter = humanizeSeconds > 0 ? (Math.random() * 2 - 1) * humanizeSeconds : 0;
        const triggerTime = Math.max(0, time + jitter);

        // Accent/velocity: the euclidean downbeat (logical step 0 of
        // whichever pattern -- outer or inner -- is currently active) always
        // hits at full velocity; other steps sit at (1 - accent) with a
        // small +/-0.08 random wobble so the groove doesn't feel robotic.
        let velocity;
        if (track.isDownbeat(step)) {
            velocity = 1.0;
        } else {
            const base = 1 - track.accent;
            const wobble = (Math.random() * 2 - 1) * 0.08;
            velocity = Math.min(1, Math.max(0, base + wobble));
        }

        // Gate: note duration scales off the 16n grid slot. Tone 14.8.49
        // signature notes (verified against source):
        //  - Instrument.triggerAttackRelease(note, duration, time, velocity)
        //    covers PluckSynth, FMSynth, MembraneSynth, MetalSynth. Velocity
        //    reaches the amplitude envelope for all of them EXCEPT
        //    PluckSynth, whose triggerAttack(note, time) signature has no
        //    velocity parameter at all -- it's accepted here harmlessly but
        //    has no audible effect on a plucked string.
        //  - PolySynth.triggerAttackRelease(notes, duration, time, velocity)
        //  - NoiseSynth.triggerAttackRelease(duration, time, velocity) --
        //    note this one has NO note argument.
        const gateSeconds = track.gate * Tone.Time('16n').toSeconds();

        // Sampler loading guard: the smpl track's currently-selected one-shot
        // may not have finished decoding yet (samples load async). Skip the
        // trigger silently rather than let Tone throw on an empty buffer.
        if (track.synth instanceof Tone.Sampler && !track.synth.loaded) {
            return;
        }

        // Special handling for noise synth which doesn't need note information
        if (track.synth instanceof Tone.NoiseSynth) {
            track.synth.triggerAttackRelease(gateSeconds, triggerTime, velocity);
            return;
        }

        // Normal handling for pitched synths
        const rootNote = document.getElementById('rootNote')?.value || 'C';
        const notes = track.getNotesToPlay(this.currentScale, rootNote);
        if (notes.length > 0) {
            if (track.synth instanceof Tone.PolySynth) {
                track.synth.triggerAttackRelease(notes, gateSeconds, triggerTime, velocity);
            } else {
                track.synth.triggerAttackRelease(notes[0], gateSeconds, triggerTime, velocity);
            }
        }
    }

    createUI() {
        // Transport controls (#playButton, #bpmControl) already exist in the HTML
        // and are wired once in setupTransport() -> setupTransportControls().

        // Create scale selector
        this.createScaleSelector();

        // Create tracks container
        const tracksContainer = document.querySelector('.tracks');

        // Create tracks with circular sequencers
        Object.entries(this.synths).forEach(([name, track]) => {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'track';

            // Track header
            const header = document.createElement('h3');
            header.textContent = name;
            trackDiv.appendChild(header);

            // Use the track's createSequencerSVG() method to get the SVG
            const sequencerSVG = track.svg;
            trackDiv.appendChild(sequencerSVG);

            // Use the track's createControls() method to get the controls
            const controls = track.createControls();
            trackDiv.appendChild(controls);

            tracksContainer.appendChild(trackDiv);
        });

        // Create mixer UI
        this.createMixerUI();

        // Setup VU meters
        this.setupVUMeters();
    }

    createScaleSelector() {
        const scaleContainer = document.createElement('div');
        scaleContainer.className = 'scale-selector';
        scaleContainer.innerHTML = `
            <label>Scale: 
                <select id="scaleSelect">
                    ${Object.keys(this.scales).map(scale => 
                        `<option value="${scale}">${scale}</option>`
                    ).join('')}
                </select>
            </label>
            <label>Root Note: 
                <select id="rootNote">
                    ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                        .map(note => `<option value="${note}">${note}</option>`).join('')}
                </select>
            </label>
        `;
        document.querySelector('.groovebox').appendChild(scaleContainer);
    }

    createMixerUI() {
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer';

        // Add compressor controls
        const compressorControls = document.createElement('div');
        compressorControls.className = 'compressor-controls';
        compressorControls.innerHTML = `
            <h4>Master Compressor</h4>
            <div class="comp-control">
                <label>Threshold</label>
                <input type="range" id="compThreshold" min="-60" max="0" value="-24" step="1">
                <span class="value-display">-24 dB</span>
            </div>
            <div class="comp-control">
                <label>Ratio</label>
                <input type="range" id="compRatio" min="1" max="20" value="4" step="0.5">
                <span class="value-display">4:1</span>
            </div>
            <div class="comp-control">
                <label>Attack</label>
                <input type="range" id="compAttack" min="0.001" max="1" value="0.003" step="0.001">
                <span class="value-display">3ms</span>
            </div>
            <div class="comp-control">
                <label>Release</label>
                <input type="range" id="compRelease" min="0.01" max="1" value="0.25" step="0.01">
                <span class="value-display">250ms</span>
            </div>
            <div class="comp-control">
                <label>Knee</label>
                <input type="range" id="compKnee" min="0" max="40" value="30" step="1">
                <span class="value-display">30 dB</span>
            </div>
        `;

        // Create master channel
        const masterChannel = this.createMixerChannel('master', true);
        
        // Add everything to mixer container
        mixerContainer.appendChild(compressorControls);
        mixerContainer.appendChild(masterChannel);
        
        // Add separator and rest of channels
        const separator = document.createElement('div');
        separator.className = 'mixer-separator';
        mixerContainer.appendChild(separator);

        // Add individual channels
        Object.keys(this.synths).forEach(synthName => {
            const channel = this.createMixerChannel(synthName);
            mixerContainer.appendChild(channel);
        });

        document.querySelector('.groovebox').appendChild(mixerContainer);
    }

    createMixerChannel(name, isMaster = false) {
        const channel = document.createElement('div');
        channel.className = 'mixer-channel';
        channel.dataset.channel = name;

        // Seed the fader's displayed value from the actual channel gain
        // (mixerChannels is populated before createMixerUI() runs) rather
        // than a hardcoded -20, so per-track defaults like poly's -23 show
        // correctly instead of just being silently correct under the hood.
        const faderDefault = !isMaster && this.mixerChannels[name]
            ? this.mixerChannels[name].volume.value
            : -20;

        // Same idea for the send sliders: seed from this track's actual
        // reverbSend/delaySend Gain nodes (this.synths is populated by
        // setupSynths(), which runs before createUI() -> createMixerChannel(),
        // so the Track object already exists here) rather than assuming the
        // 0.35 default, in case it's ever changed per-track.
        const track = !isMaster ? this.synths[name] : null;
        const reverbSendDefault = track ? track.reverbSend.gain.value : 0.35;
        const delaySendDefault = track ? track.delaySend.gain.value : 0.35;

        channel.innerHTML = `
            <h4>${name}</h4>
            <div class="fader-container">
                <div class="vu-meter">
                    <div class="vu-meter-fill"></div>
                </div>
                <input type="range" class="fader"
                       data-channel="${name}"
                       min="-60" max="0" value="${faderDefault}"
                       orient="vertical">
            </div>
            ${!isMaster ? `
                <div class="pan-container">
                    <input type="range" class="pan"
                           data-channel="${name}"
                           min="-1" max="1" step="0.1" value="0">
                </div>
                <div class="mixer-sends">
                    <div class="send-row">
                        <label>rev</label>
                        <input type="range" class="send-slider"
                               data-channel="${name}" data-send="reverbSend"
                               min="0" max="1" step="0.01" value="${reverbSendDefault}">
                    </div>
                    <div class="send-row">
                        <label>dly</label>
                        <input type="range" class="send-slider"
                               data-channel="${name}" data-send="delaySend"
                               min="0" max="1" step="0.01" value="${delaySendDefault}">
                    </div>
                </div>
                <button class="mute" data-channel="${name}">M</button>
                <button class="solo" data-channel="${name}">S</button>
            ` : ''}
        `;

        return channel;
    }

    setupEventListeners() {
        // Remove the specific knob listener setup from here
        // Object.values(this.synths).forEach(track => {
        //     // Knobs - THIS SECTION IS REMOVED
        //     track.controlsContainer.querySelectorAll('.knob-input').forEach(knob => {
        //         knob.addEventListener('input', (e) => {
        //             // ... removed listener code ...
        //         });
        //     });
        // });

        // Keep the listeners for other controls
        this.setupSynthParameterListeners();
        this.setupEffectsEventListeners();
        // Wire up mixer faders/pan/mute/solo (UI was created in createUI())
        this.setupMixerEventListeners();
        // Add listeners for scale/root note changes
        this.setupScaleListeners();
        // NOTE: transport listeners are wired once in setupTransport() ->
        // setupTransportControls(); the help system is set up once at the end
        // of the constructor (after helpContent exists). Do not add them here,
        // it duplicates listeners and creates a second #helpToggle button.
    }

    setupScaleListeners() {
        // Example: Add listeners for scale and root note dropdowns
        console.log("Setting up scale listeners...");
        const scaleSelect = document.getElementById('scaleSelect');
        const rootNoteSelect = document.getElementById('rootNote');

        if (scaleSelect) {
            scaleSelect.addEventListener('change', (e) => {
                this.currentScale = e.target.value;
                this.updateAllNoteSelections(); // Update note buttons based on new scale
                this.broadcastStateChange('SCALE_CHANGE', { scale: this.currentScale });
            });
        }
        if (rootNoteSelect) {
            rootNoteSelect.addEventListener('change', (e) => {
                // Assuming root note change requires updating note selections
                this.updateAllNoteSelections(); 
                this.broadcastStateChange('ROOT_NOTE_CHANGE', { rootNote: e.target.value });
            });
        }
    }

    // Update every track's note-selection grid (after scale/root note changes)
    updateAllNoteSelections() {
        Object.values(this.synths).forEach(track => {
            if (track.updateNoteSelection) {
                track.updateNoteSelection();
            }
        });
    }

    updateNoteSelections() {
        Object.values(this.synths).forEach(track => {
            // Recreate note selection controls
            const oldNoteSelection = track.controlsContainer.querySelector('.note-selection');
            const newNoteSelection = track.createNoteSelection();
            track.controlsContainer.replaceChild(newNoteSelection, oldNoteSelection);
        });
    }

    setupMixerEventListeners() {
        // Faders
        document.querySelectorAll('.fader').forEach(fader => {
            fader.addEventListener('input', (e) => {
                const channel = e.target.dataset.channel;
                const value = parseFloat(e.target.value);
                if (channel === 'master') {
                    this.mixer.gain.value = Tone.dbToGain(value);
                } else {
                    this.mixerChannels[channel].volume.value = value;
                }

                // Broadcast change
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'MIXER_CHANGE',
                        channelId: channel,
                        parameter: 'volume',
                        value: value
                    }));
                }
            });
        });

        // Pan controls
        document.querySelectorAll('.pan').forEach(pan => {
            pan.addEventListener('input', (e) => {
                const channel = e.target.dataset.channel;
                const value = parseFloat(e.target.value);
                if (channel !== 'master') {
                    this.mixerChannels[channel].pan.value = value;
                }

                // Broadcast change
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'MIXER_CHANGE',
                        channelId: channel,
                        parameter: 'pan',
                        value: value
                    }));
                }
            });
        });

        // Reverb/delay sends -- moved here from the track panel, onto each
        // channel's mixer strip. Same Gain nodes (track.reverbSend/
        // delaySend) the old per-track sliders drove, and the same
        // SYNTH_PARAM_CHANGE broadcast shape, so remote peers and
        // updateSynthParam()'s remote-update path don't need to know these
        // sliders changed location.
        document.querySelectorAll('.send-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const channel = e.target.dataset.channel;
                const param = e.target.dataset.send; // 'reverbSend' or 'delaySend'
                const value = parseFloat(e.target.value);
                const track = this.synths[channel];
                if (track && track[param]) {
                    track[param].gain.value = value;
                }

                // Broadcast change
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'SYNTH_PARAM_CHANGE',
                        trackId: channel,
                        parameter: param,
                        value: value
                    }));
                }
            });
        });

        // Mute/Solo buttons
        document.querySelectorAll('.mute, .solo').forEach(button => {
            button.addEventListener('click', (e) => {
                const channel = e.target.dataset.channel;
                const type = e.target.classList.contains('mute') ? 'mute' : 'solo';
                this.mixerChannels[channel][type] = !this.mixerChannels[channel][type];
                e.target.classList.toggle('active');

                // Broadcast change
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'MIXER_CHANGE',
                        channelId: channel,
                        parameter: type,
                        value: this.mixerChannels[channel][type]
                    }));
                }
            });
        });
    }

    setupSynthParameterListeners() {
        // :not([data-track-control]) excludes the newer per-track sends/
        // filter/accent/gate sliders, which reuse the .param-control markup
        // for styling but manage their own apply/display/broadcast logic
        // (see Track.createParamControl) since some of them (filter cutoff)
        // need non-linear value mapping this generic handler doesn't do.
        document.querySelectorAll('.param-control input[type="range"]:not([data-track-control])').forEach(control => {
            control.addEventListener('input', (e) => {
                const synthName = e.target.dataset.synth;
                const param = e.target.dataset.param;
                const value = parseFloat(e.target.value);
                const track = this.synths[synthName];

                if (!track) {
                    console.warn(`Track ${synthName} not found`);
                    return;
                }

                // Update parameter value display
                const display = e.target.parentElement.querySelector('.value-display');
                if (display) {
                    display.textContent = value.toFixed(2);
                }

                // Update synth parameter
                try {
                    if (param.includes('.')) {
                        const [category, property] = param.split('.');
                        if (track.synth instanceof Tone.PolySynth) {
                            // PolySynth exposes no per-voice objects; set() fans out to voices
                            track.synth.set({ [category]: { [property]: value } });
                        } else if (track.synth[category]) {
                            if (track.synth[category] instanceof Tone.Signal) {
                                track.synth[category].value = value;
                            } else {
                                track.synth[category][property] = value;
                            }
                        }
                    } else {
                        if (track.synth[param] instanceof Tone.Signal) {
                            track.synth[param].value = value;
                        } else {
                            track.synth[param] = value;
                        }
                    }
                    console.log(`Updated ${synthName} ${param} to ${value}`);
                } catch (error) {
                    console.error(`Error updating synth parameter: ${error.message}`);
                }

                // Broadcast change
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'SYNTH_PARAM_CHANGE',
                        trackId: synthName,
                        parameter: param,
                        value: value
                    }));
                }
            });
        });
    }

    setupEffectsEventListeners() {
        // Compressor controls
        const compressorControls = {
            'compThreshold': { param: 'threshold', min: -60, max: 0 },
            'compRatio': { param: 'ratio', min: 1, max: 20 },
            'compAttack': { param: 'attack', min: 0.001, max: 1 },
            'compRelease': { param: 'release', min: 0.01, max: 1 },
            'compKnee': { param: 'knee', min: 0, max: 40 }
        };

        Object.entries(compressorControls).forEach(([id, config]) => {
            const control = document.getElementById(id);
            if (control) {
                control.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    try {
                        this.masterCompressor[config.param].value = value;
                        this.updateEffectDisplay(e.target, value);
                    } catch (error) {
                        console.error(`Error updating compressor: ${error.message}`);
                    }
                });
            }
        });

        // Reverb controls
        const reverbMix = document.getElementById('reverbMix');
        const reverbDecay = document.getElementById('reverbDecay');

        if (reverbMix) {
            reverbMix.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.reverb.wet.value = value;
                this.updateEffectDisplay(e.target, value);
            });
        }

        if (reverbDecay) {
            reverbDecay.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.reverb.decay = value;
                this.updateEffectDisplay(e.target, value);
            });
        }

        // Delay mix & feedback (unsynced numeric params)
        const delayControls = {
            'delayMix': { param: 'wet', signal: true },
            'delayFeedback': { param: 'feedback', signal: true }
        };

        Object.entries(delayControls).forEach(([id, config]) => {
            const control = document.getElementById(id);
            if (control) {
                control.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    try {
                        if (config.signal) {
                            this.delay[config.param].value = value;
                        } else {
                            this.delay[config.param] = value;
                        }
                        this.updateEffectDisplay(e.target, value);
                    } catch (error) {
                        console.error(`Error updating delay: ${error.message}`);
                    }
                });
            }
        });

        // Delay time: seconds (0-1) by default, or 6 tempo-synced note
        // values when the "sync" toggle is on.
        const delayTimeControl = document.getElementById('delayTime');
        const delaySyncToggle = document.getElementById('delaySyncToggle');
        const delaySyncSubdivisions = ['16n', '8n', '8n.', '4n', '4n.', '2n'];

        const applyDelayTime = () => {
            if (!delayTimeControl) return;
            if (this.delaySynced) {
                const index = Math.min(
                    Math.max(Math.round(parseFloat(delayTimeControl.value)), 0),
                    delaySyncSubdivisions.length - 1
                );
                const notation = delaySyncSubdivisions[index];
                this.delay.delayTime.value = notation;
                this.updateEffectDisplay(delayTimeControl, notation);
            } else {
                const seconds = parseFloat(delayTimeControl.value);
                this.delay.delayTime.value = seconds;
                this.updateEffectDisplay(delayTimeControl, seconds);
            }
        };

        if (delayTimeControl) {
            delayTimeControl.addEventListener('input', applyDelayTime);
        }

        if (delaySyncToggle) {
            delaySyncToggle.addEventListener('click', () => {
                this.delaySynced = !this.delaySynced;
                delaySyncToggle.classList.toggle('active', this.delaySynced);
                if (!delayTimeControl) return;

                if (this.delaySynced) {
                    delayTimeControl.min = 0;
                    delayTimeControl.max = delaySyncSubdivisions.length - 1;
                    delayTimeControl.step = 1;
                    delayTimeControl.value = 1; // '8n', close to the 0.5s default
                } else {
                    // Seed the slider with the seconds-equivalent of whatever
                    // notated value was last set, so flipping sync off doesn't
                    // jump the delay time unexpectedly.
                    const currentSeconds = Tone.Time(this.delay.delayTime.value).toSeconds();
                    delayTimeControl.min = 0;
                    delayTimeControl.max = 1;
                    delayTimeControl.step = 0.01;
                    delayTimeControl.value = Math.min(1, Math.max(0, currentSeconds));
                }
                applyDelayTime();
            });
        }
    }

    updateEffectDisplay(element, value) {
        const display = element.parentElement.querySelector('.value-display');
        if (display) {
            display.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }
    }

    setupSequencerEventListeners() {
        // Remove or comment out the conflicting knob listener setup
        /*
        const knobs = document.querySelectorAll('.knob-container input[type="range"]');
        knobs.forEach(knob => {
            knob.addEventListener('input', (e) => {
                // ... removed conflicting listener code ...
            });
        });
        */
       console.log("Groovebox.setupSequencerEventListeners called, but knob listeners are now handled by Track.createKnob.");
       // Keep any other listeners this method might be responsible for, if any.
    }

    setupVUMeters() {
        // Setup channel VU meters
        Object.entries(this.mixerChannels).forEach(([name, channel]) => {
            const meter = document.querySelector(`.mixer-channel[data-channel="${name}"] .vu-meter-fill`);
            if (!meter) return;

            const analyser = new Tone.Analyser('waveform', 128);
            channel.connect(analyser);

            const updateMeter = () => {
                const values = analyser.getValue();
                const rms = Math.sqrt(values.reduce((acc, val) => acc + (val * val), 0) / values.length);
                const db = 20 * Math.log10(rms);
                const percent = Math.max(0, Math.min(100, (db + 60) * (100/60)));
                meter.style.height = `${percent}%`;
                requestAnimationFrame(updateMeter);
            };

            updateMeter();
        });

        // Setup master VU meter
        const masterMeter = document.querySelector(`.mixer-channel[data-channel="master"] .vu-meter-fill`);
        if (masterMeter) {
            const masterAnalyser = new Tone.Analyser('waveform', 128);
            this.mixer.connect(masterAnalyser);

            const updateMasterMeter = () => {
                const values = masterAnalyser.getValue();
                const rms = Math.sqrt(values.reduce((acc, val) => acc + (val * val), 0) / values.length);
                const db = 20 * Math.log10(rms);
                const percent = Math.max(0, Math.min(100, (db + 60) * (100/60)));
                masterMeter.style.height = `${percent}%`;
                requestAnimationFrame(updateMasterMeter);
            };

            updateMasterMeter();
        }
    }

    updateTrackControl(trackName, param, value) {
        const track = this.synths[trackName];
        if (!track) return;

        // Handle knob controls
        if (param.includes('-')) {
            const knob = track.controlsContainer.querySelector(`#${param}`);
            if (knob) {
                knob.value = value;
                // Update knob display
                const display = knob.parentElement.querySelector('.value-display');
                if (display) display.textContent = value;
                
                // Update sequencer state
                const [type, control] = param.split('-');
                const sequencer = type === 'outer' ? track.outerSequencer : track.innerSequencer;
                if (sequencer) {
                    sequencer.updateParams(
                        control === 'steps' ? value : sequencer.steps,
                        control === 'pulses' ? value : sequencer.pulses,
                        control === 'rotation' ? value : sequencer.rotation,
                        control === 'probability' ? value : sequencer.probability,
                        control === 'distribution' ? value : sequencer.distribution
                    );
                }
            }
        }
        
        track.updateVisualization(this.currentStep);
    }

    updateMixerControl(channelId, param, value) {
        const channel = this.mixerChannels[channelId];
        if (!channel) return;

        switch (param) {
            case 'volume':
                channel.volume.value = value;
                const fader = document.querySelector(`.fader[data-channel="${channelId}"]`);
                if (fader) fader.value = value;
                break;
            case 'pan':
                channel.pan.value = value;
                const pan = document.querySelector(`.pan[data-channel="${channelId}"]`);
                if (pan) pan.value = value;
                break;
            case 'mute':
            case 'solo':
                channel[param] = value;
                const button = document.querySelector(`.${param}[data-channel="${channelId}"]`);
                if (button) button.classList.toggle('active', value);
                break;
        }
    }

    updateSynthParam(synthName, param, value) {
        const track = this.synths[synthName];
        if (!track || !track.synth) return;

        console.log(`Updating synth param: ${synthName}.${param} = ${value}`);

        // Newer per-track controls (sends, filter, accent, gate) live on the
        // Track itself rather than on track.synth; handle them here (value
        // is always the "real" applied value -- e.g. Hz for filter.frequency,
        // not the slider's raw 0-1 log position) and update their UI, then
        // return before the track.synth-oriented logic below.
        if (param === 'filter.frequency') {
            if (track.filter) track.filter.frequency.value = value;
            const input = track.controlsContainer?.querySelector('input[data-param="filter.frequency"]');
            if (input) {
                input.value = track.freqToNorm(value);
                const display = input.parentElement.querySelector('.value-display');
                if (display) display.textContent = track.formatFrequency(value);
            }
            return;
        }
        if (param === 'filter.Q') {
            if (track.filter) track.filter.Q.value = value;
            const input = track.controlsContainer?.querySelector('input[data-param="filter.Q"]');
            if (input) {
                input.value = value;
                const display = input.parentElement.querySelector('.value-display');
                if (display) display.textContent = value.toFixed(1);
            }
            return;
        }
        if (param === 'reverbSend' || param === 'delaySend') {
            if (track[param]) track[param].gain.value = value;
            // These sliders live on this track's mixer channel strip now
            // (not track.controlsContainer -- see createMixerChannel()),
            // so a remote change has to look them up there instead.
            const input = document.querySelector(`.mixer-channel[data-channel="${synthName}"] input[data-send="${param}"]`);
            if (input) {
                input.value = value;
                const display = input.parentElement.querySelector('.value-display');
                if (display) display.textContent = value.toFixed(2);
            }
            return;
        }
        if (param === 'accent' || param === 'gate') {
            track[param] = value;
            const input = track.controlsContainer?.querySelector(`input[data-param="${param}"]`);
            if (input) {
                input.value = value;
                const display = input.parentElement.querySelector('.value-display');
                if (display) display.textContent = value.toFixed(2);
            }
            return;
        }

        // String-valued select controls (sample choice, oscillator
        // waveform, noise color) and the chord toggle -- handled here,
        // before the numeric fallback below, since that fallback calls
        // value.toFixed() which throws on a string.
        if (param === 'sample') {
            track.setSample(value);
            const select = track.controlsContainer?.querySelector('select[data-param="sample"]');
            if (select) select.value = value;
            return;
        }
        if (param === 'chord') {
            track.chordMode = value;
            const btn = track.controlsContainer?.querySelector('.chord-toggle');
            if (btn) btn.classList.toggle('active', value);
            return;
        }
        if (param === 'oscillator.type') {
            if (track.synth.set) track.synth.set({ oscillator: { type: value } });
            const select = track.controlsContainer?.querySelector('select[data-param="oscillator.type"]');
            if (select) select.value = value;
            return;
        }
        if (param === 'oscillator.spread') {
            if (track.synth.set) track.synth.set({ oscillator: { spread: value } });
            const input = track.controlsContainer?.querySelector('input[data-param="oscillator.spread"]');
            if (input) {
                input.value = value;
                const display = input.parentElement.querySelector('.value-display');
                if (display) display.textContent = value;
            }
            return;
        }
        if (param === 'noise.type') {
            if (track.synth.noise) track.synth.noise.type = value;
            const select = track.controlsContainer?.querySelector('select[data-param="noise.type"]');
            if (select) select.value = value;
            return;
        }

        // Update the synth parameter
        if (param.includes('.')) {
            const [category, property] = param.split('.');
            if (track.synth instanceof Tone.PolySynth) {
                // PolySynth exposes no per-voice objects; set() fans out to voices
                track.synth.set({ [category]: { [property]: value } });
            } else if (track.synth[category]) {
                // Handle envelope parameters properly
                if (track.synth[category] instanceof Tone.Envelope) {
                    track.synth[category][property] = value;
                } else if (track.synth[category] instanceof Tone.Signal) {
                    track.synth[category].value = value;
                } else {
                    track.synth[category][property] = value;
                }
            }
        } else {
            // Handle top-level parameters
            if (track.synth[param] instanceof Tone.Signal) {
                track.synth[param].value = value;
            } else {
                track.synth[param] = value;
            }
        }

        // Update UI
        const paramControl = track.controlsContainer.querySelector(`input[data-param="${param}"]`);
        if (paramControl) {
            paramControl.value = value;
            const display = paramControl.parentElement.querySelector('.value-display');
            if (display) display.textContent = value.toFixed(2);
        }

        console.log(`Synth parameter updated: ${synthName}.${param} = ${value}`);
    }

    syncState(state) {
        console.log('Synchronizing state:', state);

        // Update transport state
        if (typeof state.isPlaying === 'boolean') {
            this.isPlaying = state.isPlaying;
            const playButton = document.querySelector('#playButton');
            if (playButton) {
                playButton.classList.toggle('active', this.isPlaying);
            }
        }

        // Update tracks
        if (state.tracks) {
            Object.entries(state.tracks).forEach(([trackName, trackState]) => {
                const track = this.synths[trackName];
                if (!track) {
                    console.warn(`Track ${trackName} not found`);
                    return;
                }

                // Update sequencer states
                if (trackState.outerSequencer) {
                    track.outerSequencer.updateParams(
                        trackState.outerSequencer.steps || track.outerSequencer.steps,
                        trackState.outerSequencer.pulses || track.outerSequencer.pulses,
                        trackState.outerSequencer.rotation || track.outerSequencer.rotation,
                        trackState.outerSequencer.probability || track.outerSequencer.probability,
                        trackState.outerSequencer.distribution || track.outerSequencer.distribution
                    );

                    // Update UI knobs
                    Object.entries(trackState.outerSequencer).forEach(([param, value]) => {
                        const knob = track.controlsContainer.querySelector(`#outer-${param}`);
                        if (knob) {
                            knob.value = value;
                            const display = knob.parentElement.querySelector('.value-display');
                            if (display) display.textContent = value;
                        }
                    });
                }

                // Similar updates for innerSequencer
                if (trackState.innerSequencer) {
                    // ... (similar to outerSequencer)
                }

                // Update visualization
                track.updateVisualization(this.currentStep);
            });
        }

        // Update mixer state
        if (state.mixerState) {
            Object.entries(state.mixerState).forEach(([channelId, channelState]) => {
                Object.entries(channelState).forEach(([param, value]) => {
                    this.updateMixerControl(channelId, param, value);
                });
            });
        }

        // Update synth parameters
        if (state.synthParams) {
            Object.entries(state.synthParams).forEach(([trackId, params]) => {
                Object.entries(params).forEach(([param, value]) => {
                    this.updateSynthParam(trackId, param, value);
                });
            });
        }

        console.log('State synchronization complete');
    }

    handleRemoteNoteSelection(data) {
        // Access the correct Track instance using data.trackId
        const track = this.synths[data.trackId];
        if (!track || !track.controlsContainer) return;
    
        // Select the specific note button within the track's controlsContainer
        const button = track.controlsContainer.querySelector(
            `.note-button[data-note-index="${data.noteIndex}"]`
        );
    
        if (button) {
            if (data.selected) {
                track.selectedNotes.add(data.noteIndex);
                button.classList.add('selected');
            } else {
                track.selectedNotes.delete(data.noteIndex);
                button.classList.remove('selected');
            }
        }
    }

    handleRemoteTransportChange(data) {
        // Apply transport changes broadcast by another client
        if (typeof data.bpm === 'number' && !Number.isNaN(data.bpm)) {
            Tone.Transport.bpm.value = data.bpm;
            const bpmControl = document.getElementById('bpmControl');
            if (bpmControl) bpmControl.value = data.bpm;
        }
        if (typeof data.isPlaying === 'boolean') {
            this.isPlaying = data.isPlaying;
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.textContent = data.isPlaying ? 'Stop' : 'Play';
                playButton.classList.toggle('active', data.isPlaying);
            }
        }
        if (typeof data.swing === 'number' && !Number.isNaN(data.swing)) {
            Tone.Transport.swing = data.swing / 100;
            const swingControl = document.getElementById('swingControl');
            if (swingControl) {
                swingControl.value = data.swing;
                const display = swingControl.parentElement.querySelector('.value-display');
                if (display) display.textContent = `${Math.round(data.swing)}%`;
            }
        }
        if (typeof data.humanize === 'number' && !Number.isNaN(data.humanize)) {
            this.humanizeMs = data.humanize;
            const humanizeControl = document.getElementById('humanizeControl');
            if (humanizeControl) {
                humanizeControl.value = data.humanize;
                const display = humanizeControl.parentElement.querySelector('.value-display');
                if (display) display.textContent = `${Math.round(data.humanize)}ms`;
            }
        }
    }

    createHelpTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    setupHelpSystem() {
        // Idempotency guard: only ever create one help toggle button
        if (document.getElementById('helpToggle')) return;

        // Create help toggle button with fixed positioning
        const helpToggle = document.createElement('button');
        helpToggle.id = 'helpToggle';
        helpToggle.className = 'help-icon';
        helpToggle.textContent = '?';
        helpToggle.title = 'Toggle Help Mode';
        document.body.appendChild(helpToggle);
    
        helpToggle.addEventListener('click', () => {
            this.helpMode = !this.helpMode;
            helpToggle.classList.toggle('active');
            document.body.classList.toggle('help-mode');
            
            // Select only the original controls, not any help-related duplicates
            const controls = document.querySelectorAll(`
                .track:not(.help-duplicate) .knob-container,
                .track:not(.help-duplicate) .note-selection,
                .track:not(.help-duplicate) .note-button,
                .fader-container:not(.help-duplicate),
                .pan-container:not(.help-duplicate),
                .mixer-channel button:not(#helpToggle):not(.help-duplicate),
                .circular-sequencer:not(.help-duplicate),
                .effects-controls:not(.help-duplicate),
                .pattern-sequence-controls:not(.help-duplicate),
                .synth-controls:not(.help-duplicate),
                .scale-selector:not(.help-duplicate),
                .compressor-controls:not(.help-duplicate),
                .comp-control:not(.help-duplicate),
                input:not(#helpToggle):not(.help-duplicate),
                button:not(#helpToggle):not(.help-duplicate),
                select:not(.help-duplicate)
            `);
    
            controls.forEach(control => {
                if (control.id !== 'helpToggle') {
                    control.classList.toggle('help-active');
                }
            });
    
            if (this.helpMode) {
                // Remove any existing help-related duplicates first
                document.querySelectorAll('.help-duplicate').forEach(el => el.remove());
    
                this.showHelpTooltip(
                    'Help Mode Active: Hover over any control to see what it does!',
                    window.innerWidth / 2,
                    50
                );
            } else {
                this.hideHelpTooltip();
                // Clean up any remaining help-active classes
                document.querySelectorAll('.help-active').forEach(el => {
                    if (el.id !== 'helpToggle') {
                        el.classList.remove('help-active');
                    }
                });
                // Remove any help-related duplicates
                document.querySelectorAll('.help-duplicate').forEach(el => el.remove());
            }
        });
    
        // Keep your existing mouseover/mouseout event listeners
        document.addEventListener('mouseover', (e) => {
            if (this.helpMode) {
                this.handleHelpHover(e);
            }
        });
    
        document.addEventListener('mouseout', (e) => {
            if (this.helpMode) {
                this.hideHelpTooltip();
            }
        });
    }
    handleHelpHover(e) {
        if (!this.helpMode) return;

        // Walk up the DOM tree to find the first element with help content
        let target = e.target;
        let content = null;

        while (target && target !== document.body) {
            for (const [key, text] of Object.entries(this.helpContent)) {
                if (target.id === key || 
                    target.classList.contains(key) || 
                    target.matches(key) ||
                    (target.closest && target.closest('.' + key))) {
                    content = text;
                    break;
                }
            }
            if (content) break;
            target = target.parentElement;
        }

        if (content) {
            // Get the outermost matching container for better hover area
            const container = target.closest('.help-active') || target;
            const rect = container.getBoundingClientRect();
            const x = rect.left + (rect.width / 2);
            const y = rect.top - 10;
            this.showHelpTooltip(content, x, y);
        } else {
            this.hideHelpTooltip();
        }
    }

    showHelpTooltip(content, x, y) {
        this.tooltip.innerHTML = content.replace(/\n/g, '<br>');
        this.tooltip.style.opacity = '1';
        
        // Position tooltip near the element
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const offset = 10;
        
        // Try to position above the element first
        let posX = x - (tooltipRect.width / 2);
        let posY = y - tooltipRect.height - offset;
        
        // If tooltip would go off top of screen, position it below the element
        if (posY < 0) {
            posY = y + offset;
        }
        
        // Ensure tooltip stays within horizontal screen bounds
        if (posX < offset) {
            posX = offset;
        } else if (posX + tooltipRect.width > window.innerWidth - offset) {
            posX = window.innerWidth - tooltipRect.width - offset;
        }

        this.tooltip.style.left = `${posX}px`;
        this.tooltip.style.top = `${posY}px`;
    }

    hideHelpTooltip() {
        this.tooltip.style.opacity = '0';
    }

    broadcastStateChange(type, data) {
        if (!this.ws) return; // Multiplayer disabled (no WebSocket server)
        if (this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: type,
                ...data
            });
            console.log('Broadcasting state change:', message);
            this.ws.send(message);
        } else {
            console.warn('WebSocket not ready for broadcasting');
        }
    }

    handleEffectsChange(data) {
        const { effect, parameter, value } = data;
        
        switch (effect) {
            case 'compressor':
                if (this.masterCompressor && this.masterCompressor[parameter]) {
                    this.masterCompressor[parameter].value = value;
                }
                break;
            case 'reverb':
                if (parameter === 'reverbMix') {
                    this.reverb.wet.value = value;
                } else if (parameter === 'reverbDecay') {
                    this.reverb.decay = value;
                }
                break;
            case 'delay':
                if (parameter === 'delayMix') {
                    this.delay.wet.value = value;
                } else if (parameter === 'delayTime') {
                    this.delay.delayTime.value = value;
                } else if (parameter === 'delayFeedback') {
                    this.delay.feedback.value = value;
                }
                break;
        }

        // Update UI
        const control = document.getElementById(parameter);
        if (control) {
            control.value = value;
            this.updateEffectDisplay(control, value);
        }
    }

    handleEffectParamChange(data) {
        const { effect, parameter, value } = data;
        
        switch (effect) {
            case 'compressor':
                if (this.masterCompressor && this.masterCompressor[parameter]) {
                    this.masterCompressor[parameter].value = value;
                }
                break;
            case 'reverb':
                if (this.reverb) {
                    if (parameter === 'wet') {
                        this.reverb.wet.value = value;
                    } else {
                        this.reverb[parameter] = value;
                    }
                }
                break;
            case 'delay':
                if (this.delay) {
                    if (parameter === 'wet') {
                        this.delay.wet.value = value;
                    } else if (parameter === 'delayTime') {
                        this.delay.delayTime.value = value;
                    } else {
                        this.delay[parameter].value = value;
                    }
                }
                break;
        }

        // Update UI
        const controlId = this.getEffectControlId(effect, parameter);
        const control = document.getElementById(controlId);
        if (control) {
            control.value = value;
            this.updateEffectDisplay(control, value);
        }
    }

    getEffectControlId(effect, parameter) {
        const effectParamMap = {
            compressor: {
                threshold: 'compThreshold',
                ratio: 'compRatio',
                attack: 'compAttack',
                release: 'compRelease',
                knee: 'compKnee'
            },
            reverb: {
                wet: 'reverbMix',
                decay: 'reverbDecay'
            },
            delay: {
                wet: 'delayMix',
                delayTime: 'delayTime',
                feedback: 'delayFeedback'
            }
        };
        return effectParamMap[effect]?.[parameter];
    }

    handleKnobChange(data) {
        const { trackId, parameter, value } = data;
        const track = this.synths[trackId];
        
        if (track) {
            const [type, param] = parameter.split('-');
            
            if (type === 'outer' || type === 'inner') {
                 const sequencer = type === 'outer' ? track.outerSequencer : track.innerSequencer;
                 sequencer.updateParams(
                    param === 'steps' ? value : sequencer.steps,
                    param === 'pulses' ? value : sequencer.pulses,
                    param === 'rotation' ? value : sequencer.rotation,
                    param === 'probability' ? value : sequencer.probability,
                    param === 'distribution' ? value : sequencer.distribution
                );
            }
            
            track.updateVisualization(this.currentStep);

            // Update UI (scoped lookup: knob ids repeat across tracks)
            const knob = track.controlsContainer
                ? track.controlsContainer.querySelector(`#${parameter}`)
                : null;
            if (knob) {
                knob.value = value;
                
                // Also update the display
                const display = knob.closest('.knob-container').querySelector('.value-display');
                if (display) {
                    display.textContent = value;
                }
                
                // Update knob indicator
                const indicator = knob.closest('.knob-container').querySelector('.knob-indicator');
                if (indicator) {
                    const min = parseInt(knob.min);
                    const max = parseInt(knob.max);
                    const rotation = (value - min) / (max - min) * 270 - 135;
                    indicator.style.transform = `rotate(${rotation}deg)`;
                }
            }
        }
    }
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
    applyDistribution(pattern) {
        const steps = this.steps;
        const pulses = this.pulses;
        const distributionValue = this.distribution;

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

class Track {
    constructor(name, synth, params, grooveboxInstance) {
        this.name = name;
        this.synth = synth;
        this.params = params;
        this.groovebox = grooveboxInstance;

        // Create two euclidean sequencers with character initialized to 50 (center position)
        this.outerSequencer = new EuclideanSequencer(16, 0, 0, 100, 50);
        this.innerSequencer = new EuclideanSequencer(16, 0, 0, 100, 50);

        // Sequencer settings
        this.selectedNotes = new Set();
        this.currentNoteIndex = 0;
        this.octaveOffset = 0;  // -/+ octave range
        this.octaveRange = 1;   // total spread

        // Create SVG visualization
        this.svg = this.createSequencerSVG();

        // Controls container
        this.controlsContainer = null;

        // Per-track lowpass filter, sitting between the synth and this
        // track's mixer Channel. Defaults fully open (18kHz, gentle Q) so
        // it's audibly transparent until touched.
        this.filter = new Tone.Filter({
            type: 'lowpass',
            frequency: 18000,
            Q: 0.7,
            rolloff: -12
        });
        this.minFilterFreq = 80;
        this.maxFilterFreq = 18000;

        // Per-track FX sends. These get connected to this track's mixer
        // Channel OUTPUT (post volume/pan/mute/solo) in
        // Groovebox.setupSynths(), and onward to the shared global
        // reverb/delay. ~0.35 default roughly preserves the old wet balance
        // (the previous code accidentally doubled the send level via a
        // duplicate connection into a shared 0.5-gain send).
        this.reverbSend = new Tone.Gain(0.35);
        this.delaySend = new Tone.Gain(0.35);

        // Groove: per-hit accent (velocity contrast) and gate (note length
        // as a multiple of the 16n grid slot).
        this.accent = 0.4;
        this.gate = 1.0;

        // Chord mode (poly track only -- toggle button in createControls()):
        // off cycles one selected note per trigger (default, existing
        // behavior); on triggers all selected notes as a chord. Harmless
        // default on every other track since nothing reads it there.
        this.chordMode = false;

        // Sample bank (smpl track only): populated by Groovebox.setupSynths()
        // after construction with { samplers: {id: Tone.Sampler}, sampleKit:
        // [{id,label,file}], currentSampleId }. See setSample() below.
        this.samplers = null;
        this.sampleKit = null;
        this.currentSampleId = null;

        // Signal path: synth -> filter. The filter connects onward to this
        // track's mixer Channel once Groovebox.setupSynths() creates it.
        this.synth.connect(this.filter);

        this.innerStep = 0;  // Add separate step counters
        this.outerStep = 0;
    }

    // --- Filter cutoff <-> slider mapping (log-feel: 80Hz-18kHz) ---
    freqToNorm(freq) {
        const clamped = Math.min(this.maxFilterFreq, Math.max(this.minFilterFreq, freq));
        return Math.log(clamped / this.minFilterFreq) / Math.log(this.maxFilterFreq / this.minFilterFreq);
    }

    normToFreq(norm) {
        const clamped = Math.min(1, Math.max(0, norm));
        return this.minFilterFreq * Math.pow(this.maxFilterFreq / this.minFilterFreq, clamped);
    }

    formatFrequency(freq) {
        if (freq >= 1000) {
            return (freq / 1000).toFixed(1) + 'k';
        }
        return Math.round(freq).toString();
    }

    // smpl track only: swap which pre-loaded Tone.Sampler is actually wired
    // into the signal chain (synth -> filter). The other 7 samplers stay
    // instantiated and loaded, just disconnected, so switching is instant
    // and never re-triggers a network fetch.
    setSample(sampleId) {
        if (!this.samplers || !this.samplers[sampleId]) return;
        if (this.synth) {
            this.synth.disconnect();
        }
        this.synth = this.samplers[sampleId];
        this.synth.connect(this.filter);
        this.currentSampleId = sampleId;
    }

    // Is `step` (Groovebox's raw incrementing step counter) the logical
    // first step -- the euclidean downbeat -- of whichever pattern (outer
    // or inner) is currently active? Mirrors the active-pattern/step-index
    // math in getStepValue()/updateVisualization().
    isDownbeat(step) {
        const pattern1Length = this.outerSequencer.steps;
        const pattern2Length = this.innerSequencer.steps;
        const totalPatternLength = (pattern1Length + pattern2Length) > 0
            ? (pattern1Length + pattern2Length) : 1;
        const cyclePosition = step % totalPatternLength;
        const activePattern = (pattern1Length > 0 && cyclePosition < pattern1Length) ? 0 : 1;

        const sequencer = activePattern === 0 ? this.outerSequencer : this.innerSequencer;
        const stepIndex = activePattern === 0 ? cyclePosition : cyclePosition - pattern1Length;

        if (!sequencer || sequencer.steps <= 0) return false;
        const rotatedStep = (stepIndex - sequencer.rotation + sequencer.steps) % sequencer.steps;
        return rotatedStep === 0;
    }

    createSequencerSVG() {
        const sequencerContainer = document.createElement('div');
        sequencerContainer.className = 'circular-sequencer';

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "-100 -100 200 200");
        svg.setAttribute("width", "200");
        svg.setAttribute("height", "200");

        // Create outer ring
        this.outerRing = this.createRing(80, this.outerSequencer.steps);
        this.outerRing.classList.add('outer-ring');

        // Create inner ring
        this.innerRing = this.createRing(50, this.innerSequencer.steps);
        this.innerRing.classList.add('inner-ring');

        svg.appendChild(this.outerRing);
        svg.appendChild(this.innerRing);
        sequencerContainer.appendChild(svg);

        return sequencerContainer;
    }

    createRing(radius, steps) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const stepSize = (2 * Math.PI) / steps;

        for (let i = 0; i < steps; i++) {
            const angle = i * stepSize;
            const x = radius * Math.cos(angle - Math.PI / 2);
            const y = radius * Math.sin(angle - Math.PI / 2);

            // Create LED circle
            const led = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            led.setAttribute("cx", x);
            led.setAttribute("cy", y);
            led.setAttribute("r", "5");
            led.setAttribute("class", "sequencer-led");
            led.dataset.step = i;

            group.appendChild(led);
        }

        return group;
    }

    updateVisualization(currentStep) {
        // Calculate the total length of both patterns and cycle position
        const pattern1Length = this.outerSequencer.steps;
        const pattern2Length = this.innerSequencer.steps;
        // Prevent division by zero if both lengths are 0
        const totalPatternLength = (pattern1Length + pattern2Length) > 0 ? (pattern1Length + pattern2Length) : 1;
        const cyclePosition = currentStep % totalPatternLength;
        const activePattern = (pattern1Length > 0 && cyclePosition < pattern1Length) ? 0 : 1; // Default to inner if outer has 0 steps

        let currentOuterStep = -1; // Default to inactive
        let currentInnerStep = -1; // Default to inactive

        // Determine the current step for the *active* pattern
        if (activePattern === 0 && pattern1Length > 0) {
            currentOuterStep = cyclePosition;
        } else if (activePattern === 1 && pattern2Length > 0) {
            // Ensure inner step calculation is correct even if pattern1Length is 0
            currentInnerStep = cyclePosition - pattern1Length;
        }

        // Store the calculated steps (optional, might not be needed elsewhere)
        this.outerStep = currentOuterStep;
        this.innerStep = currentInnerStep;

        // Update LED displays, passing -1 for the inactive ring's current step
        this.updateRingLEDs(this.outerRing, this.outerSequencer, currentOuterStep);
        this.updateRingLEDs(this.innerRing, this.innerSequencer, currentInnerStep);

        // Update pattern indicator consistently here
        this.updateActivePatternIndicator(activePattern);
    }

    updateRingLEDs(ring, sequencer, currentStep) {
        if (!ring || !sequencer) return;

        const leds = ring.getElementsByClassName('sequencer-led');
        const stepsInSequencer = sequencer.steps;
        const pattern = sequencer.pattern; // The UNROTATED pattern array
        const rotation = sequencer.rotation ?? 0;

        if (stepsInSequencer <= 0 || !pattern) { // Added check for pattern existence
            for (let i = 0; i < leds.length; i++) {
                leds[i].style.display = 'none';
                leds[i].classList.remove('active', 'playing', 'first-step');
            }
            return;
        }

        for (let i = 0; i < leds.length; i++) {
            const led = leds[i];
            const visualPosition = i; // The index of the LED in the visual ring

            if (visualPosition < stepsInSequencer) {
                // --- FIX: Calculate the LOGICAL step index corresponding to this VISUAL position ---
                // This mirrors the logic in getStep: (step - rotation + steps) % steps
                const logicalStepIndex = (visualPosition - rotation + stepsInSequencer) % stepsInSequencer;

                // Check the UNROTATED pattern array at the calculated LOGICAL step index
                const isActive = pattern[logicalStepIndex];
                // --- End Fix ---

                // Check if this VISUAL position is the currently playing step
                // 'currentStep' passed to this function is already the correct visual position
                const isCurrent = visualPosition === currentStep;

                // Check if this VISUAL position represents the logical first step (step 0 of the unrotated pattern)
                // The logical step 0 appears at the visual position 'rotation'
                const isFirstStep = visualPosition === (rotation % stepsInSequencer);

                led.classList.toggle('active', isActive); // Green fill based on logical pattern value
                led.classList.toggle('playing', isCurrent); // White stroke based on visual playing position
                led.classList.toggle('first-step', isFirstStep); // Yellow stroke based on visual position of logical step 0
                led.style.display = ''; // Ensure LED is visible
            } else {
                // Hide LEDs beyond the current number of steps
                led.classList.remove('active', 'playing', 'first-step');
                led.style.display = 'none';
            }
        }
    }

    // Helper method to calculate Least Common Multiple
    calculateLCM(a, b) {
        // Helper function to find GCD
        const gcd = (x, y) => !y ? x : gcd(y, x % y);
        return (a * b) / gcd(a, b);
    }

    // Add visual indication of which pattern is currently active
    updateActivePatternIndicator(activePattern) {
        if (!this.svg) return;
        
        // Get the rings from the SVG
        const outerRing = this.svg.querySelector('.outer-ring');
        const innerRing = this.svg.querySelector('.inner-ring');
        
        if (outerRing && innerRing) {
            // Add/remove active-pattern class based on which pattern is active
            outerRing.classList.toggle('active-pattern', activePattern === 0);
            innerRing.classList.toggle('active-pattern', activePattern === 1);
        }
    }

    // Get the combined pattern value for the current step
    getStepValue(step) {
        // If no pulses in either sequencer, return false
        if (this.outerSequencer.pulses === 0 && this.innerSequencer.pulses === 0) return false;

        // Calculate the total length of both patterns
        const pattern1Length = this.outerSequencer.steps;
        const pattern2Length = this.innerSequencer.steps;
        // Prevent division by zero
        const totalPatternLength = (pattern1Length + pattern2Length) > 0 ? (pattern1Length + pattern2Length) : 1;

        // Determine which pattern is active based on the current step within the total cycle
        const cyclePosition = step % totalPatternLength;
        // Default to inner if outer has 0 steps or cyclePosition is past outer length
        const activePattern = (pattern1Length > 0 && cyclePosition < pattern1Length) ? 0 : 1;

        // Determine the step value from the active sequencer
        if (activePattern === 0 && pattern1Length > 0) {
            const stepIndex = cyclePosition;
            return this.outerSequencer.getStep(stepIndex); // Probability IS handled here
        } else if (activePattern === 1 && pattern2Length > 0) {
            const stepIndex = cyclePosition - pattern1Length;
            return this.innerSequencer.getStep(stepIndex); // Probability IS handled here
        } else {
             return false;
        }
    }

    getNotesToPlay(currentScale, rootNote) {
        if (this.synth instanceof Tone.NoiseSynth) {
            return ['C4'];
        }

        const scale = this.groovebox.scales[currentScale];
        const baseNote = rootNote.replace(/[0-9]/, '');
        const baseMidi = Tone.Frequency(baseNote + '0').toMidi();
        
        const notes = Array.from(this.selectedNotes).map(index => {
            const octave = Math.floor(index / scale.length) % 9; // Limit to octaves 0-8
            const scalePosition = index % scale.length;
            const noteMidi = baseMidi + scale[scalePosition] + (octave * 12);
            return Tone.Frequency(noteMidi, 'midi').toNote();
        });

        if (notes.length === 0) return [];

        // Chord mode (poly track only -- see the "chord" toggle in
        // createControls()): trigger every selected note together instead of
        // cycling one per hit. Capped at 8 to match PolySynth's maxPolyphony.
        if (this.chordMode) {
            return notes.slice(0, 8);
        }

        this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
        return [notes[this.currentNoteIndex]];
    }

    createControls() {
        const container = document.createElement('div');
        container.className = 'track-controls';

        const sequencerContainer = document.createElement('div');
        sequencerContainer.className = 'sequencer-controls';

        // Add first section of sequencer controls
        sequencerContainer.appendChild(this.createSequencerControls('outer'));

        // Add second section of sequencer controls
        sequencerContainer.appendChild(this.createSequencerControls('inner'));

        // Add note selection grid
        sequencerContainer.appendChild(this.createNoteSelection());

        container.appendChild(sequencerContainer);

        // Add synth controls
        const synthContainer = document.createElement('div');
        synthContainer.className = 'synth-controls';
        Object.entries(this.params).forEach(([param, config]) => {
            const paramControl = document.createElement('div');
            paramControl.className = 'param-control';

            const label = document.createElement('label');
            label.textContent = config.label || param;
            paramControl.appendChild(label);

            const input = document.createElement('input');
            input.type = 'range';
            input.min = config.min;
            input.max = config.max;
            input.step = config.step;
            input.value = config.default;
            input.dataset.param = param;
            input.dataset.synth = this.name;
            paramControl.appendChild(input);

            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'value-display';
            valueDisplay.textContent = config.default;
            paramControl.appendChild(valueDisplay);

            synthContainer.appendChild(paramControl);
        });

        // smpl: which one-shot this track's Sampler plays. Grid notes still
        // repitch the sample up/down the scale (playbackRate trick built
        // into Tone.Sampler) -- melodic percussion.
        if (this.name === 'smpl' && this.sampleKit) {
            synthContainer.appendChild(this.createSelectControl({
                label: 'sample',
                parameter: 'sample',
                extraClass: 'sample-select',
                options: this.sampleKit.map(s => ({ value: s.id, label: s.label })),
                value: this.currentSampleId || 'kick',
                onInput: (value) => this.setSample(value)
            }));
        }

        // poly: waveform + fat-oscillator spread, and a chord-mode toggle.
        // PolySynth has no direct .oscillator property (only its dummy/voice
        // instances do) -- Tone's supported way to change it for every
        // voice (current + future) is PolySynth.set(), not direct property
        // assignment, hence the custom onInput here rather than routing
        // through the generic this.params loop above.
        if (this.name === 'poly') {
            synthContainer.appendChild(this.createSelectControl({
                label: 'wave',
                parameter: 'oscillator.type',
                extraClass: 'wave-select',
                options: [
                    { value: 'fatsawtooth', label: 'fatsawtooth' },
                    { value: 'fatsquare', label: 'fatsquare' },
                    { value: 'fattriangle', label: 'fattriangle' },
                    { value: 'sine', label: 'sine' }
                ],
                value: this.synth.options?.oscillator?.type || 'fatsawtooth',
                onInput: (value) => this.synth.set({ oscillator: { type: value } })
            }));

            const spreadControl = this.createParamControl({
                label: 'spread',
                min: 0, max: 60, step: 1,
                value: this.synth.options?.oscillator?.spread ?? 24,
                parameter: 'oscillator.spread',
                onInput: (value) => { this.synth.set({ oscillator: { spread: value } }); }
            });
            spreadControl.classList.add('osc-spread-control');
            synthContainer.appendChild(spreadControl);

            const chordToggle = document.createElement('button');
            chordToggle.type = 'button';
            chordToggle.className = 'toggle-btn chord-toggle';
            chordToggle.textContent = 'chord';
            chordToggle.title = 'trigger all selected notes together instead of cycling';
            chordToggle.classList.toggle('active', this.chordMode);
            chordToggle.addEventListener('click', () => {
                this.chordMode = !this.chordMode;
                chordToggle.classList.toggle('active', this.chordMode);
                if (this.groovebox && this.groovebox.broadcastStateChange) {
                    this.groovebox.broadcastStateChange('SYNTH_PARAM_CHANGE', {
                        trackId: this.name,
                        parameter: 'chord',
                        value: this.chordMode
                    });
                }
            });
            synthContainer.appendChild(chordToggle);
        }

        // noise: white/pink/brown changes Tone.Noise's spectrum.
        if (this.name === 'noise') {
            synthContainer.appendChild(this.createSelectControl({
                label: 'color',
                parameter: 'noise.type',
                extraClass: 'noise-color-select',
                options: [
                    { value: 'white', label: 'white' },
                    { value: 'pink', label: 'pink' },
                    { value: 'brown', label: 'brown' }
                ],
                value: this.synth.noise?.type || 'white',
                onInput: (value) => { if (this.synth.noise) this.synth.noise.type = value; }
            }));
        }

        container.appendChild(synthContainer);

        // Groove: per-hit accent (velocity) and gate (note length), the
        // per-hit feel controls -- not mixing, so they stay on the track
        // panel next to the euclidean knobs. Reverb/delay send levels used
        // to live in this section too; they've moved onto this track's
        // mixer channel strip (see Groovebox.createMixerChannel()) since
        // they're a mix decision, not a groove one.
        const grooveContainer = document.createElement('div');
        grooveContainer.className = 'groove-controls';
        grooveContainer.appendChild(this.createParamControl({
            label: 'accent',
            min: 0, max: 1, step: 0.01,
            value: this.accent,
            parameter: 'accent',
            onInput: (value) => { this.accent = value; }
        }));
        grooveContainer.appendChild(this.createParamControl({
            label: 'gate',
            min: 0.1, max: 2, step: 0.01,
            value: this.gate,
            parameter: 'gate',
            onInput: (value) => { this.gate = value; }
        }));
        container.appendChild(grooveContainer);

        // Filter: per-track lowpass between the synth and its mixer channel.
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-controls';
        filterContainer.appendChild(this.createParamControl({
            label: 'cutoff',
            min: 0, max: 1, step: 0.001,
            value: this.freqToNorm(this.filter.frequency.value),
            initialApplied: this.filter.frequency.value,
            parameter: 'filter.frequency',
            format: (freq) => this.formatFrequency(freq),
            onInput: (raw) => {
                const freq = this.normToFreq(raw);
                this.filter.frequency.value = freq;
                return freq;
            }
        }));
        filterContainer.appendChild(this.createParamControl({
            label: 'resonance',
            min: 0.1, max: 12, step: 0.1,
            value: this.filter.Q.value,
            parameter: 'filter.Q',
            format: (v) => v.toFixed(1),
            onInput: (value) => { this.filter.Q.value = value; }
        }));
        container.appendChild(filterContainer);

        this.controlsContainer = container;
        return container;
    }

    // Builds one .param-control row (reusing the same markup/CSS as the
    // per-synth params) for a track-level control (sends, filter, accent,
    // gate). Unlike the per-synth params, these manage their own listener
    // rather than going through Groovebox.setupSynthParameterListeners() --
    // marked with data-track-control so that generic delegated handler
    // skips them (see setupSynthParameterListeners) -- because some of them
    // (filter cutoff) need a non-linear raw-slider-value -> applied-value
    // mapping and a custom display formatter that the generic handler
    // doesn't support.
    //
    // `onInput(rawValue)` should apply the change and may return the actual
    // applied value if it differs from the raw slider value (e.g. Hz for
    // the log-mapped cutoff slider); if it returns undefined, the raw value
    // is assumed to be the applied value. `initialApplied` is that same
    // "applied" value at construction time, for seeding the display when it
    // differs from the raw slider `value` (again, the log-mapped cutoff);
    // it defaults to `value` for the common case where raw === applied.
    createParamControl({ label, min, max, step, value, parameter, format, onInput, initialApplied }) {
        const paramControl = document.createElement('div');
        paramControl.className = 'param-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        paramControl.appendChild(labelEl);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.dataset.synth = this.name;
        input.dataset.param = parameter;
        input.dataset.trackControl = 'true';
        paramControl.appendChild(input);

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';
        const displaySeed = initialApplied === undefined ? value : initialApplied;
        valueDisplay.textContent = format ? format(displaySeed) : Number(displaySeed).toFixed(2);
        paramControl.appendChild(valueDisplay);

        input.addEventListener('input', (e) => {
            const raw = parseFloat(e.target.value);
            const applied = onInput(raw);
            const appliedValue = applied === undefined ? raw : applied;
            valueDisplay.textContent = format ? format(appliedValue, raw) : appliedValue.toFixed(2);

            if (this.groovebox && this.groovebox.broadcastStateChange) {
                this.groovebox.broadcastStateChange('SYNTH_PARAM_CHANGE', {
                    trackId: this.name,
                    parameter: parameter,
                    value: appliedValue
                });
            }
        });

        return paramControl;
    }

    // Select-control support: a dropdown counterpart to createParamControl()
    // above, for track params whose value is a string rather than a number
    // (sample choice, oscillator waveform, noise color). Same
    // .param-control row shape and the same data-track-control marker (so
    // Groovebox.setupSynthParameterListeners' generic range-input delegate
    // skips it -- moot here anyway since that selector only matches
    // input[type="range"]), and it broadcasts SYNTH_PARAM_CHANGE the same
    // way, just with a string `value`. `extraClass` names the <select> for
    // both help-system targeting (see Groovebox.helpContent) and the shared
    // #scaleSelect/.logic-operator select styling in styles.css.
    createSelectControl({ label, parameter, options, value, onInput, extraClass }) {
        const paramControl = document.createElement('div');
        paramControl.className = 'param-control param-select';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        paramControl.appendChild(labelEl);

        const select = document.createElement('select');
        select.className = extraClass ? `track-select ${extraClass}` : 'track-select';
        select.dataset.synth = this.name;
        select.dataset.param = parameter;
        select.dataset.trackControl = 'true';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === value) option.selected = true;
            select.appendChild(option);
        });
        paramControl.appendChild(select);

        select.addEventListener('change', (e) => {
            const val = e.target.value;
            if (onInput) onInput(val);

            if (this.groovebox && this.groovebox.broadcastStateChange) {
                this.groovebox.broadcastStateChange('SYNTH_PARAM_CHANGE', {
                    trackId: this.name,
                    parameter: parameter,
                    value: val
                });
            }
        });

        return paramControl;
    }

    createSequencerControls(type) {
        const container = document.createElement('div');
        container.className = `${type}-controls sequencer-control-group`;

        // Create knob controls
        const knobs = document.createElement('div');
        knobs.className = 'knob-controls';

        // Steps knob
        const stepsKnob = this.createKnob({
            id: `${type}-steps`,
            label: 'Steps',
            min: 1,
            max: 16,
            value: type === 'outer' ? this.outerSequencer.steps : this.innerSequencer.steps,
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                const oldRotation = sequencer.rotation; // Get rotation before update

                // Update sequencer params - this now clamps rotation internally
                const rotationWasClamped = sequencer.updateParams(
                    value, // new steps
                    sequencer.pulses,
                    sequencer.rotation, // pass current rotation
                    sequencer.probability,
                    sequencer.distribution
                );

                // Update the max attribute of the corresponding rotation knob.
                // NOTE: knob ids repeat across tracks, so scope the lookup to
                // this track's control group instead of document.getElementById.
                const rotKnobInput = container.querySelector(`#${type}-rotation`);
                if (rotKnobInput) {
                    rotKnobInput.max = Math.max(0, value - 1); // Max rotation is steps - 1
                }

                // If rotation was clamped by the steps change, update its UI
                if (rotationWasClamped) {
                    const newRotation = sequencer.rotation; // Get the newly clamped rotation
                    const rotKnobContainer = rotKnobInput?.closest('.knob-container');
                    if (rotKnobContainer) {
                        const rotDisplay = rotKnobContainer.querySelector('.value-display');
                        const rotIndicator = rotKnobContainer.querySelector('.knob-indicator');
                        const rotMin = parseInt(rotKnobInput.min);
                        const rotMax = parseInt(rotKnobInput.max); // Use the UPDATED max

                        rotKnobInput.value = newRotation;
                        if (rotDisplay) rotDisplay.textContent = newRotation;
                        if (rotIndicator) {
                             const rotationDegrees = ((newRotation - rotMin) / (rotMax - rotMin)) * 270 - 135;
                             rotIndicator.style.transform = `rotate(${rotationDegrees}deg)`;
                        }

                        // Broadcast the clamped rotation value change
                        if (this.groovebox && this.groovebox.broadcastStateChange) {
                             console.log(`Broadcasting CLAMPED KNOB_CHANGE for ${type}-rotation with value ${newRotation}`);
                             this.groovebox.broadcastStateChange('KNOB_CHANGE', {
                                 trackId: this.name,
                                 parameter: `${type}-rotation`, // Send the rotation param ID
                                 value: newRotation
                             });
                        }
                    }
                }

                this.updateVisualization(this.groovebox.currentStep); // Update visualization after changes
            }
        });

        // Pulses knob
        const pulsesKnob = this.createKnob({
            id: `${type}-pulses`,
            label: 'Pulses',
            min: 0,
            max: 16, // Max pulses can remain 16, but updateParams will clamp it to steps
            value: type === 'outer' ? this.outerSequencer.pulses : this.innerSequencer.pulses,
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                 // Update pulses - updateParams will clamp it based on current steps
                sequencer.updateParams(
                    sequencer.steps,
                    value, // new pulses
                    sequencer.rotation,
                    sequencer.probability,
                    sequencer.distribution
                );
                // Update the pulses knob UI in case it was clamped
                // (scoped lookup: knob ids repeat across tracks)
                const pulsesKnobInput = container.querySelector(`#${type}-pulses`);
                const pulsesKnobContainer = pulsesKnobInput?.closest('.knob-container');
                if (pulsesKnobContainer && sequencer.pulses !== value) { // Check if value was clamped
                    const pulsesDisplay = pulsesKnobContainer.querySelector('.value-display');
                    pulsesKnobInput.value = sequencer.pulses;
                    if (pulsesDisplay) pulsesDisplay.textContent = sequencer.pulses;
                    // Update indicator if needed (though less critical for pulses)
                    const pulsesIndicator = pulsesKnobContainer.querySelector('.knob-indicator');
                     if (pulsesIndicator) {
                         const pMin = parseInt(pulsesKnobInput.min);
                         const pMax = parseInt(pulsesKnobInput.max);
                         const pRotationDegrees = ((sequencer.pulses - pMin) / (pMax - pMin)) * 270 - 135;
                         pulsesIndicator.style.transform = `rotate(${pRotationDegrees}deg)`;
                     }
                     // Broadcast clamped pulses value if necessary
                     if (this.groovebox && this.groovebox.broadcastStateChange) {
                         this.groovebox.broadcastStateChange('KNOB_CHANGE', {
                             trackId: this.name,
                             parameter: `${type}-pulses`,
                             value: sequencer.pulses
                         });
                     }
                }
                this.updateVisualization(this.groovebox.currentStep);
            }
        });

        // Rotation knob
        const rotationKnob = this.createKnob({
            id: `${type}-rotation`,
            label: 'Rotation',
            min: 0,
            // Set initial max based on current steps
            max: Math.max(0, (type === 'outer' ? this.outerSequencer.steps : this.innerSequencer.steps) - 1),
            value: type === 'outer' ? this.outerSequencer.rotation : this.innerSequencer.rotation,
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                // updateParams will clamp rotation based on current steps
                sequencer.updateParams(
                    sequencer.steps,
                    sequencer.pulses,
                    value, // new rotation
                    sequencer.probability,
                    sequencer.distribution
                );
                // No need to manually update UI here, createKnob's drag logic handles it
                // and broadcasts the change. updateParams ensures the internal value is correct.
                this.updateVisualization(this.groovebox.currentStep);
            }
        });

        // Distribution knob (formerly Character)
        const distributionKnob = this.createKnob({
            id: `${type}-distribution`, // Changed ID
            label: 'Distribution',      // Changed Label
            min: 0,
            max: 100,
            value: type === 'outer' ? this.outerSequencer.distribution : this.innerSequencer.distribution, // Use distribution
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(
                    sequencer.steps,
                    sequencer.pulses,
                    sequencer.rotation,
                    sequencer.probability,
                    value // Pass the new distribution value
                );
                this.updateVisualization(this.groovebox.currentStep); // Update viz
            }
        });

        // Probability knob
        const probabilityKnob = this.createKnob({
            id: `${type}-probability`,
            label: 'Prob %',
            min: 0,
            max: 100,
            value: type === 'outer' ? this.outerSequencer.probability : this.innerSequencer.probability,
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(
                    sequencer.steps,
                    sequencer.pulses,
                    sequencer.rotation,
                    value, // Pass the new probability value
                    sequencer.distribution // Pass existing distribution
                );
                 this.updateVisualization(this.groovebox.currentStep); // Update viz
            }
        });

        // Add all knobs
        knobs.appendChild(stepsKnob);
        knobs.appendChild(pulsesKnob);
        knobs.appendChild(rotationKnob);
        knobs.appendChild(distributionKnob); // Add the distribution knob
        knobs.appendChild(probabilityKnob);
        
        container.appendChild(knobs);

        return container;
    }

    createKnob({ id, label, min, max, value, onChange }) {
        const container = document.createElement('div');
        container.className = 'knob-container';

        // Keep the same HTML structure
        const knobHtml = `
            <div class="knob">
                <div class="knob-outer">
                    <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" class="knob-input" style="display: none;"> <!-- Hide the actual range input -->
                    <div class="knob-indicator"></div>
                    <div class="knob-surface"></div> <!-- We interact with this surface -->
                </div>
            </div>
            <div class="knob-label">${label}</div>
            <div class="value-display">${value}</div>
        `;
        container.innerHTML = knobHtml;

        const input = container.querySelector('.knob-input');
        const indicator = container.querySelector('.knob-indicator');
        const surface = container.querySelector('.knob-surface'); // Get the surface element
        const display = container.querySelector('.value-display'); // Get the display element

        // Initial rotation
        const initialRotation = ((value - min) / (max - min)) * 270 - 135;
        indicator.style.transform = `rotate(${initialRotation}deg)`;
        console.log(`Knob ${id} created with initial value ${value}`);

        // --- Start: Custom Drag Logic from groovebox.js ---
        let isDragging = false;
        let startY = 0;
        let startValue = 0;

        const startDrag = (e) => {
            e.preventDefault(); // Prevent text selection/default drag behavior
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            startValue = parseInt(input.value);
            surface.style.cursor = 'grabbing'; // Change cursor during drag
            console.log(`Knob ${id} drag started. StartY: ${startY}, StartValue: ${startValue}`);

            // Add listeners to the document to capture movement anywhere on the page
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false }); // passive: false to allow preventDefault
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling on touch devices

            const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const diff = startY - currentY; // Vertical difference

            // Adjust sensitivity (lower number = more sensitive)
            const sensitivity = 2;
            let newValue = startValue + Math.round(diff / sensitivity);

            // Clamp value between min and max
            newValue = Math.max(min, Math.min(max, newValue));
            console.log(`Knob ${id} dragging. CurrentY: ${currentY}, Diff: ${diff}, NewValue: ${newValue}`);


            // Only update if the value actually changed
            if (newValue !== parseInt(input.value)) {
                // Update hidden input, display text, and indicator rotation
                input.value = newValue;
                display.textContent = newValue;

                const rotation = ((newValue - min) / (max - min)) * 270 - 135;
                indicator.style.transform = `rotate(${rotation}deg)`;
                console.log(`Knob ${id} updated. Rotation: ${rotation.toFixed(2)}deg`);


                // Trigger onChange callback
                if (onChange) {
                    try {
                        onChange(newValue);
                        console.log(`Knob ${id} onChange callback executed.`);
                    } catch (error) {
                        console.error(`Error in onChange callback for ${id}:`, error);
                    }
                }

                // Broadcast the change via WebSocket
                if (this.groovebox && this.groovebox.broadcastStateChange) {
                     console.log(`Broadcasting KNOB_CHANGE for ${id} with value ${newValue}`);
                     this.groovebox.broadcastStateChange('KNOB_CHANGE', {
                         trackId: this.name,
                         parameter: id,
                         value: newValue
                     });
                }
            }
        };

        const stopDrag = () => {
            if (!isDragging) return; // Prevent multiple triggers
            isDragging = false;
            surface.style.cursor = 'grab'; // Restore cursor
            console.log(`Knob ${id} drag stopped.`);

            // Remove document listeners
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        // Add event listeners to the surface
        surface.addEventListener('mousedown', startDrag);
        surface.addEventListener('touchstart', startDrag, { passive: false }); // passive: false to allow preventDefault

        // Double click to reset to default value (using the initial 'value' passed in)
        surface.addEventListener('dblclick', () => {
            const defaultValue = parseFloat(input.getAttribute('value')); // Or use the initial 'value' if stored
            console.log(`Knob ${id} double-clicked. Resetting to default: ${defaultValue}`);
            input.value = defaultValue;
            display.textContent = defaultValue;
            const rotation = ((defaultValue - min) / (max - min)) * 270 - 135;
            indicator.style.transform = `rotate(${rotation}deg)`;

            if (onChange) {
                 try {
                     onChange(defaultValue);
                     console.log(`Knob ${id} onChange callback executed on reset.`);
                 } catch (error) {
                     console.error(`Error in onChange callback for ${id} during reset:`, error);
                 }
            }
             // Broadcast the reset change
             if (this.groovebox && this.groovebox.broadcastStateChange) {
                 console.log(`Broadcasting KNOB_CHANGE for ${id} reset with value ${defaultValue}`);
                 this.groovebox.broadcastStateChange('KNOB_CHANGE', {
                     trackId: this.name,
                     parameter: id,
                     value: defaultValue
                 });
             }
        });
        // --- End: Custom Drag Logic ---

        // REMOVE the old 'input' event listener
        // input.addEventListener('input', (e) => { ... });
        // REMOVE the old focus/blur listeners
        // input.addEventListener('focus', (e) => ...);
        // input.addEventListener('blur', (e) => ...);

        return container;
    }

    createNoteSelection() {
        const container = document.createElement('div');
        container.className = 'note-selection';

        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                const button = document.createElement('button');
                const noteIndex = row * 8 + col;
                button.className = 'note-button';
                button.dataset.noteIndex = noteIndex;

                if (this.selectedNotes.has(noteIndex)) {
                    button.classList.add('selected');
                }

                button.addEventListener('click', () => {
                    const isSelected = this.selectedNotes.has(noteIndex);
                    
                    // Update local state
                    if (isSelected) {
                        this.selectedNotes.delete(noteIndex);
                        button.classList.remove('selected');
                    } else {
                        this.selectedNotes.add(noteIndex);
                        button.classList.add('selected');
                    }

                    // Send WebSocket message
                    if (this.groovebox && this.groovebox.ws && this.groovebox.ws.readyState === WebSocket.OPEN) {
                        console.log('Sending note selection change:', {
                            type: 'NOTE_SELECTION_CHANGE',
                            trackId: this.name, // Corrected trackId
                            noteIndex: noteIndex,
                            selected: !isSelected
                        });
                        
                        this.groovebox.ws.send(JSON.stringify({
                            type: 'NOTE_SELECTION_CHANGE',
                            trackId: this.name, // Corrected trackId
                            noteIndex: noteIndex,
                            selected: !isSelected
                        }));
                    }
                });

                this.updateNoteButtonLabel(button, noteIndex);
                container.appendChild(button);
            }
        }

        return container;
    }

    updateNoteButtonLabel(button, noteIndex) {
        const scale = this.groovebox.scales[this.groovebox.currentScale];
        const rootNote = document.getElementById('rootNote')?.value || 'C';
        
        // Calculate octave (0-8) and scale position
        const octave = Math.floor(noteIndex / scale.length) % 9; // Limit to octaves 0-8
        const scalePosition = noteIndex % scale.length;
        
        // Get the note name without octave
        const baseNote = rootNote.replace(/[0-9]/, '');
        const interval = scale[scalePosition];
        const baseMidi = Tone.Frequency(baseNote + '0').toMidi();
        const noteMidi = baseMidi + interval + (octave * 12);
        const noteName = Tone.Frequency(noteMidi, 'midi').toNote();
        
        // Display note name with octave
        button.textContent = noteName;
        button.dataset.note = noteName;
    }

    updateNoteSelection() {
        if (this.controlsContainer) {
            const oldNoteSelection = this.controlsContainer.querySelector('.note-selection');
            if (oldNoteSelection) {
                const newNoteSelection = this.createNoteSelection();
                this.controlsContainer.replaceChild(newNoteSelection, oldNoteSelection);
            }
        }
    }

    createLogicControls() {
        const container = document.createElement('div');
        container.className = 'pattern-sequence-controls';
        
        // Create a label for sequential pattern mode
        const label = document.createElement('div');
        label.className = 'sequence-label';
        label.textContent = 'Sequential Patterns';
        
        // Add pattern cycle indicator
        const cycleInfo = document.createElement('div');
        cycleInfo.className = 'cycle-info';
        cycleInfo.textContent = 'Pattern A plays completely, then Pattern B';
        
        container.appendChild(label);
        container.appendChild(cycleInfo);
        return container;
    }
}

// Initialize the groovebox when the page loads
let groovebox;
document.addEventListener('DOMContentLoaded', () => {
    groovebox = new Groovebox();
});


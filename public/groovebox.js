class Groovebox {
    constructor() {
        this.isPlaying = false;
        this.steps = 16;
        this.currentScale = 'major';
        this.currentStep = 0;
        this.rows = 12; // One octave of notes
        this.lastStepTime = 0;

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

        // Initialize WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.hostname}:${window.location.port}`);
        this.initializeWebSocketHandlers();

        this.currentTrack = 'pluck'; // or whatever default track you want
        this.selectedNotes = new Set();

        // Add help system initialization
        this.helpMode = false;
        this.tooltip = this.createHelpTooltip();
        this.helpContent = {
            // Transport controls
            'playButton': 'Start or stop playback of all sequencers',
            'bpmControl': 'Set the tempo in beats per minute (60-200 BPM). Higher values = faster playback',
            
            // Sequencer visualization
            'circular-sequencer': 'Visual pattern display: Outer ring shows first pattern, inner ring shows second pattern. Lit steps will trigger notes',
            
            // Sequencer controls - use more specific selector
            'knob-controls': `Euclidean Rhythm Controls:
                - Steps: Set sequence length (1-16)
                - Pulses: Set number of active beats (0-16)
                - Rotation: Shift pattern left/right (0-31)
                - Probability: Chance of triggers (0-100%)
                
                Outer ring controls the first pattern
                Inner ring controls the second pattern`,
            
            // Logic and Note Selection
            'logic-operator': 'How the two patterns combine:\nAND = both must trigger\nOR = either can trigger\nXOR = only one can trigger',
            
            // Mixer controls
            'fader-container[data-channel="master"]': 'Master Volume Control - Adjusts the overall volume of all tracks',
            'fader-container:not([data-channel="master"])': 'Track volume control. Drag up/down to adjust how loud this track plays',
            'pan-container': 'Stereo position control. Left = sound comes from left speaker, Right = sound comes from right speaker',
            'mixer-channel button.mute': 'Mute button (M) - Click to silence this track',
            'mixer-channel button.solo': 'Solo button (S) - Click to hear only this track',
            
            // Effects controls
            'reverbMix': 'Reverb Mix - Amount of reverb effect. Higher values create more space and atmosphere',
            'reverbDecay': 'Reverb Decay - How long the reverb tail lasts. Higher values create longer echoes',
            'delayMix': 'Delay Mix - Amount of delay/echo effect. Higher values create more pronounced echoes',
            'delayTime': 'Delay Time - Time between echo repeats. Higher values create longer gaps between echoes',
            'delayFeedback': 'Delay Feedback - Number of echo repeats. Higher values create more repeats',
            
            // Synth controls
            'synth-controls': 'Sound shaping controls specific to this instrument. Adjust to change the character of the sound',
            
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
                        this.updateTrackControl(data.trackId, data.parameter, data.value);
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

        // Create effect sends
        this.reverbSend = new Tone.Gain(0.5);
        this.delaySend = new Tone.Gain(0.5);

        // Connect effects
        this.reverbSend.connect(this.reverb);
        this.delaySend.connect(this.delay);
        this.reverb.connect(this.mixer);
        this.delay.connect(this.mixer);
    }

    setupSynths() {
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
            poly: new Track('poly', new Tone.PolySynth(Tone.Synth, {
                maxPolyphony: 4,
                oscillator: {
                    type: 'sine'
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
            }, this)
        };

        // Create controls for each track after initialization
        Object.values(this.synths).forEach(track => {
            track.controlsContainer = track.createControls();
        });

        // Initialize mixer channels
        this.mixerChannels = {};
        
        // Set up mixer channels and connect synths
        Object.entries(this.synths).forEach(([name, track]) => {
            // Create mixer channel
            const channel = new Tone.Channel({
                volume: -20,
                pan: 0,
                mute: false,
                solo: false
            }).connect(this.mixer);
            
            this.mixerChannels[name] = channel;
            
            // Disconnect any existing connections and reconnect through the mixer channel
            track.synth.disconnect();
            track.synth.connect(channel);
            track.synth.connect(this.reverbSend);
            track.synth.connect(this.delaySend);
            
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
            } catch (error) {
                console.error('Error starting audio context:', error);
            }
        });

        // Set up BPM control
        bpmControl.addEventListener('input', (e) => {
            Tone.Transport.bpm.value = parseFloat(e.target.value);
        });
    }

    repeat(time) {
        if (!this.isPlaying) return;
        
        // Prevent duplicate triggers
        if (time === this.lastStepTime) return;
        this.lastStepTime = time;
        
        // Get current step
        const step = this.currentStep % this.steps;
        
        // Trigger synths for each track if step is active
        Object.entries(this.synths).forEach(([name, track]) => {
            if (track.getStepValue(step)) {
                track.currentNoteIndex = step;
                this.triggerSynth(name, track, time);
            }
        });

        // Update visualization for each track
        Object.values(this.synths).forEach(track => {
            if (track.updateVisualization) {
                track.updateVisualization(step);
            }
        });

        // Advance to next step
        this.currentStep = (this.currentStep + 1) % this.steps;
    }

    triggerSynth(name, track, time) {
        // Special handling for noise synth which doesn't need note information
        if (track.synth instanceof Tone.NoiseSynth) {
            track.synth.triggerAttackRelease('16n', time);
            return;
        }

        // Normal handling for pitched synths
        const rootNote = document.getElementById('rootNote')?.value || 'C';
        const notes = track.getNotesToPlay(this.currentScale, rootNote);
        if (notes.length > 0) {
            if (track.synth instanceof Tone.PolySynth) {
                track.synth.triggerAttackRelease(notes, '16n', time);
            } else {
                track.synth.triggerAttackRelease(notes[0], '16n', time);
            }
        }
    }

    createUI() {
        // Create transport controls (already exists in HTML)
        this.setupTransportControls();

        // Scale selector is now created in HTML, skip auto-creation
        // this.createScaleSelector();

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

        channel.innerHTML = `
            <h4>${name}</h4>
            <div class="fader-container">
                <div class="vu-meter">
                    <div class="vu-meter-fill"></div>
                </div>
                <input type="range" class="fader" 
                       data-channel="${name}"
                       min="-60" max="0" value="-20"
                       orient="vertical">
            </div>
            ${!isMaster ? `
                <div class="pan-container">
                    <input type="range" class="pan" 
                           data-channel="${name}"
                           min="-1" max="1" step="0.1" value="0">
                </div>
                <button class="mute" data-channel="${name}">M</button>
                <button class="solo" data-channel="${name}">S</button>
            ` : ''}
        `;

        return channel;
    }

    setupEventListeners() {
        Object.values(this.synths).forEach(track => {
            // Logic operator
            const logicSelect = track.controlsContainer.querySelector('.logic-operator');
            logicSelect.addEventListener('change', (e) => {
                track.logicOperator = e.target.value;

                // Use the new broadcast method
                this.broadcastStateChange('LOGIC_CHANGE', {
                    trackId: track.name,
                    operator: track.logicOperator
                });
            });

            // Knobs
            track.controlsContainer.querySelectorAll('.knob-input').forEach(knob => {
                knob.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    const id = e.target.id;
                    const type = id.split('-')[0];
                    const param = id.split('-')[1];

                    if (type === 'outer') {
                        track.outerSequencer.updateParams(
                            param === 'steps' ? value : track.outerSequencer.steps,
                            param === 'pulses' ? value : track.outerSequencer.pulses,
                            param === 'rotation' ? value : track.outerSequencer.rotation,
                            param === 'probability' ? value : track.outerSequencer.probability
                        );
                    } else {
                        track.innerSequencer.updateParams(
                            param === 'steps' ? value : track.innerSequencer.steps,
                            param === 'pulses' ? value : track.innerSequencer.pulses,
                            param === 'rotation' ? value : track.innerSequencer.rotation,
                            param === 'probability' ? value : track.innerSequencer.probability
                        );
                    }

                    track.updateVisualization(this.currentStep);

                    // Use the new broadcast method
                    this.broadcastStateChange('KNOB_CHANGE', {
                        trackId: track.name,
                        parameter: id,
                        value: value
                    });
                });
            });
        });

        // Setup parameter controls
        this.setupSynthParameterListeners();
        this.setupEffectsEventListeners();
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
                if (this.ws) {
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
                if (this.ws) {
                    this.ws.send(JSON.stringify({
                        type: 'MIXER_CHANGE',
                        channelId: channel,
                        parameter: 'pan',
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
                if (this.ws) {
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
        document.querySelectorAll('.param-control input[type="range"]').forEach(control => {
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
                        if (track.synth[category]) {
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

        // Delay controls
        const delayControls = {
            'delayMix': { param: 'wet', signal: true },
            'delayTime': { param: 'delayTime', signal: true },
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
    }

    updateEffectDisplay(element, value) {
        const display = element.parentElement.querySelector('.value-display');
        if (display) {
            display.textContent = value.toFixed(2);
        }
    }

    setupSequencerEventListeners() {
        const knobs = document.querySelectorAll('.knob-container input[type="range"]');
        knobs.forEach(knob => {
            knob.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const id = e.target.id;
                const track = this.synths[this.currentTrack];

                // Update local state
                if (id.startsWith('outer-')) {
                    track.outerSequencer[id.split('-')[1]] = value;
                } else if (id.startsWith('inner-')) {
                    track.innerSequencer[id.split('-')[1]] = value;
                }

                // Broadcast change
                this.broadcastStateChange('KNOB_CHANGE', {
                    trackId: track.name,
                    parameter: id,
                    value: value
                });
            });
        });
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
                        control === 'probability' ? value : sequencer.probability
                    );
                }
            }
        }
        
        // Handle logic operator
        if (param === 'logicOperator') {
            const logicSelect = track.controlsContainer.querySelector('.logic-operator');
            if (logicSelect) {
                logicSelect.value = value;
                track.logicOperator = value;
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

        // Update the synth parameter
        if (param.includes('.')) {
            const [category, property] = param.split('.');
            if (track.synth[category]) {
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
                        trackState.outerSequencer.probability || track.outerSequencer.probability
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

    createHelpTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    setupHelpSystem() {
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
                .logic-operator:not(.help-duplicate),
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
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
}

class EuclideanSequencer {
    constructor(steps = 8, pulses = 4, rotation = 0) {
        this.steps = Math.min(steps, 16);
        this.pulses = Math.min(pulses, this.steps);
        this.rotation = rotation;
        this.probability = 100; // Default to 100% probability
        this.pattern = [];
        this.generatePattern();
    }

    generatePattern() {
        if (this.steps === 0 || this.pulses === 0) {
            this.pattern = Array(this.steps).fill(false);
            return;
        }

        // Bjorklund's algorithm implementation
        let pattern = Array(this.steps).fill(false);
        let counts = [];
        let remainders = [];
        let divisor = this.steps - this.pulses;
        let level = 0;

        let remaindersStack = [this.pulses];
        let countsStack = [];

        while (true) {
            countsStack.push(Math.floor(divisor / remaindersStack[level]));
            remaindersStack.push(divisor % remaindersStack[level]);
            divisor = remaindersStack[level];
            level++;
            if (remaindersStack[level] <= 1) {
                break;
            }
        }
        remaindersStack.push(divisor);

        const build = (level) => {
            if (level === -1) {
                return [0];
            }
            if (level === -2) {
                return [1];
            }
            let sequence = [];
            const count = countsStack[level];
            const remainder = remaindersStack[level];
            const previousSequence = build(level - 1);
            for (let i = 0; i < count; i++) {
                sequence = sequence.concat(previousSequence);
            }
            if (remainder !== 0) {
                sequence = sequence.concat(build(level - 2));
            }
            return sequence;
        };

        let patternSequence = build(level - 1);
        while (patternSequence.length < this.steps) {
            patternSequence = patternSequence.concat(patternSequence);
        }
        patternSequence = patternSequence.slice(0, this.steps);

        // Apply rotation
        if (this.rotation !== 0) {
            const rotateAmount = this.rotation % this.steps;
            patternSequence = [...patternSequence.slice(rotateAmount), ...patternSequence.slice(0, rotateAmount)];
        }
        this.pattern = patternSequence.map(step => step === 1);
    }

    static combinePatterns(pattern1, pattern2, operator = 'AND') {
        const maxLength = Math.max(pattern1.length, pattern2.length);
        const result = Array(maxLength).fill(false);

        for (let i = 0; i < maxLength; i++) {
            const a = pattern1[i % pattern1.length];
            const b = pattern2[i % pattern2.length];

            switch (operator.toUpperCase()) {
                case 'AND':
                    result[i] = a && b;
                    break;
                case 'OR':
                    result[i] = a || b;
                    break;
                case 'XOR':
                    result[i] = a !== b;
                    break;
                default:
                    result[i] = a && b;
            }
        }

        return result;
    }

    getStep(step) {
        const isActive = this.pattern[step % this.steps];
        // Only check probability if the step is active
        if (isActive) {
            return Math.random() * 100 < this.probability;
        }
        return false;
    }

    updateParams(steps, pulses, rotation, probability = this.probability) {
        this.steps = Math.min(steps, 16);
        this.pulses = Math.min(pulses, this.steps);
        this.rotation = rotation;
        this.probability = probability;
        this.generatePattern();
    }
}

class Track {
    constructor(name, synth, params, grooveboxInstance) {
        this.name = name;
        this.synth = synth;
        this.params = params;
        this.groovebox = grooveboxInstance;

        // Create two euclidean sequencers with 0 pulses initially and 16 steps each
        this.outerSequencer = new EuclideanSequencer(16, 0, 0);
        this.innerSequencer = new EuclideanSequencer(16, 0, 0);

        // Sequencer settings
        this.logicOperator = 'AND';
        this.selectedNotes = new Set();
        this.currentNoteIndex = 0;
        this.octaveOffset = 0;  // -/+ octave range
        this.octaveRange = 1;   // total spread

        // Create SVG visualization
        this.svg = this.createSequencerSVG();

        // Controls container
        this.controlsContainer = null;

        // Connect synth to effects and output
        this.synth.connect(grooveboxInstance.reverbSend);
        this.synth.connect(grooveboxInstance.delaySend);
        this.synth.connect(grooveboxInstance.mixer);

        this.innerStep = 0;  // Add separate step counters
        this.outerStep = 0;
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
        // Update rings using their individual step counters
        this.updateRingLEDs(this.outerRing, this.outerSequencer, this.outerStep);
        this.updateRingLEDs(this.innerRing, this.innerSequencer, this.innerStep);
    }

    updateRingLEDs(ring, sequencer, currentStep) {
        const leds = ring.getElementsByClassName('sequencer-led');

        for (let i = 0; i < leds.length; i++) {
            const led = leds[i];
            const isActive = sequencer.getStep(i);
            const isCurrent = i === currentStep % sequencer.steps;

            led.classList.toggle('active', isActive);
            led.classList.toggle('playing', isCurrent);
        }
    }

    // Get the combined pattern value for the current step
    getStepValue(step) {
        // Update individual step counters
        this.outerStep = step % this.outerSequencer.steps;
        this.innerStep = step % this.innerSequencer.steps;
        
        const outerStep = this.outerSequencer.getStep(this.outerStep);
        const innerStep = this.innerSequencer.getStep(this.innerStep);
        
        // If no pulses in either sequencer, return false
        if (this.outerSequencer.pulses === 0 && this.innerSequencer.pulses === 0) return false;
        
        // If only one sequencer has pulses, use that one
        if (this.outerSequencer.pulses === 0) return innerStep;
        if (this.innerSequencer.pulses === 0) return outerStep;
        
        // Both sequencers have pulses, use logic operator
        switch (this.logicOperator.toUpperCase()) {
            case 'AND': return outerStep && innerStep;
            case 'OR': return outerStep || innerStep;
            case 'XOR': return outerStep !== innerStep;
            default: return outerStep || innerStep;
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

        // Add logic controls
        sequencerContainer.appendChild(this.createLogicControls());

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

        container.appendChild(synthContainer);

        this.controlsContainer = container;
        return container;
    }

    createSequencerControls(type) {
        const container = document.createElement('div');
        container.className = `${type}-controls sequencer-control-group`;

        // Create knob controls
        const knobs = document.createElement('div');
        knobs.className = 'knob-controls';

        // Steps knob - initialize at 16
        const stepsKnob = this.createKnob({
            id: `${type}-steps`,
            label: 'Steps',
            min: 1,
            max: 16,
            value: 16,  // Initialize at 16 steps
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(value, sequencer.pulses, sequencer.rotation, sequencer.probability);
                this.updateVisualization(0);
            }
        });

        // Pulses knob - initialize at 0
        const pulsesKnob = this.createKnob({
            id: `${type}-pulses`,
            label: 'Pulses',
            min: 0,
            max: 16,
            value: 0,  // Initialize at 0 pulses
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(sequencer.steps, value, sequencer.rotation, sequencer.probability);
                this.updateVisualization(0);
            }
        });

        // Rotation knob - initialize at 0
        const rotationKnob = this.createKnob({
            id: `${type}-rotation`,
            label: 'Rotation',
            min: 0,
            max: 31,
            value: 0,  // Initialize at 0 rotation
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(sequencer.steps, sequencer.pulses, value, sequencer.probability);
                this.updateVisualization(0);
            }
        });

        // Probability knob - initialize at 100%
        const probabilityKnob = this.createKnob({
            id: `${type}-probability`,
            label: 'Prob %',
            min: 0,
            max: 100,
            value: 100,  // Initialize at 100%
            onChange: (value) => {
                const sequencer = type === 'outer' ? this.outerSequencer : this.innerSequencer;
                sequencer.updateParams(sequencer.steps, sequencer.pulses, sequencer.rotation, value);
                this.updateVisualization(0);
            }
        });

        // Append knobs to the container
        knobs.appendChild(stepsKnob);
        knobs.appendChild(pulsesKnob);
        knobs.appendChild(rotationKnob);
        knobs.appendChild(probabilityKnob);
        container.appendChild(knobs);

        return container;
    }

    createLogicControls() {
        const container = document.createElement('div');
        container.className = 'logic-controls';

        const select = document.createElement('select');
        select.className = 'logic-operator';
        ['AND', 'OR', 'XOR'].forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            select.appendChild(option);
        });

        container.appendChild(select);
        return container;
    }

    createKnob({ id, label, min, max, value, onChange }) {
        const container = document.createElement('div');
        container.className = 'knob-container';

        const knob = document.createElement('div');
        knob.className = 'knob';
        knob.innerHTML = `
            <div class="knob-outer">
                <input type="range" 
                       id="${id}" 
                       min="${min}" 
                       max="${max}" 
                       value="${value}"
                       class="knob-input">
                <div class="knob-indicator"></div>
                <div class="knob-surface"></div>
            </div>
            <div class="knob-label">${label}</div>
            <div class="value-display">${value}</div>
        `;

        const input = knob.querySelector('input');
        const display = knob.querySelector('.value-display');
        const indicator = knob.querySelector('.knob-indicator');
        const surface = knob.querySelector('.knob-surface');

        let isDragging = false;
        let startY = 0;
        let startValue = 0;

        // Handle mouse/touch interaction
        const startDrag = (e) => {
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            startValue = parseInt(input.value);
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
            surface.style.cursor = 'grabbing';
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const diff = startY - currentY;
            
            // Adjust sensitivity here - lower number = more sensitive
            const sensitivity = 2;
            let newValue = startValue + Math.round(diff / sensitivity);
            
            // Clamp value between min and max
            newValue = Math.max(min, Math.min(max, newValue));
            
            // Update input, display, and indicator
            input.value = newValue;
            display.textContent = newValue;
            
            // Update knob rotation
            const rotation = (newValue - min) / (max - min) * 270 - 135;
            indicator.style.transform = `rotate(${rotation}deg)`;
            
            // Trigger onChange callback
            onChange(newValue);
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
            surface.style.cursor = 'grab';
        };

        // Add event listeners
        surface.addEventListener('mousedown', startDrag);
        surface.addEventListener('touchstart', startDrag);

        // Double click to reset to default value
        surface.addEventListener('dblclick', () => {
            input.value = value; // Reset to default value
            display.textContent = value;
            const rotation = (value - min) / (max - min) * 270 - 135;
            indicator.style.transform = `rotate(${rotation}deg)`;
            onChange(value);
        });

        container.appendChild(knob);
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
}

// Initialize the groovebox when the page loads
let groovebox;
document.addEventListener('DOMContentLoaded', () => {
    groovebox = new Groovebox();
});


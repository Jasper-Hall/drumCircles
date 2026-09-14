#!/bin/sh
# The example rhythms RHYTHM 001 plays under the VO, in two voices: a clinical FM
# beep (sine, no attack, hair of sustain, no release) and the hat. Needs the desk
# served on :4173.  Usage: sh tools/render-rhythm001-examples.sh out/ex
set -e
OUT=${1:-out/ex}
BEEP='{"modulationIndex":0.1,"harmonicity":1,"envelope.attack":0.001,"envelope.decay":0.06,"envelope.sustain":0.05,"envelope.release":0.001,"modulationEnvelope.attack":0.001,"modulationEnvelope.decay":0.001,"modulationEnvelope.release":0.001}'
r() { # name bpm n k rot
  node tools/render-preset.mjs --bpm $2 --track fm  --notes 14 --synth "$BEEP" --norm 0.5 --seq $3,$4,$5,50 --bars 1 --out $OUT/$1-fm.wav
  node tools/render-preset.mjs --bpm $2 --track hat --norm 0.5 --seq $3,$4,$5,50 --bars 1 --out $OUT/$1-hat.wav
}
for k in 1 2 3 4 5 7; do r ex-e$k-16 120 16 $k 0; done
r ex-footwork-e6-16 160 16 6 6
r ex-ewe-e7-12 120 12 7 0
r ex-venda-e5-12 120 12 5 0
r ex-tresillo-e3-8 100 8 3 0
r ex-cinquillo-e5-8 100 8 5 0
for v in fm hat; do
  # the knob turn: one second of each K, 1 2 3 4 5 7
  ffmpeg -y -loglevel error $(for k in 1 2 3 4 5 7; do printf -- "-t 1 -i $OUT/ex-e$k-16-$v.wav "; done) \
    -filter_complex "[0][1][2][3][4][5]concat=n=6:v=0:a=1" $OUT/ex-knobturn-$v.wav
done
# the distribution sweep on E(5,16): EUC, two detents toward the front, two toward the back
for d in 50 43 34 57 66; do
  node tools/render-preset.mjs --bpm 120 --track fm  --notes 14 --synth "$BEEP" --norm 0.5 --seq 16,5,0,$d --bars 1 --out $OUT/ex-e5-16-d$d-fm.wav
  node tools/render-preset.mjs --bpm 120 --track hat --norm 0.5 --seq 16,5,0,$d --bars 1 --out $OUT/ex-e5-16-d$d-hat.wav
done

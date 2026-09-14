#!/bin/sh
# RHYTHM 001's beds, rendered through the desk from public/presets.js (tune on
# tune.html, export, import-tuned, re-run). Needs the desk served on :4173.
#   sh tools/render-rhythm001-examples.sh out/ex
set -e
OUT=${1:-out/ex}
R="node tools/render-preset.mjs --norm 0.5"
# the named rhythms (EXAMPLE_PRESETS): one bar each; a 12-step ring is 12/8 (engine.js stepBeats)
for id in ex-techno ex-footwork ex-ewe ex-venda ex-tresillo ex-cinquillo; do
  $R --genre $id --bars 1 --lead 1 --out $OUT/$id.wav
done
# the genres the film plays, two bars each, as tuned
for id in dancehall reggaeton ukfunky ukgarage bailefunk; do
  node tools/render-preset.mjs --genre $id --bars 2 --out $OUT/$id.wav
done
# the hook: four bars of dancehall with the snare fill turned in live (rheome-video: bun scripts-hook-fill.ts > out/hook-fill.json)
node tools/render-preset.mjs --genre dancehall --bars 4 --lead 1 --automate out/hook-fill.json --out $OUT/hook-dancehall.wav
# the knob turn ("Euclidean sequencing": PULSES 1,3,5,7 a bar each at 140) and the
# distribution sweep to both poles, in the beep and in the hat: an explicit pattern on the example's voice
BPM=140; BAR=$(node -e "console.log((4*60/$BPM).toFixed(6))")
for v in beep hat; do
  tr=fm; [ $v = hat ] && tr=hat
  for k in 1 3 5 7; do $R --bars 1 --bpm $BPM --genre ex-$v --track $tr --seq 16,$k,0,50 --out $OUT/ex-e$k-16-$v.wav; done
  for d in 50 25 0 75 100; do $R --bars 1 --genre ex-$v --track $tr --seq 16,5,0,$d --out $OUT/ex-e5-16-d$d-$v.wav; done
  ffmpeg -y -loglevel error $(for k in 1 3 5 7; do printf -- "-t $BAR -i $OUT/ex-e$k-16-$v.wav "; done) \
    -filter_complex "[0][1][2][3]concat=n=4:v=0:a=1" $OUT/ex-knobturn-$v.wav
done

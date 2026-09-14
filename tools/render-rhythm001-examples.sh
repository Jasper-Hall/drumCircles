#!/bin/sh
# RHYTHM 001's example beds, rendered through the desk from the EXAMPLE_PRESETS
# bank in public/presets.js (tune them on tune.html, export, import-tuned, re-run).
# Needs the desk served on :4173.   Usage: sh tools/render-rhythm001-examples.sh out/ex
set -e
OUT=${1:-out/ex}
R="node tools/render-preset.mjs --norm 0.5"
# a 12-step ring cycles every 12 sixteenths, so three bars hold four whole cycles
for id in ex-techno:1 ex-footwork:1 ex-ewe:3 ex-venda:3 ex-tresillo:1 ex-cinquillo:1; do
  $R --genre ${id%:*} --bars ${id#*:} --lead ${id#*:} --out $OUT/${id%:*}.wav   # lead = bars, so the cycle starts at step 0
done
# the knob turn and the sweep, in the beep and in the hat: the example's voice, an explicit pattern
for v in beep hat; do
  tr=fm; [ $v = hat ] && tr=hat
  for k in 1 2 3 4 5 7; do $R --bars 1 --genre ex-$v --track $tr --seq 16,$k,0,50 --out $OUT/ex-e$k-16-$v.wav; done
  for d in 50 43 34 57 66; do $R --bars 1 --genre ex-$v --track $tr --seq 16,5,0,$d --out $OUT/ex-e5-16-d$d-$v.wav; done
  ffmpeg -y -loglevel error $(for k in 1 2 3 4 5 7; do printf -- "-t 1 -i $OUT/ex-e$k-16-$v.wav "; done) \
    -filter_complex "[0][1][2][3][4][5]concat=n=6:v=0:a=1" $OUT/ex-knobturn-$v.wav
done

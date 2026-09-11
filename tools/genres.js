const {solve}=require('./solve.js');
const PRIMITIVES=[
  ['four-on-floor',        'x...x...x...x...'],
  ['backbeat (2 & 4)',     '....x.......x...'],
  ['offbeat 8ths (hat)',   '..x...x...x...x.'],
  ['straight 8ths (hat)',  'x.x.x.x.x.x.x.x.'],
  ['straight 16ths (hat)', 'xxxxxxxxxxxxxxxx'],
  ['tresillo 3-3-2',       'x..x..x.x..x..x.'],
  ['dembow snare',         'x..x....x..x....'],
  ['cinquillo',            'x.xx.xx.x.xx.xx.'],
  ['son clave 3-2',        'x..x..x...x.x...'],
  ['rumba clave 3-2',      'x..x...x..x.x...'],
  ['bossa clave',          'x..x..x...x..x..'],
  ['2-step kick',          'x.....x...x.....'],
  ['tamborzao kick',       'x..x..x...x..x..'],
  ['shuffle/swing 8ths',   'x..x..x..x..x..x'],
  ['kick 1 & 3',           'x.......x.......'],
  ['drill snare (3only)',  '........x.......'],
  ['16th offbeat hat',     '.x.x.x.x.x.x.x.x'],
];
console.log('RHYTHMIC PRIMITIVES — reachable with one pattern per track?\n');
let ok=0,fail=[];
for(const [name,pat] of PRIMITIVES){
  const {exact,near}=solve(pat);
  if(exact.length){
    const b=exact[0]; ok++;
    console.log('  OK   '+name.padEnd(22)+pat+'   N'+String(b.n).padStart(2)+' K'+String(b.k).padStart(2)+' rot'+String(b.rot).padStart(2)+' dist'+String(b.dv).padStart(3)+(b.aligns?'':'  [polyrhythm]'));
  } else {
    const b=near[0]; fail.push([name,pat,b]);
    console.log('  MISS '+name.padEnd(22)+pat+'   nearest off by '+b.ham+': '+b.pat+' (N'+b.n+' K'+b.k+' rot'+b.rot+' dist'+b.dv+')');
  }
}
console.log('\n'+ok+' of '+PRIMITIVES.length+' primitives reachable exactly.');

const {solve,render,DETENTS}=require('./solve.js');
const ALIGN=[1,2,4,8,16];
// full reachable set of one-bar patterns, restricted to step counts that divide the bar
const reach=new Set();
const params=new Map();
for(const n of ALIGN) for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++){
  const key=render(n,k,rot,dv).join('');
  if(!params.has(key)) params.set(key,{n,k,rot,dv});
  reach.add(key);
}
console.log('Bar-aligned reachable patterns (N in {1,2,4,8,16}):', reach.size, 'of 65536',
  '('+(100*reach.size/65536).toFixed(2)+'%)');
// by hit count
const byK={}; for(const p of reach){const c=[...p].filter(c=>c==='1').length; byK[c]=(byK[c]||0)+1;}
const tot={}; for(let i=0;i<65536;i++){const c=i.toString(2).split('1').length-1; tot[c]=(tot[c]||0)+1;}
console.log('\nhits  reachable / all 16-step patterns with that many hits');
for(let c=0;c<=8;c++) console.log('  '+String(c).padStart(2)+'   '+String(byK[c]||0).padStart(5)+' / '+String(tot[c]).padStart(5)+'   '+(100*(byK[c]||0)/tot[c]).toFixed(1)+'%');

const PRIMS=[
  ['four-on-floor','x...x...x...x...'],['backbeat','....x.......x...'],
  ['offbeat 8ths','..x...x...x...x.'],['straight 8ths','x.x.x.x.x.x.x.x.'],
  ['tresillo','x..x..x.x..x..x.'],['dembow snare','x..x....x..x....'],
  ['cinquillo','x.xx.xx.x.xx.xx.'],['son clave 3-2','x..x..x...x.x...'],
  ['rumba clave 3-2','x..x...x..x.x...'],['bossa/tamborzao','x..x..x...x..x..'],
  ['2-step kick 0,6,10','x.....x...x.....'],['kick 1&3','x.......x.......'],
  ['drill snare','........x.......'],['garage kick 0,3,10','x..x......x.....'],
  ['funky kick 0,3,6,10','x..x..x...x.....'],['hyphy kick 0,6,10,12','x.....x...x.x...'],
];
console.log('\nBAR-ALIGNED ONLY:');
let ok=0;
for(const [name,pat] of PRIMS){
  const bin=pat.replace(/x/g,'1').replace(/\./g,'0');
  if(reach.has(bin)){const p=params.get(bin);ok++;
    console.log('  OK   '+name.padEnd(22)+pat+'  N'+String(p.n).padStart(2)+' K'+String(p.k).padStart(2)+' rot'+String(p.rot).padStart(2)+' dist'+String(p.dv).padStart(3));}
  else {
    // nearest reachable
    let best=null;
    for(const r of reach){let ham=0;
      for(let i=0;i<16;i++) if(r[i]!==bin[i]) ham++;
      if(!best||ham<best.ham)best={r,ham};}
    console.log('  MISS '+name.padEnd(22)+pat+'  nearest off by '+best.ham+': '+best.r.replace(/1/g,'x').replace(/0/g,'.'));
  }
}
console.log('\n'+ok+' of '+PRIMS.length+' bar-aligned.');

const {render,DETENTS}=require('./solve.js');
const ALIGN=[1,2,4,8,16];
const reach=new Map();
for(const n of ALIGN) for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++){
  const key=render(n,k,rot,dv).join(''); if(!reach.has(key))reach.set(key,{steps:n,pulses:k,rotation:rot,distribution:dv});
}
const bin=p=>p.replace(/x/g,'1').replace(/\./g,'0');
const P=(p)=>{const r=reach.get(bin(p)); if(!r) return null; return r;};

const G=[
 ['house','House',124,{kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.'}],
 ['reggaeton','Reggaeton',96,{kick:'x.......x.......',snare:'x..x....x..x....',hat:'x.x.x.x.x.x.x.x.'}],
 ['dancehall','Dancehall',100,{kick:'x.......x.......',snare:'x..x....x..x....',hat:'x.x.x.x.x.x.x.x.'}],
 ['dembow','Dembow Dominicano',115,{kick:'x.......x.......',snare:'x..x..x.x..x..x.',hat:'x.x.x.x.x.x.x.x.'}],
 ['bailefunk','Baile Funk',130,{kick:'x..x..x...x..x..',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['kuduro','Kuduro',140,{kick:'x..x..x.x..x..x.',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['bouyon','Bouyon',128,{kick:'x...x...x...x...',snare:'x..x..x.x..x..x.',hat:'xxxxxxxxxxxxxxxx'}],
 ['cumbia','Cumbia',95,{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['tribal','Tribal (Mexican)',126,{kick:'x...x...x...x...',snare:'x..x..x.x..x..x.',hat:'..x...x...x...x.'}],
 ['ukfunky','UK Funky',130,{kick:'x..x..x...x.....',snare:'....x.......x...',hat:'..x...x...x...x.'}],
 ['ukdrill','UK Drill',142,{kick:'x.........x.....',snare:'........x.......',hat:'x.x.x.x.x.x.x.x.'}],
];
const out=[];
for(const [id,label,bpm,tr] of G){
  const tracks={};let ok=true;
  for(const [inst,pat] of Object.entries(tr)){const r=P(pat); if(!r){ok=false;console.error('UNREACHABLE',id,inst,pat);} tracks[inst]={...r,target:pat};}
  out.push({id,label,bpm,verified:ok,tracks});
}
console.log(JSON.stringify(out,null,2));

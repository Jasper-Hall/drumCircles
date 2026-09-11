const {render,DETENTS}=require('./solve.js');
const ALIGN=[1,2,4,8,16];
const reach=new Map();
for(const n of ALIGN) for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++){
  const key=render(n,k,rot,dv).join('');
  if(!reach.has(key)) reach.set(key,{n,k,rot,dv});
}
const bin=p=>p.replace(/x/g,'1').replace(/\./g,'0');
function look(p){const b=bin(p);
  if(reach.has(b))return{ok:true,...reach.get(b)};
  let best=null;
  for(const [r,pm] of reach){let h=0;for(let i=0;i<16;i++)if(r[i]!==b[i])h++;
    if(!best||h<best.h)best={h,r,pm};}
  return{ok:false,...best};}

// First-pass canonical patterns. NEEDS JASPER'S EAR -- this is the part I cannot verify.
const G=[
 ['house',            {kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.'}],
 ['reggaeton',        {kick:'x.......x.......',snare:'x..x....x..x....',hat:'x.x.x.x.x.x.x.x.'}],
 ['dancehall',        {kick:'x.......x.......',snare:'x..x....x..x....',hat:'x.x.x.x.x.x.x.x.'}],
 ['dembow dominicano',{kick:'x.......x.......',snare:'x..x..x.x..x..x.',hat:'x.x.x.x.x.x.x.x.'}],
 ['baile funk',       {kick:'x..x..x...x..x..',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['kuduro',           {kick:'x..x..x.x..x..x.',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['bouyon',           {kick:'x...x...x...x...',snare:'x..x..x.x..x..x.',hat:'xxxxxxxxxxxxxxxx'}],
 ['cumbia',           {kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
 ['tribal (mexican)', {kick:'x...x...x...x...',snare:'x..x..x.x..x..x.',hat:'..x...x...x...x.'}],
 ['uk funky',         {kick:'x..x..x...x.....',snare:'....x.......x...',hat:'..x...x...x...x.'}],
 ['uk garage',        {kick:'x.....x...x.....',snare:'....x.......x...',hat:'..x...x...x...x.'}],
 ['uk drill',         {kick:'x.........x.....',snare:'........x.......',hat:'x.x.x.x.x.x.x.x.'}],
 ['hyphy',            {kick:'x.....x...x.x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
];
let full=0;
for(const [name,tr] of G){
  const res=Object.entries(tr).map(([k,p])=>[k,p,look(p)]);
  const allok=res.every(r=>r[2].ok); if(allok) full++;
  console.log((allok?'FULL ':'GAP  ')+name);
  for(const [inst,pat,r] of res){
    if(r.ok) console.log('   '+inst.padEnd(6)+pat+'  N'+String(r.n).padStart(2)+' K'+String(r.k).padStart(2)+' rot'+String(r.rot).padStart(2)+' dist'+String(r.dv).padStart(3));
    else     console.log('   '+inst.padEnd(6)+pat+'  UNREACHABLE -- closest (off '+r.h+'): '+r.r.replace(/1/g,'x').replace(/0/g,'.')+'  N'+r.pm.n+' K'+r.pm.k+' rot'+r.pm.rot+' dist'+r.pm.dv);
  }
}
console.log('\n'+full+' of '+G.length+' genres fully reachable with one bar-aligned pattern per track.');

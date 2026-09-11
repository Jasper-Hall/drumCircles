const {render,DETENTS}=require('./solve.js');
const ALIGN=[1,2,4,8,16];
const reach=new Set();
for(const n of ALIGN) for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++)
  reach.add(render(n,k,rot,dv).join(''));

// cyclic gap sequence of a pattern
function gaps(p){const idx=[];for(let i=0;i<16;i++)if(p[i]==='1')idx.push(i);
  if(idx.length<2)return null;const g=[];
  for(let i=0;i<idx.length;i++) g.push(((idx[(i+1)%idx.length]-idx[i])+16)%16 || 16);
  return g;}
// is some rotation of the gap sequence monotone (non-decreasing or non-increasing)?
function monotoneRotation(g){
  for(let r=0;r<g.length;r++){
    const s=g.slice(r).concat(g.slice(0,r));
    let inc=true,dec=true;
    for(let i=1;i<s.length;i++){if(s[i]<s[i-1])inc=false;if(s[i]>s[i-1])dec=false;}
    if(inc||dec)return true;
  }
  return false;
}
// test the hypothesis across every 16-step pattern with 3..6 hits
let tp=0,fp=0,tn=0,fn=0,fpEx=[],fnEx=[];
for(let i=0;i<65536;i++){
  const p=i.toString(2).padStart(16,'0');
  const hits=[...p].filter(c=>c==='1').length;
  if(hits<3||hits>6)continue;
  const r=reach.has(p), m=monotoneRotation(gaps(p));
  if(r&&m)tp++; else if(!r&&m){fp++; if(fpEx.length<4)fpEx.push(p);}
  else if(!r&&!m)tn++; else {fn++; if(fnEx.length<4)fnEx.push(p);}
}
console.log('HYPOTHESIS: a pattern is reachable  <=>  its cyclic gap sequence is monotone under some rotation\n');
console.log('  reachable AND monotone      ', tp);
console.log('  unreachable AND non-monotone', tn);
console.log('  monotone but UNreachable    ', fp, fpEx.map(x=>x.replace(/1/g,'x').replace(/0/g,'.')).join(' '));
console.log('  reachable but NON-monotone  ', fn, fnEx.map(x=>x.replace(/1/g,'x').replace(/0/g,'.')).join(' '));
console.log('\n  => monotone gaps is a NECESSARY condition:', fn===0 ? 'YES (no reachable pattern has non-monotone gaps)' : 'no');

for(const [name,pat] of [['uk garage kick','x.....x...x.....'],['hyphy kick','x.....x...x.x...'],['reggaeton snare','x..x....x..x....'],['tresillo','x..x..x.x..x..x.']]){
  const b=pat.replace(/x/g,'1').replace(/\./g,'0');
  console.log('\n  '+name+'  '+pat+'\n    gaps '+JSON.stringify(gaps(b))+'  monotone-rotatable: '+monotoneRotation(gaps(b))+'  reachable: '+reach.has(b));
}

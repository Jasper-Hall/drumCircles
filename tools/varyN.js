function bjork(steps,pulses){if(pulses<=0)return Array(steps).fill(0);if(pulses>=steps)return Array(steps).fill(1);
 const p=Array(steps).fill(0);const s=steps/pulses;for(let i=0;i<pulses;i++)p[Math.floor(i*s)]=1;
 if(pulses===2&&steps===5){p.fill(0);p[0]=1;p[3]=1;}else if(pulses===3&&steps===8){p.fill(0);p[0]=1;p[3]=1;p[6]=1;}
 return p;}
function applyDist(pattern,steps,pulses,dv){
 if(dv===50||pulses<=0||pulses>=steps)return pattern.slice();
 const np=Array(steps).fill(0);const act=[];for(let i=0;i<steps;i++)if(pattern[i])act.push(i);
 const bf=Math.abs(dv-50)/50,left=dv<50;
 for(let i=0;i<act.length;i++){const tgt=left?i:steps-pulses+i;
  let pos=Math.round(act[i]*(1-bf)+tgt*bf);pos=Math.min(Math.max(0,pos),steps-1);
  while(np[pos])pos=left?(pos+1)%steps:(pos-1+steps)%steps;np[pos]=1;}
 return np;}
// reduce to primitive period, then canonical rotation -> identity of a LOOPING rhythm
function loopId(arr){
 const n=arr.length;let d=n;
 for(let p=1;p<=n;p++){ if(n%p)continue; let ok=true;
  for(let i=0;i<n;i++) if(arr[i]!==arr[i%p]){ok=false;break;}
  if(ok){d=p;break;} }
 const s=arr.slice(0,d).join('');
 let best=s;for(let r=1;r<d;r++){const t=s.slice(r)+s.slice(0,r);if(t<best)best=t;}
 return best;}

const MAXN=16;
// --- the whole space: every binary loop of period <= 16 ---
const allLoops=new Set();
for(let n=1;n<=MAXN;n++) for(let i=0;i<(1<<n);i++){
 const a=[];for(let b=n-1;b>=0;b--)a.push((i>>b)&1); allLoops.add(loopId(a)); }
// --- euclidean, N fixed at 16 ---
const e16=new Set(); for(let k=0;k<=16;k++) e16.add(loopId(bjork(16,k)));
// --- euclidean, N = 1..16 ---
const eAll=new Set(); for(let n=1;n<=MAXN;n++) for(let k=0;k<=n;k++) eAll.add(loopId(bjork(n,k)));
// --- + distribution, N fixed 16 ---
const d16=new Set(); for(let k=0;k<=16;k++) for(let d=0;d<=100;d++) d16.add(loopId(applyDist(bjork(16,k),16,k,d)));
// --- + distribution, N = 1..16 ---
const dAll=new Set(); for(let n=1;n<=MAXN;n++) for(let k=0;k<=n;k++) for(let d=0;d<=100;d++) dAll.add(loopId(applyDist(bjork(n,k),n,k,d)));

const pct=(a,b)=>(100*a/b).toFixed(2)+'%';
console.log('DISTINCT LOOPING RHYTHMS (primitive period, up to rotation), period <= 16');
console.log('whole space                     ', allLoops.size);
console.log('euclidean, N=16 only            ', e16.size, pct(e16.size,allLoops.size));
console.log('euclidean, N=1..16              ', eAll.size, pct(eAll.size,allLoops.size));
console.log('+distribution, N=16 only        ', d16.size, pct(d16.size,allLoops.size));
console.log('+distribution, N=1..16          ', dAll.size, pct(dAll.size,allLoops.size));
console.log('');
console.log('naive count sum_{N=1..16}(N+1) =', 152, '-> collapses to', eAll.size, 'distinct loops');
// how many of the 152 are redundant, and why
const seen=new Map();
for(let n=1;n<=MAXN;n++) for(let k=0;k<=n;k++){const id=loopId(bjork(n,k));
 if(!seen.has(id))seen.set(id,[]); seen.get(id).push(`E(${k},${n})`);}
const dupes=[...seen.entries()].filter(([,v])=>v.length>1);
console.log('rhythm classes reached by >1 (N,K) pair:', dupes.length);
console.log('examples:'); dupes.slice(0,6).forEach(([id,v])=>console.log('  ',id.padEnd(17),v.join(' = ')));

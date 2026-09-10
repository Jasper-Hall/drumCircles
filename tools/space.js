// Replicates drumCircles EuclideanSequencer exactly (public/groovebox.js)
function bjorklund(steps, pulses){
  if(pulses<=0) return new Array(steps).fill(false);
  if(pulses>=steps) return new Array(steps).fill(true);
  const p=new Array(steps).fill(false);
  const stepSize=steps/pulses;
  for(let i=0;i<pulses;i++) p[Math.floor(i*stepSize)]=true;
  if(pulses===2&&steps===5){p.fill(false);p[0]=true;p[3]=true;}
  else if(pulses===3&&steps===8){p.fill(false);p[0]=true;p[3]=true;p[6]=true;}
  return p;
}
function applyDistribution(pattern, steps, pulses, dv){
  if(dv===50||pulses<=0||pulses>=steps) return pattern;
  const np=new Array(steps).fill(false);
  const act=[]; for(let i=0;i<steps;i++) if(pattern[i]) act.push(i);
  const L=Array.from({length:pulses},(_,i)=>i);
  const R=Array.from({length:pulses},(_,i)=>steps-pulses+i);
  const bf=Math.abs(dv-50)/50, left=dv<50;
  for(let i=0;i<act.length;i++){
    let pos=Math.round(act[i]*(1-bf)+(left?L[i]:R[i])*bf);
    pos=Math.min(Math.max(0,pos),steps-1);
    while(np[pos]) pos = left ? (pos+1)%steps : (pos-1+steps)%steps;
    np[pos]=true;
  }
  return np;
}
const key=p=>p.map(b=>b?1:0).join('');
const rot=(p,r)=>p.map((_,i)=>p[(i-r+p.length)%p.length]);

const N=16;
// 1. classic euclidean, N=16, all K, all rotations
const classic=new Set();
for(let k=0;k<=N;k++){ const base=bjorklund(N,k); for(let r=0;r<N;r++) classic.add(key(rot(base,r))); }
// 2. + distribution (0..100 integer)
const withDist=new Set();
for(let k=0;k<=N;k++) for(let d=0;d<=100;d++){ const base=applyDistribution(bjorklund(N,k),N,k,d); for(let r=0;r<N;r++) withDist.add(key(rot(base,r))); }
// 3. all 16-step binary patterns
const ALL=Math.pow(2,N);
// 4. boolean combination of two dist-sequencers (same length 16)
const singles=[...withDist].map(s=>s.split('').map(c=>c==='1'));
function combine(op){
  const out=new Set();
  for(const a of singles) for(const b of singles){
    const r=a.map((v,i)=> op==='AND'? (v&&b[i]) : op==='OR'? (v||b[i]) : (v!==b[i]));
    out.add(key(r));
  }
  return out;
}
console.log('16-step universe (2^16)          ', ALL);
console.log('classic euclidean + rotation     ', classic.size, (100*classic.size/ALL).toFixed(3)+'%');
console.log('+ distribution                   ', withDist.size, (100*withDist.size/ALL).toFixed(2)+'%');
const A=combine('AND'),O=combine('OR'),X=combine('XOR');
const union=new Set([...withDist,...A,...O,...X]);
console.log('AND pairs                        ', A.size);
console.log('OR  pairs                        ', O.size);
console.log('XOR pairs                        ', X.size);
console.log('union (dist + all 3 ops)         ', union.size, (100*union.size/ALL).toFixed(2)+'%');

// --- necklace (rotation-class) counts: the fairer comparison ---
function canon(s){let best=s;for(let r=1;r<s.length;r++){const t=s.slice(r)+s.slice(0,r);if(t<best)best=t;}return best;}
const neckAll=new Set(); for(let i=0;i<ALL;i++) neckAll.add(canon(i.toString(2).padStart(N,'0')));
const neck=s=>new Set([...s].map(canon));
console.log('--- rotation classes (necklaces) ---');
console.log('all 16-step necklaces            ', neckAll.size);
console.log('classic euclidean                ', neck(classic).size);
console.log('+ distribution                   ', neck(withDist).size, (100*neck(withDist).size/neckAll.size).toFixed(1)+'%');
console.log('AND                              ', neck(A).size);
console.log('OR                               ', neck(O).size);
console.log('XOR                              ', neck(X).size);
// control-space size in the app: two seqs x (steps,pulses,rot,dist)
console.log('--- knob count ---');
console.log('one sequencer, knobs             ', 'steps 1-16, pulses 0-16, rot 0-15, dist 0-100');

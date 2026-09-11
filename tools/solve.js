// Invert the engine: given a 16-step target, find (steps,pulses,rotation,distribution).
// Mirrors public/groovebox.js exactly, including the one-pattern-per-track model where a
// pattern of N<16 steps simply loops inside the bar.
function bjork(n,k){if(k<=0)return Array(n).fill(0);if(k>=n)return Array(n).fill(1);
 const p=Array(n).fill(0),s=n/k;for(let i=0;i<k;i++)p[Math.floor(i*s)]=1;
 if(k===2&&n===5){p.fill(0);p[0]=1;p[3]=1;}else if(k===3&&n===8){p.fill(0);p[0]=1;p[3]=1;p[6]=1;}return p;}
function applyDist(pat,n,k,dv){if(dv===50||k<=0||k>=n)return pat.slice();
 const np=Array(n).fill(0),act=[];for(let i=0;i<n;i++)if(pat[i])act.push(i);
 const bf=Math.abs(dv-50)/50,left=dv<50;
 for(let i=0;i<act.length;i++){const t=left?i:n-k+i;let p=Math.round(act[i]*(1-bf)+t*bf);
  p=Math.min(Math.max(0,p),n-1);while(np[p])p=left?(p+1)%n:(p-1+n)%n;np[p]=1;}return np;}
// getStep(): rotatedStep = (step - rotation + steps) % steps
function render(n,k,rot,dv,bars=16){
  const pat=applyDist(bjork(n,k),n,k,dv); const out=[];
  for(let step=0;step<bars;step++) out.push(pat[((step-rot)%n+n)%n]?1:0);
  return out;
}
const DETENTS=(n,k)=>{const base=bjork(n,k);const groups=[];let prev=null;
  for(let d=0;d<=100;d++){const key=applyDist(base,n,k,d).join('');
    if(key===prev)groups[groups.length-1].push(d);else{groups.push([d]);prev=key;}}
  return groups.map(g=>g.reduce((b,d)=>Math.abs(d-50)<Math.abs(b-50)?d:b,g[0]));};

function solve(target){
  const t=target.split('').map(c=>(c==='x'||c==='1')?1:0);
  const exact=[],near=[];
  for(let n=1;n<=16;n++){
    const aligns = (16 % n === 0);
    for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++){
      const r=render(n,k,rot,dv);
      let ham=0; for(let i=0;i<16;i++) if(r[i]!==t[i]) ham++;
      const rec={n,k,rot,dv,ham,aligns,pat:r.join('')};
      if(ham===0) exact.push(rec); else if(ham<=1) near.push(rec);
    }
  }
  // prefer: aligns to the bar, then distribution nearest neutral, then fewest steps
  const rank=(a,b)=> (b.aligns-a.aligns) || (Math.abs(a.dv-50)-Math.abs(b.dv-50)) || (a.n-b.n) || (a.rot-b.rot);
  exact.sort(rank); near.sort((a,b)=>(a.ham-b.ham)||rank(a,b));
  return {exact,near};
}
module.exports={solve,render,DETENTS};
if(require.main===module){
  const t=process.argv[2];
  const {exact,near}=solve(t);
  console.log('target',t,'\nexact solutions:',exact.length);
  exact.slice(0,5).forEach(e=>console.log('  N='+e.n+' K='+e.k+' rot='+e.rot+' dist='+e.dv+(e.aligns?'':'  [does not divide the bar]')));
  if(!exact.length) near.slice(0,5).forEach(e=>console.log('  near (off by '+e.ham+'): N='+e.n+' K='+e.k+' rot='+e.rot+' dist='+e.dv+'  '+e.pat));
}

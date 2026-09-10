function bjork(n,k){if(k<=0)return Array(n).fill(0);if(k>=n)return Array(n).fill(1);
 const p=Array(n).fill(0),s=n/k;for(let i=0;i<k;i++)p[Math.floor(i*s)]=1;
 if(k===2&&n===5){p.fill(0);p[0]=1;p[3]=1;}else if(k===3&&n===8){p.fill(0);p[0]=1;p[3]=1;p[6]=1;}return p;}
function dist(pat,n,k,dv){if(dv===50||k<=0||k>=n)return pat.slice();
 const np=Array(n).fill(0),act=[];for(let i=0;i<n;i++)if(pat[i])act.push(i);
 const bf=Math.abs(dv-50)/50,left=dv<50;
 for(let i=0;i<act.length;i++){const t=left?i:n-k+i;let p=Math.round(act[i]*(1-bf)+t*bf);
  p=Math.min(Math.max(0,p),n-1);while(np[p])p=left?(p+1)%n:(p-1+n)%n;np[p]=1;}return np;}
function loopId(a){const n=a.length;let d=n;
 for(let p=1;p<=n;p++){if(n%p)continue;let ok=true;for(let i=0;i<n;i++)if(a[i]!==a[i%p]){ok=false;break;}if(ok){d=p;break;}}
 const s=a.slice(0,d).join('');let b=s;for(let r=1;r<d;r++){const t=s.slice(r)+s.slice(0,r);if(t<b)b=t;}return b;}

// For each distribution value, how many distinct rhythms are reachable there
// across all (N,K)? That is what a unit of knob travel at that point is worth.
const yieldAt=[];
for(let d=0;d<=100;d++){
  const s=new Set();
  for(let n=1;n<=16;n++)for(let k=0;k<=n;k++) s.add(loopId(dist(bjork(n,k),n,k,d)));
  yieldAt.push(s.size);
}
console.log('distinct rhythms reachable at each distribution value:');
for(let d=0;d<=100;d+=5) console.log('  dist',String(d).padStart(3),'→',yieldAt[d]);

// marginal: NEW rhythms first seen as you walk outward from centre
const seen=new Set(); const marg=new Array(101).fill(0);
for(let off=0;off<=50;off++){
  for(const d of (off===0?[50]:[50+off,50-off])){
    if(d<0||d>100)continue; let nw=0;
    for(let n=1;n<=16;n++)for(let k=0;k<=n;k++){const id=loopId(dist(bjork(n,k),n,k,d));
      if(!seen.has(id)){seen.add(id);nw++;}}
    marg[d]=nw;
  }
}
console.log('\nNEW rhythms first unlocked, by distance from centre:');
let cum=0; const rows=[];
for(let off=0;off<=50;off++){
  const n=(off===0?marg[50]:(marg[50+off]||0)+(marg[50-off]||0)); cum+=n;
  rows.push({off,n,cum});
}
const total=cum;
for(const r of rows) if(r.off%5===0||r.off<6)
  console.log('  |Δ|='+String(r.off).padStart(2),'new:'+String(r.n).padStart(4),
    ' cumulative:'+String(r.cum).padStart(4),'('+(100*r.cum/total).toFixed(1)+'%)');
console.log('\ntotal distinct:',total);
// where does 50% / 90% of the space live?
for(const q of [0.5,0.75,0.9,0.95]){
  const hit=rows.find(r=>r.cum>=q*total);
  console.log(`  ${(q*100)}% of all rhythms reached by |Δ| = ${hit.off}  (${(100*hit.off/50).toFixed(0)}% of linear travel)`);
}

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

// the canonical euclidean set (N=1..16)
const EUC=new Set(); for(let n=1;n<=16;n++)for(let k=0;k<=n;k++)EUC.add(loopId(bjork(n,k)));

// escapes: reachable with distribution, NOT in the euclidean set
const found=new Map();
for(let n=1;n<=16;n++)for(let k=0;k<=n;k++)for(let d=0;d<=100;d++){
  const p=dist(bjork(n,k),n,k,d), id=loopId(p);
  if(EUC.has(id))continue;
  if(!found.has(id))found.set(id,{n,k,d,pat:p.join('')});
}
// score for musical interest: N=16, mid density, not one contiguous block, has an internal gap
function block(p){const idx=[...p].map((c,i)=>c==='1'?i:-1).filter(i=>i>=0);
 if(idx.length<2)return true; let runs=1; for(let i=1;i<idx.length;i++) if(idx[i]!==idx[i-1]+1) runs++;
 // wrap-around join
 if(idx.length>1 && idx[0]===0 && idx[idx.length-1]===p.length-1 && runs>1) runs--;
 return runs<=1;}
const cands=[...found.values()].filter(v=>v.n===16&&v.k>=4&&v.k<=7&&!block(v.pat));
// prefer distinct gap-structure variety, spread across dist values
cands.sort((a,b)=>a.k-b.k||a.d-b.d);
console.log('total escape rhythms (not reachable by any euclidean N,K):',found.size);
console.log('shortlist — N=16, 4-7 hits, not a single block:\n');
const seenK=new Map();
for(const c of cands){ const key=c.k+'|'+(c.d<50?'L':'R');
 if((seenK.get(key)||0)>=2) continue; seenK.set(key,(seenK.get(key)||0)+1);
 const grid=[...c.pat].map(x=>x==='1'?'x':'.').join('');
 console.log(`  K=${String(c.k).padStart(2)} N=16 dist=${String(c.d).padStart(3)}  ${grid}`);}

function bjork(n,k){if(k<=0)return Array(n).fill(0);if(k>=n)return Array(n).fill(1);
 const p=Array(n).fill(0),s=n/k;for(let i=0;i<k;i++)p[Math.floor(i*s)]=1;
 if(k===2&&n===5){p.fill(0);p[0]=1;p[3]=1;}else if(k===3&&n===8){p.fill(0);p[0]=1;p[3]=1;p[6]=1;}return p;}
function dist(pat,n,k,dv){if(dv===50||k<=0||k>=n)return pat.slice();
 const np=Array(n).fill(0),act=[];for(let i=0;i<n;i++)if(pat[i])act.push(i);
 const bf=Math.abs(dv-50)/50,left=dv<50;
 for(let i=0;i<act.length;i++){const t=left?i:n-k+i;let p=Math.round(act[i]*(1-bf)+t*bf);
  p=Math.min(Math.max(0,p),n-1);while(np[p])p=left?(p+1)%n:(p-1+n)%n;np[p]=1;}return np;}

console.log('What the knob feels like at a fixed (N,K): distinct patterns over 101 positions\n');
let worstRuns=[];
for(const [n,k] of [[16,3],[16,4],[16,5],[16,6],[16,7],[16,9],[12,5],[8,3]]){
  const base=bjork(n,k); const seq=[];
  for(let d=0;d<=100;d++) seq.push(dist(base,n,k,d).join(''));
  const distinct=new Set(seq).size;
  // plateau runs
  const runs=[]; let start=0;
  for(let d=1;d<=100;d++){ if(seq[d]!==seq[d-1]){runs.push({from:start,to:d-1,len:d-start});start=d;} }
  runs.push({from:start,to:100,len:101-start});
  const longest=runs.reduce((a,b)=>b.len>a.len?b:a);
  console.log(`  N=${n} K=${k}:  ${String(distinct).padStart(3)} distinct patterns · ${String(runs.length).padStart(3)} plateaus · longest plateau ${longest.len} positions (dist ${longest.from}-${longest.to})`);
  worstRuns.push({n,k,distinct,runs:runs.length,longest:longest.len});
}
console.log('\nDetail — N=16 K=5, every transition point:');
{
 const base=bjork(16,5); let prev=null; const pts=[];
 for(let d=0;d<=100;d++){const s=dist(base,16,5,d).join(''); if(s!==prev){pts.push(d);prev=s;}}
 console.log('  changes at dist:',pts.join(' '));
 console.log('  → '+pts.length+' distinct patterns across 101 knob positions');
}

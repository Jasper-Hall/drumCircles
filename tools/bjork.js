// real Bjorklund
function real(n,k){if(k<=0)return Array(n).fill(0);if(k>=n)return Array(n).fill(1);
 let a=Array.from({length:k},()=>[1]),b=Array.from({length:n-k},()=>[0]);
 while(b.length>1){const m=Math.min(a.length,b.length);const na=[],nb=[];
  for(let i=0;i<m;i++)na.push(a[i].concat(b[i]));
  if(a.length>m) for(let i=m;i<a.length;i++)nb.push(a[i]);
  else for(let i=m;i<b.length;i++)nb.push(b[i]);
  a=na;b=nb;}
 return a.concat(b).flat();}
function app(steps,pulses){if(pulses<=0)return Array(steps).fill(0);if(pulses>=steps)return Array(steps).fill(1);
 const p=Array(steps).fill(0);const s=steps/pulses;for(let i=0;i<pulses;i++)p[Math.floor(i*s)]=1;
 if(pulses===2&&steps===5){p.fill(0);p[0]=1;p[3]=1;}else if(pulses===3&&steps===8){p.fill(0);p[0]=1;p[3]=1;p[6]=1;}
 return p;}
const canon=s=>{let b=s;for(let r=1;r<s.length;r++){const t=s.slice(r)+s.slice(0,r);if(t<b)b=t;}return b;};
for(const n of [8,12,16]) for(let k=1;k<n;k++){
 const r=real(n,k).join(''),a=app(n,k).join('');
 if(canon(r)!==canon(a)) console.log(`DIFFERS N=${n} K=${k}: real ${r}  app ${a}`);
}
console.log('done');

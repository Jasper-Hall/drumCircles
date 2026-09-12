const {solve}=require('./solve.js');
const R=require('/tmp/research.json');
const T=require('./tuned-2026-09-12.json').presets;
const {render}=require('./solve.js');
const plays=(tr)=> (16%tr.steps===0) ? render(tr.steps,tr.pulses,tr.rotation,tr.distribution,16).map(b=>b?'x':'.').join('') : '(poly N='+tr.steps+')';
const reach=(pat)=>{const {exact,near}=solve(pat);const a=exact.filter(e=>e.aligns);
  return a.length?{ok:true,p:a[0]}:{ok:false,off:near.length?near[0].ham:'?'};};
let agree=0,differ=0,unreach=[];
for(const r of R){
  const t=T.find(x=>x.id===r.id);
  console.log('\n'+r.id.toUpperCase()+'   research '+r.bpm+'bpm · you '+t.bpm+'bpm · confidence '+r.confidence);
  for(const inst of ['kick','snare','hat']){
    const canon=r[inst], mine=t.tracks[inst]?plays(t.tracks[inst]):'—';
    const rc=reach(canon);
    const same = canon===mine;
    if(same)agree++; else differ++;
    if(!rc.ok) unreach.push(r.id+'/'+inst+' '+canon+' (off '+rc.off+')');
    const rs = rc.ok ? 'N'+rc.p.n+' K'+rc.p.k+' r'+rc.p.rot+' d'+rc.p.dv : 'UNREACHABLE one-ring';
    console.log('  '+inst.padEnd(6)+' canon '+canon+'  '+(same?'= ':'≠ ')+'yours '+mine+'   canon reachable: '+rs);
  }
}
console.log('\n=== '+agree+' tracks agree with research, '+differ+' differ ===');
console.log('canonical patterns NOT reachable with one ring: '+unreach.length); unreach.forEach(u=>console.log('  '+u));

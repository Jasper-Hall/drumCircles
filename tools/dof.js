const {render,DETENTS}=require('./solve.js');
const ALIGN=[1,2,4,8,16];
console.log('Distribution is ONE degree of freedom: from a fixed (N,K) it traces a CURVE,\nnot a region. Points on that curve vs. patterns of that density:\n');
const tot={};for(let i=0;i<65536;i++){const c=i.toString(2).split('1').length-1;tot[c]=(tot[c]||0)+1;}
for(const k of [2,3,4,5,6]){
  const curve=new Set(DETENTS(16,k).map(d=>render(16,k,0,d).join('')));
  console.log('  N=16 K='+k+':  knob reaches '+String(curve.size).padStart(3)+' patterns   |   '+String(tot[k]).padStart(5)+' patterns exist with '+k+' hits   ('+(100*curve.size/tot[k]).toFixed(2)+'%)');
}
// can an OR mask of two rings reach the two failing kicks?
const reach=new Map();
for(const n of ALIGN) for(let k=0;k<=n;k++) for(const dv of DETENTS(n,k)) for(let rot=0;rot<n;rot++){
  const key=render(n,k,rot,dv).join(''); if(!reach.has(key))reach.set(key,{n,k,rot,dv});
}
const keys=[...reach.keys()];
console.log('\nCan an OR of two bar-aligned rings reach them?\n');
for(const [name,pat] of [['uk garage kick','x.....x...x.....'],['hyphy kick','x.....x...x.x...']]){
  const t=pat.replace(/x/g,'1').replace(/\./g,'0');
  let found=null;
  outer: for(const a of keys) for(const b of keys){
    let ok=true; for(let i=0;i<16;i++){const o=(a[i]==='1'||b[i]==='1')?'1':'0'; if(o!==t[i]){ok=false;break;}}
    if(ok){found=[reach.get(a),reach.get(b),a,b];break outer;}
  }
  if(found) console.log('  '+name+'  '+pat+'\n     ring A  N'+found[0].n+' K'+found[0].k+' rot'+found[0].rot+' dist'+found[0].dv+'   '+found[2].replace(/1/g,'x').replace(/0/g,'.')+
                        '\n     ring B  N'+found[1].n+' K'+found[1].k+' rot'+found[1].rot+' dist'+found[1].dv+'   '+found[3].replace(/1/g,'x').replace(/0/g,'.')+'  -> OR');
  else console.log('  '+name+': no OR solution');
}

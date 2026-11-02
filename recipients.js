// Recipients page: fills the dynamic parts of recipients.html
window.pageRender=()=>{
  const P=S.people,st=p=>p.chk||'unknown',n=k=>P.filter(p=>st(p)===k).length,T={good:'Good',bad:'Bad',unknown:'Not checked'};
  const list=pf==='all'?P:P.filter(p=>st(p)===pf);
  $('n-good').textContent=n('good')+' good';
  $('n-bad').textContent=n('bad')+' bad';
  $('n-unk').textContent=n('unknown')+' not checked';
  $('sw-bad').classList.toggle('on',!!S.sendBad);
  $('list-count').textContent=P.length;
  const cc=cleanCounts();$('n-temp').textContent=cc.temp+' found';$('n-dup').textContent=cc.dup+' found';$('n-inv').textContent=cc.inv+' found';
  document.querySelectorAll('#flt button').forEach(b=>b.classList.toggle('on',b.dataset.v===pf));
  const lim=window.plimit||100;$('p-list').innerHTML=list.slice(0,lim).map(p=>{const s=st(p);return `<div class="item"><div><b>${esc(p.email)}</b> <span class="tag ${s==='good'?'ok':s==='bad'?'bad':''}">${T[s]}</span><p>${esc([p.name,p.store].filter(Boolean).join(' \u00b7 '))}${sentSet().has(p.email)?' \u00b7 sent':''}${p.status==='optout'?' \u00b7 opted out':''}</p></div><div class="acts"><button class="btn" data-act="optout" data-id="${esc(p.email)}">Opt out</button><button class="btn d" data-act="delPerson" data-id="${esc(p.email)}">\u2715</button></div></div>`}).join('')||'<p class="sub" style="text-align:center;padding:24px 0">Nothing here yet.</p>'+(list.length>lim?`<button class="btn" data-act="moreP" style="width:100%;margin-top:10px;padding:12px">Show more (${list.length-lim} left)</button>`:'');
};
render();
document.addEventListener('change',async e=>{
  if(!e.target||e.target.id!=='p-file')return;
  const files=[...e.target.files];e.target.value='';
  if(!files.length)return;
  const EM=/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
  let a=0,d=0,skipped=0;
  for(const f of files){
    if(/\.(xlsx?|numbers|ods)$/i.test(f.name)){skipped++;toast('Save '+f.name+' as CSV first');continue}
    let t='';try{t=await f.text()}catch(err){skipped++;continue}
    for(const line of t.split(/\r?\n/)){
      const m=line.match(EM);if(!m)continue;
      const cols=line.split(/[,;\t]/).map(v=>v.trim().replace(/^"|"$/g,''));
      const first=(cols[0]||'').toLowerCase();
      if(m.length===1&&first===m[0].toLowerCase())addP(first,cols[1]&&!cols[1].includes('@')?cols[1]:'',cols[2]&&!cols[2].includes('@')?cols[2]:'')?a++:d++;
      else m.forEach(x=>addP(x.toLowerCase())?a++:d++);
    }
  }
  log('Imported '+a+' from file, skipped '+d+' duplicates');
  toast('Added '+a+' \u00b7 '+d+' duplicates'+(skipped?' \u00b7 '+skipped+' file(s) skipped':''));
  save();render();
});

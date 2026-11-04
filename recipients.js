// Recipients page: fills the dynamic parts of recipients.html
window.pageRender=()=>{
  const P=S.people,st=p=>p.chk||'unknown',n=k=>P.filter(p=>st(p)===k).length,T={good:'Good',bad:'Bad',unknown:'Not checked'};
  const list=pf==='all'?P:P.filter(p=>st(p)===pf);
  $('n-good').textContent=n('good')+' good';
  $('n-bad').textContent=n('bad')+' bad';
  $('n-unk').textContent=n('unknown')+' not checked';
  $('sw-bad').classList.toggle('on',!!S.sendBad);
  $('list-count').textContent=P.length;
  const cc=cleanCounts();$('n-temp').textContent=cc.temp+' found';$('n-dup').textContent=cc.dup+' found';$('n-inv').textContent=cc.inv+' found';$('n-biz').textContent=cc.biz+' found — not on the free email list';
  document.querySelectorAll('#flt button').forEach(b=>b.classList.toggle('on',b.dataset.v===pf));
  const lim=window.plimit||100;$('imp-msg').textContent=S.lastImport?'Last import: '+S.lastImport:'';$('p-list').innerHTML=list.slice().reverse().slice(0,lim).map(p=>{const s=st(p);return `<div class="item"><div><b>${esc(p.email)}</b> <span class="tag ${s==='good'?'ok':s==='bad'?'bad':''}">${T[s]}</span><p>${esc([p.name,p.store].filter(Boolean).join(' \u00b7 '))}${sentSet().has(p.email)?' \u00b7 sent':''}${p.status==='optout'?' \u00b7 opted out':''}</p></div><div class="acts"><button class="btn" data-act="optout" data-id="${esc(p.email)}">Opt out</button><button class="btn d" data-act="delPerson" data-id="${esc(p.email)}">\u2715</button></div></div>`}).join('')||'<p class="sub" style="text-align:center;padding:24px 0">Nothing here yet.</p>'+(list.length>lim?`<button class="btn" data-act="moreP" style="width:100%;margin-top:10px;padding:12px">Show more (${list.length-lim} left)</button>`:'');
};
render();
document.addEventListener('change',async e=>{
  if(!e.target||e.target.id!=='p-file')return;
  const files=[...e.target.files];e.target.value='';
  if(!files.length)return;
  let tot={a:0,inList:0,wasSent:0,bad:0},skipped=0;
  for(const f of files){
    if(/\.(xlsx?|numbers|ods)$/i.test(f.name)){skipped++;toast('Save '+f.name+' as CSV first');continue}
    let t='';try{t=await f.text()}catch(err){skipped++;continue}
    const r=importText(t);for(const k in tot)tot[k]+=r[k];
  }
  const msg=importMsg(tot)+(skipped?' \u00b7 '+skipped+' file(s) skipped':'');
  S.lastImport=msg;window.plimit=100;log('Imported from file: '+msg);toast(msg,5000);
  save();render();
});

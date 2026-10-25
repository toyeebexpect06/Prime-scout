// Recipients page: fills the dynamic parts of recipients.html
window.pageRender=()=>{
  const P=S.people,st=p=>p.chk||'unknown',n=k=>P.filter(p=>st(p)===k).length,T={good:'Good',bad:'Bad',unknown:'Not checked'};
  const list=pf==='all'?P:P.filter(p=>st(p)===pf);
  $('n-good').textContent=n('good')+' good';
  $('n-bad').textContent=n('bad')+' bad';
  $('n-unk').textContent=n('unknown')+' not checked';
  $('sw-bad').classList.toggle('on',!!S.sendBad);
  $('list-count').textContent=P.length;
  document.querySelectorAll('#flt button').forEach(b=>b.classList.toggle('on',b.dataset.v===pf));
  $('p-list').innerHTML=list.map(p=>{const s=st(p);return `<div class="item"><div><b>${esc(p.email)}</b> <span class="tag ${s==='good'?'ok':s==='bad'?'bad':''}">${T[s]}</span><p>${esc([p.name,p.store].filter(Boolean).join(' \u00b7 '))}${S.sent.includes(p.email)?' \u00b7 sent':''}${p.status==='optout'?' \u00b7 opted out':''}</p></div><div class="acts"><button class="btn" data-act="optout" data-id="${esc(p.email)}">Opt out</button><button class="btn d" data-act="delPerson" data-id="${esc(p.email)}">\u2715</button></div></div>`}).join('')||'<p class="sub" style="text-align:center;padding:24px 0">Nothing here yet.</p>';
};
render();

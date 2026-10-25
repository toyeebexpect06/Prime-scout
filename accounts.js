// Accounts page: fills the dynamic parts of accounts.html
window.pageRender=()=>{
  const g=S.groups||[],A=S.accs,op=S.opener||'app';
  document.querySelectorAll('.ob').forEach(b=>b.classList.toggle('on',b.dataset.v===op));
  $('acc-count').textContent=A.length;
  $('acc-list').innerHTML=A.map((a,i)=>`<div class="mrow" style="flex-wrap:wrap;margin-top:12px"><div class="num">${i+1}</div><div class="mt"><b>${esc(a.email)}</b><small>${sentToday(a.id)} sent \u00b7 ${pendingFor(a.id)} queued \u00b7 cap ${a.cap}</small></div><button class="sw ${a.on?'on':''}" data-act="togAcc" data-id="${a.id}" aria-label="Toggle account"></button><button class="trash" data-act="delAcc" data-id="${a.id}" aria-label="Delete account">\u2715</button><div class="row" style="flex-basis:100%"><div><label>Batch</label><select data-grp="${a.id}"><option value="">No batch</option>${g.map(x=>`<option value="${x.id}" ${a.group===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div><label>Daily cap</label><input type="number" min="1" value="${a.cap}" data-cap="${a.id}"></div></div></div>`).join('')||'<p class="sub" style="text-align:center;padding:30px 0 40px">No sending accounts yet.</p>';
  $('bk-box').innerHTML=A.length?`<select data-bk="1"><option value="">No backup</option>${A.map(a=>`<option value="${a.id}" ${S.backup===a.id?'selected':''}>${esc(a.email)}</option>`).join('')}</select>`:'<p class="sub" style="text-align:center;padding:24px 0">Add an account first.</p>';
};
render();

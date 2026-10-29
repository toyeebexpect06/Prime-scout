const TABS=['messages','accounts','batches','people','rotation','activity'];
const LABEL={messages:'Messages',accounts:'Accounts',batches:'Batches',people:'Recipients',rotation:'Rotation preview',activity:'Activity'};
const ROLE=/^(info|admin|support|sales|contact|hello|noreply|no-reply|postmaster|webmaster|abuse)@/i;
const DISPOSABLE=/@(mailinator|guerrillamail|10minutemail|tempmail|yopmail)\./i;
const MAIL=/^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEF={msgs:[
 {id:uid(),title:'Friendly intro',subject:'Quick idea for {store}',body:'Hi {name},\n\nI came across {store} and had a quick idea that could help you get more orders. Open to a short chat?\n\nThanks!',on:true},
 {id:uid(),title:'Value first',subject:'Noticed something on {store}',body:'Hi {name},\n\nI spotted a couple of quick wins on {store}. Happy to share them for free if useful.\n\nBest regards',on:true},
 {id:uid(),title:'Short follow-up',subject:'{store} — worth a look?',body:'Hello {name},\n\nShort note: I help store owners improve conversions. Want me to send a few ideas for {store}?\n\nCheers',on:true}],
 accs:[],people:[],batches:[],log:[],sent:[],rot:{m:0,a:0}};
let S;try{S=JSON.parse(localStorage.getItem('saba2')||'null')}catch(e){S=null}
S=S||DEF;
if(!S.v2){S.v2=1;S.rot.style='shuffle';S.rot.bag=[];S.msgs=[{id:uid(),title:'Message 1',subject:'Quick idea for {name}',body:'Hi {name},\n\nI had a quick idea that could help you get more orders. Open to a short chat?\n\nThanks!',on:true},{id:uid(),title:'Message 2',subject:'A thought about {name}',body:'Hello {name},\n\nI spotted a couple of quick wins for your store and would be happy to share them for free.\n\nBest regards',on:true},{id:uid(),title:'Message 3',subject:'{name} — worth a look?',body:'{name}, short note: I help store owners improve conversions. Want a few ideas?\n\nCheers',on:true}]}
const PAGES={messages:'index.html',accounts:'accounts.html',batches:'batches.html',people:'recipients.html',rotation:'rotation.html',activity:'activity.html'};
let tab=(window.SPA&&location.hash.slice(1))||document.body.dataset.page||'messages';if(!TABS.includes(tab))tab='messages';
const save=()=>{try{localStorage.setItem('saba2',JSON.stringify(S))}catch(e){}};
const toast=(m,ms)=>{const t=document.getElementById('toast');t.textContent=m;t.className='show';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',ms||2200)};
const log=m=>{S.log.unshift({t:Date.now(),m});S.log=S.log.slice(0,200)};
const today=()=>new Date().toDateString();
const sentToday=a=>S.batches.flatMap(b=>b.items).filter(i=>i.accId===a&&i.status==='sent'&&i.day===today()).length;
const queued=()=>new Set(S.batches.flatMap(b=>b.items).filter(i=>i.status==='pending').map(i=>i.email));
const ready=()=>{const q=queued();return S.people.filter(p=>p.status!=='optout'&&!S.sent.includes(p.email)&&!q.has(p.email)&&((p.chk||'unknown')!=='bad'||S.sendBad))};
const fill=(t,p)=>t.replace(/\{name\}/g,p.name||'there').replace(/\{store\}/g,p.store||'your store');
function pick(list,key,sim){const n=list.length;if(!n)return null;const i=sim[key]%n;sim[key]++;return list[i]}
function assign(people){
  const ms=S.msgs.filter(m=>m.on),as=S.accs.filter(a=>a.on&&(!S.activeGroup||a.group===S.activeGroup)),cg=(S.groups||[]).find(x=>x.id===S.activeGroup),allPend=S.batches.flatMap(b=>b.items).filter(i=>i.status==='pending'),left=a=>cg?cg.limit-((cg.counts||{})[a.id]||0)-allPend.filter(i=>i.grp===cg.id&&i.accId===a.id).length:Infinity;
  if((S.rot.style||'shuffle')==='shuffle'&&!(S.rot.bag||[]).length)S.rot.bag=ms.map(m=>m.id).sort(()=>Math.random()-.5);
  const sim={m:S.rot.m,a:S.rot.a,bag:(S.rot.bag||[]).slice()},out=[],used={};
  for(const p of people){
    const bk=S.accs.find(x=>x.id===S.backup),open=as.length?as.filter(a=>left(a)-(used[a.id]||0)>0):(bk?[bk]:[]);
    const a=pick(open,'a',sim);
    if(!a)break;
    const m=nextMsg(ms,sim);
    if(!m)break;used[a.id]=(used[a.id]||0)+1;out.push({p,a,m});
  }
  return{out,sim};
}
var ICO={messages:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',accounts:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',batches:'<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',people:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 010 7M18 14c2.5.7 4 2.5 4 6"/>',rotation:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>'};
function render(){
  document.body.dataset.page=tab;
  const r=ready(),sentN=S.sent.length;
  const SH={messages:'Messages',accounts:'Accounts',batches:'Batches',people:'People',rotation:'Rotation',activity:'Activity'},ICO={messages:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',accounts:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',batches:'<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',people:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 010 7M18 14c2.5.7 4 2.5 4 6"/>',rotation:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>'};
  const setQ=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  setQ('qh-ready',r.length);setQ('qh-ok',S.people.filter(p=>p.chk==='good').length);setQ('qh-bad',S.people.filter(p=>p.chk==='bad').length);
  document.querySelectorAll('[data-tab]').forEach(a=>{const on=a.dataset.tab===tab;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  const onM=S.msgs.filter(m=>m.on).length,onA=S.accs.filter(a=>a.on).length;
  const pend=queued().size,TAG={messages:'Manage the next move without losing track of anyone.',accounts:'Manage the next move without losing track of anyone.',batches:'Manage the next move without losing track of anyone.',people:'Manage the next move without losing track of anyone.',rotation:'Manage the next move without losing track of anyone.',activity:'A running record of every action.'};
  const stats=`<section class="hero"><div class="eyebrow">Operational workspace</div><h2>${LABEL[tab]}</h2><p class="sub">${TAG[tab]}</p><div class="stats"><div class="stat"><b>${S.msgs.length}</b><span>Bodies</span><i>${onM} on</i></div><div class="stat"><b>${S.accs.length}</b><span>Accounts</span><i>${onA} on</i></div><div class="stat"><b>${r.length}</b><span>People</span><i>${r.length} left</i></div><div class="stat"><b>${sentN}</b><span>Sent</span><i>${pend} to send</i></div></div></section>`;
  const nx=assign(r.slice(0,1)).out[0];
  const live=`<div class="card live"><div><b>Live rotation</b><p class="sub" style="margin:2px 0 0">${nx?`Next: ${esc(nx.p.email)} from ${esc(nx.a.email)} using ${esc(nx.m.title)}`:`Your queue is clear. Nothing waiting — ${sentN} sends are saved.`}</p></div><span class="tag ${onM&&onA?'ok':'warn'}">${onM&&onA?'Full rotation':'Setup needed'}</span></div><div class="card"><b>Duplicate protection active</b><p class="sub" style="margin:2px 0 0">Sent addresses stay out of the queue automatically.</p></div>`;
  const app=document.getElementById('app');
  if(app)app.innerHTML=stats+(tab==='messages'?dispatchCards():'')+views[tab]().replace(/^<h2>[^]*?<\/p>/,'');
  else{const s=document.getElementById('stats');if(s)s.innerHTML=stats.slice(stats.indexOf('<div class="stats">')).replace('</section>','');if(window.pageRender)window.pageRender()}
}
const views={
messages:()=>`<h2>Messages</h2><p class="sub">Bodies rotate evenly. Use {name} and {store} as placeholders.</p>
<div class="card"><label>Title</label><input id="m-title" placeholder="e.g. Friendly intro"><label>Subject</label><input id="m-sub" placeholder="Quick idea for {store}"><label>Body</label><textarea id="m-body" placeholder="Hi {name}, …"></textarea><div class="row" style="margin-top:10px"><button class="btn p" data-act="addMsg">Add message</button></div></div>
<div class="card">${S.msgs.map(m=>`<div class="item"><div><b>${esc(m.title)}</b> <span class="tag ${m.on?'ok':''}">${m.on?'On':'Off'}</span><p><i>${esc(m.subject)}</i>\n${esc(m.body)}</p></div><div class="acts"><button class="btn" data-act="togMsg" data-id="${m.id}">${m.on?'Pause':'Enable'}</button><button class="btn d" data-act="delMsg" data-id="${m.id}">Delete</button></div></div>`).join('')||'<div class="empty">No messages yet.</div>'}</div>`,
accounts:()=>`<h2>Accounts</h2><p class="sub">Sending accounts rotate evenly, each with a daily cap.</p>
<div class="card"><div class="row"><div><label>Email address</label><input id="a-email" type="email" placeholder="you@yourdomain.com"></div><div><label>Label</label><input id="a-label" placeholder="Main"></div></div><div class="row" style="margin-top:10px"><button class="btn p" data-act="addAcc">Add account</button></div></div>
<div class="card">${S.accs.map(a=>`<div class="item"><div><b>${esc(a.label||a.email)}</b> <span class="tag ${a.on?'ok':''}">${a.on?'On':'Off'}</span><p>${esc(a.email)} · ${sentToday(a.id)} sent today</p></div><div class="acts"><button class="btn" data-act="togAcc" data-id="${a.id}">${a.on?'Pause':'Enable'}</button><button class="btn d" data-act="delAcc" data-id="${a.id}">Delete</button></div></div>`).join('')||'<div class="empty">Add at least one account to start a batch.</div>'}</div>`,
people:()=>`<h2>Recipients</h2><p class="sub">Paste one per line: email, name, store. Bad addresses are filtered and anyone already sent is never added again.</p>
<div class="card"><textarea id="p-in" placeholder="jane@shop.com, Jane, Jane’s Candles"></textarea><div class="row" style="margin-top:10px"><button class="btn p" data-act="addPeople">Check &amp; add</button><button class="btn" data-act="approveAll">Approve all in review</button></div></div>
<div class="card scroll">${S.people.length?`<table><tr><th>Email</th><th>Name</th><th>Store</th><th>Status</th><th></th></tr>${S.people.map(p=>{const st=S.sent.includes(p.email)?'sent':p.status;return`<tr><td>${esc(p.email)}</td><td>${esc(p.name)}</td><td>${esc(p.store)}</td><td><span class="tag ${st==='verified'?'ok':st==='review'?'warn':''}">${st==='verified'?'Verified':st==='review'?'Needs review':st==='sent'?'Sent':'Opted out'}</span></td><td class="acts">${p.status==='review'?`<button class="btn" data-act="approve" data-id="${esc(p.email)}">Approve</button>`:''}<button class="btn" data-act="optout" data-id="${esc(p.email)}">Opt out</button><button class="btn d" data-act="delPerson" data-id="${esc(p.email)}">✕</button></td></tr>`}).join('')}</table>`:'<div class="empty">No recipients yet.</div>'}</div>`,
batches:()=>`<h2>Batches</h2><p class="sub">Create a batch from the ready queue. Each person gets the next message body and the next account in rotation.</p>
<div class="card"><div class="row"><div><label>Batch size</label><input id="b-n" type="number" value="10" min="1"></div><button class="btn p" data-act="mkBatch">Generate next sends</button></div></div>
${S.batches.map(b=>`<div class="card"><div class="item" style="border:0;padding-top:0"><div><b>${esc(b.name)}</b><p>${b.items.filter(i=>i.status==='sent').length}/${b.items.length} sent</p></div><button class="btn d" data-act="delBatch" data-id="${b.id}">Delete</button></div>${b.items.map(i=>{const a=S.accs.find(x=>x.id===i.accId),m=S.msgs.find(x=>x.id===i.msgId);return`<div class="item"><div>${esc(i.email)} <span class="tag ${i.status==='sent'?'ok':''}">${i.status}</span><p>From ${esc(a?a.email:'removed account')} · ${esc(m?m.title:'removed body')}</p></div>${i.status==='pending'?`<div class="acts"><a class="btn" data-act="open" data-b="${b.id}" data-id="${esc(i.email)}">Open mail</a><button class="btn" data-act="copy" data-b="${b.id}" data-id="${esc(i.email)}">Copy</button><button class="btn p" data-act="markSent" data-b="${b.id}" data-id="${esc(i.email)}">Mark sent</button></div>`:''}</div>`}).join('')}</div>`).join('')||'<div class="empty">No sends generated yet.</div>'}`,
rotation:()=>{const {out}=assign(ready().slice(0,10));return`<h2>Rotation preview</h2><p class="sub">What the next sends will look like, without committing anything.</p><div class="card scroll">${out.length?`<table><tr><th>#</th><th>To</th><th>From</th><th>Body</th></tr>${out.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.p.email)}</td><td>${esc(o.a.email)}</td><td>${esc(o.m.title)}</td></tr>`).join('')}</table>`:`<div class="empty">Your queue is clear. Add verified recipients, an account and a message body.</div>`}</div><div class="card"><b>Duplicate protection active</b><p class="sub" style="margin:2px 0 0">Sent addresses stay out of the queue automatically.</p></div>`},
activity:()=>`<h2>Activity</h2><p class="sub">Everything that happened, newest first.</p><div class="card">${S.log.map(l=>`<div class="item"><div>${esc(l.m)}</div><span class="tag">${new Date(l.t).toLocaleString()}</span></div>`).join('')||'<div class="empty">No activity yet.</div>'}</div><button class="btn d" data-act="reset">Reset all data</button>`
};
function nextMsg(ms,sim){if(!ms.length)return null;if((S.rot.style||'shuffle')==='order')return pick(ms,'m',sim);sim.bag=(sim.bag||[]).filter(id=>ms.some(m=>m.id===id));if(!sim.bag.length)sim.bag=ms.map(m=>m.id).sort(()=>Math.random()-.5);const id=sim.bag.shift();return ms.find(m=>m.id===id)}
const oldB=views.batches,oldR=views.rotation;
let gAdd=false;
views.rotation=()=>`<h2>Rotation preview</h2><p class="sub"></p>`+oldB().replace(/^<h2>[^]*?<\/p>/,'')+oldR().replace(/^<h2>[^]*?<\/p>/,'');
views.accounts=()=>{const g=S.groups||[];return `<h2>Accounts</h2><p class="sub"></p>
<div class="card"><div class="row"><div><label>Gmail address</label><input id="a-email" type="email" placeholder="you@gmail.com"></div><div><label>Label</label><input id="a-label" placeholder="Main"></div></div><div class="row" style="margin-top:10px"><button class="btn p" data-act="addAcc">Add account</button></div></div>
<div class="card">${S.accs.map(a=>`<div class="item"><div style="flex:1"><b>${esc(a.label||a.email)}</b> <span class="tag ${a.on?'ok':''}">${a.on?'On':'Off'}</span><p>${esc(a.email)} · ${sentToday(a.id)} sent today</p><label>Batch</label><select data-grp="${a.id}"><option value="">No batch</option>${g.map(x=>`<option value="${x.id}" ${a.group===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="acts"><button class="btn" data-act="togAcc" data-id="${a.id}">${a.on?'Pause':'Enable'}</button><button class="btn d" data-act="delAcc" data-id="${a.id}">Delete</button></div></div>`).join('')||'<div class="empty">Add at least one account to start.</div>'}</div>`};
views.batches=()=>{const g=S.groups||[],act=S.activeGroup,cur=g.find(x=>x.id===act),ga=cur?S.accs.filter(a=>a.on&&a.group===cur.id):[],full=cur&&ga.length>0&&ga.every(a=>((cur.counts||{})[a.id]||0)>=cur.limit);return `<h2>Batches</h2><p class="sub"></p>
<div class="card"><b style="font-size:22px">Account batches</b><p class="sub" style="margin:6px 0 14px">Each batch has its own accounts. The send limit applies to every account separately. Tap a batch to see its accounts and progress; only the active batch sends.</p>
<div class="row"><button class="btn ${act?'':'p'}" data-act="grpAll">All accounts</button><button class="btn" data-act="grpAdd" style="border:0;background:none">＋ Add batch</button></div>
${gAdd?`<div class="row" style="margin:10px 0"><div><label>Send limit per account, per round</label><input id="g-lim" type="number" value="50" min="1"></div><button class="btn p" data-act="grpSave">Save batch</button></div>`:''}
${g.map(x=>{const n=S.accs.filter(a=>a.group===x.id);return `<div class="mrow" style="margin-top:10px;${x.id===act?'border-color:var(--brand)':''}"><div class="mt" data-act="grpPick" data-id="${x.id}" style="cursor:pointer"><b>${esc(x.name)} ${x.id===act?'<span class="tag ok">Active</span>':''}</b><small>${n.length} accounts · ${x.limit} per account · ${x.count} sent</small>${n.length?`<small>${n.map(a=>esc(a.email)+' '+((x.counts||{})[a.id]||0)+'/'+x.limit).join(' · ')}</small>`:''}</div><button class="trash" data-act="grpDel" data-id="${x.id}" aria-label="Delete batch">✕</button></div>`}).join('')||'<p class="sub" style="text-align:center;padding:24px 0 30px">No batches yet — add one to group your Gmail accounts.</p>'}
${full?`<button class="btn p" data-act="grpNext" style="width:100%;margin-top:12px">Switch to next batch</button>`:''}</div>
<div class="card"><b style="font-size:22px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/></svg> How batches work</b><p class="sub" style="margin:8px 0 14px">A batch is a group of Gmail accounts. Only the active batch sends, so you can rest one group and run another.</p>
<p><b>1.</b> Group accounts into batches in the Accounts tab — each Gmail has a batch box under it.</p>
<p><b>2.</b> Tap a batch above to switch it on. Sends then move only between its accounts.</p>
<p><b>3.</b> Every account sends up to the limit. When all accounts in the batch have reached it, tap <b>Switch to next batch</b>. It never switches by itself.</p>
<p><b>4.</b> Any batch can be reused — tap Batch 1 again whenever you want and its count starts fresh. After the last batch, the next one is Batch 1.</p>
${g.length?'':'<small class="sub">No batches yet — add one above to get started.</small>'}</div>`};
views.rotation=()=>{const ms=S.msgs,lbl=m=>'Message '+(ms.findIndex(x=>x.id===m.id)+1);
const pend=S.batches.flatMap(b=>b.items).filter(i=>i.status==='pending').map(i=>({e:i.email,a:(S.accs.find(x=>x.id===i.accId)||{}).email,m:ms.find(x=>x.id===i.msgId)}));
const up=assign(ready().slice(0,10)).out.map(o=>({e:o.p.email,a:o.a.email,m:o.m})),rows=pend.concat(up).slice(0,10);
return `<h2>Rotation preview</h2><p class="sub"></p>
<div class="card" style="padding:20px 18px"><b style="font-size:22px"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Who gets which message</b><p class="sub" style="margin:8px 0 14px">The exact order your next sends will follow.</p>
${rows.length?rows.map((r,i)=>`<div class="mrow"><div class="num">${i+1}</div><div class="mt"><b>${esc(r.e)}</b><small>From ${esc(r.a||'removed account')} · ${r.m?lbl(r.m):'removed body'}</small></div></div>`).join(''):'<p class="sub" style="text-align:center;padding:30px 0 40px;font-size:18px">Nothing queued up yet.</p>'}</div>`+oldB().replace(/^<h2>[^]*?<\/p>/,'')};
const GEN=/^(owner|info|admin|support|sales|contact|hello|hi|team|shop|store|office|mail|enquiries|enquiry|service|orders)$/i,cap=s=>s?s[0].toUpperCase()+s.slice(1).toLowerCase():'';
const PERS=/^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|aol|proton|protonmail|gmx|zoho|mail|yandex|rocketmail)$/i,GEN2=/^(owner|info|admin|support|sales|contact|hello|hi|hey|team|shop|store|office|mail|enquiries|enquiry|service|orders|help|care|customerservice|customercare|billing|press|marketing|hr)$/i;
function derive(e){const[l,d]=e.split('@'),dom=(d||'').split('.')[0],t=l.split(/[._\-+\d]+/).filter(Boolean).find(x=>!GEN2.test(x)&&!/^(customer|client|accounts|booking|bookings|web|webmaster|noreply|no|reply|the)$/i.test(x))||'';if(PERS.test(dom))return{name:cap(t),store:''};return{name:t?cap(t):cap(dom),store:cap(dom)}}
function chkAddr(e){const d=(e.split('@')[1]||'').toLowerCase();if(!MAIL.test(e)||DISPOSABLE.test(e)||/\.\./.test(e)||/^(noreply|no-reply|postmaster|abuse|mailer-daemon)@/i.test(e))return'bad';if(/^(gmial|gmal|gamil|hotmial|yaho|outlok)\./.test(d)||/\.(con|cmo|coom)$/.test(d)||d==='gmail.co')return'bad';return'good'}
function addP(e,n,s){if(S.sent.includes(e)||S.people.some(p=>p.email===e))return false;const v=derive(e);S.people.push({email:e,name:n||v.name,store:s||v.store,status:'ok',chk:'unknown'});return true}
let pf='all';
views.people=()=>{const P=S.people,st=p=>p.chk||'unknown',n=k=>P.filter(p=>st(p)===k).length,list=pf==='all'?P:P.filter(p=>st(p)===pf),T={good:'Good',bad:'Bad',unknown:'Not checked'};
return `<h2>Recipients</h2><p class="sub"></p>
<div class="card"><b style="font-size:22px">Add a store owner</b><label style="font-size:16px;color:var(--ink);margin-top:18px">Email</label><input id="p-one" type="email" placeholder="owner@store.com"><button class="btn p" data-act="addOne" style="width:100%;margin-top:14px;padding:14px">＋ Add recipient</button></div>
<div class="card"><b style="font-size:22px">Paste a list</b><p class="sub" style="margin:8px 0 14px">One email per line — names are worked out for you, duplicates are skipped.</p><textarea id="p-in" style="min-height:140px" placeholder="ada@adasshop.com&#10;owner@brightsneakers.co"></textarea><button class="btn" data-act="importList" style="width:100%;margin-top:14px;padding:14px">Import list</button></div>
<div class="card"><b style="font-size:22px"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>Check the addresses</b><p class="sub" style="margin:8px 0 14px">We sort out the addresses that can’t receive mail so you only send to the good ones.</p>
<div class="row" style="gap:10px;margin-bottom:14px"><span class="chip g" style="flex:0 0 auto">${n('good')} good</span><span class="chip b" style="flex:0 0 auto">${n('bad')} bad</span><span class="chip u" style="flex:0 0 auto">${n('unknown')} not checked</span></div>
<button class="btn p" data-act="checkAll" style="padding:14px 18px"><svg class="ic" viewBox="0 0 24 24" style="width:20px;height:20px;vertical-align:-4px;margin-right:8px"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>Check unverified addresses</button>
<div class="mrow" style="margin:14px 0 0"><div class="mt"><b>Also send to bad addresses</b><small style="white-space:normal">Off by default — turn on if you want to try them anyway.</small></div><button class="sw ${S.sendBad?'on':''}" data-act="togBad" aria-label="Also send to bad addresses"></button></div></div>
<div class="card"><div class="row" style="justify-content:space-between"><b style="font-size:22px;flex:0 0 auto"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px">${ICO.people}</svg>Your list (${P.length})</b><button data-act="clearAll" style="flex:0 0 auto;border:0;background:none;color:var(--mute);font:inherit;cursor:pointer">Clear all</button></div>
<div class="seg g" style="margin:14px 0">${[['all','All'],['good','Good'],['bad','Bad'],['unknown','Unknown']].map(([k,l])=>`<button class="${k===pf?'on':''}" data-act="setPf" data-v="${k}">${l}</button>`).join('')}</div>
${list.map(p=>{const s=st(p);return `<div class="item"><div><b>${esc(p.email)}</b> <span class="tag ${s==='good'?'ok':s==='bad'?'bad':''}">${T[s]}</span><p>${esc([p.name,p.store].filter(Boolean).join(' · '))}${S.sent.includes(p.email)?' · sent':''}${p.status==='optout'?' · opted out':''}</p></div><div class="acts"><button class="btn" data-act="optout" data-id="${esc(p.email)}">Opt out</button><button class="btn d" data-act="delPerson" data-id="${esc(p.email)}">✕</button></div></div>`}).join('')||'<p class="sub" style="text-align:center;padding:24px 0">Nothing here yet.</p>'}</div>`};
views.accounts=()=>{const g=S.groups||[],op=S.opener||'app',A=S.accs;
return `<h2>Accounts</h2><p class="sub"></p>
<div class="card"><b style="font-size:22px"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px">${ICO.accounts}</svg>Your sending accounts</b><p class="sub" style="margin:8px 0 14px">Add every Gmail address you send from. Sends are shared out evenly between the accounts that are switched on.</p>
<div class="note">On a phone, sending opens the Gmail app with the message ready. Gmail composes from the account it is currently on, so if the wrong address shows in the From line, tap it and pick the one the app named for that send.</div>
<div class="note"><b style="font-size:12px;letter-spacing:.06em">SEND BUTTON OPENS</b><div class="row" style="gap:8px;margin:10px 0">${[['app','Gmail app'],['go','Gmail Go'],['browser','Gmail in browser']].map(([k,l])=>`<button class="btn ${k===op?'p':''}" data-act="setOpen" data-v="${k}" style="${k===op?'':'border:0;background:none;'}flex:0 0 auto;padding:12px 18px;font-size:16px">${l}</button>`).join('')}</div><span>Your choice is remembered. Gmail Go loads faster on some phones; the browser version can target the exact account named for each send.</span></div>
<div class="row" style="flex-wrap:nowrap"><input id="a-email" type="email" placeholder="you@gmail.com" style="min-width:0"><button class="btn p" data-act="addAcc" style="padding:14px 18px;flex:0 0 auto">＋ Add</button></div><p class="sub" style="margin:18px 0 8px">Or paste several, one address per line.</p><textarea id="a-bulk" style="min-height:110px" placeholder="you@gmail.com&#10;second@gmail.com"></textarea><button class="btn" data-act="addAccBulk" style="width:100%;margin-top:12px;padding:14px">Add all accounts</button></div>
<div class="card"><b style="font-size:22px">Accounts (${A.length})</b>${A.map((a,i)=>`<div class="mrow" style="flex-wrap:wrap;margin-top:12px"><div class="num">${i+1}</div><div class="mt"><b>${esc(a.email)}</b><small>${sentToday(a.id)} sent · ${pendingFor(a.id)} queued</small></div><button class="sw ${a.on?'on':''}" data-act="togAcc" data-id="${a.id}" aria-label="Toggle account"></button><button class="trash" data-act="delAcc" data-id="${a.id}" aria-label="Delete account">✕</button><div class="row" style="flex-basis:100%"><div><label>Batch</label><select data-grp="${a.id}"><option value="">No batch</option>${g.map(x=>`<option value="${x.id}" ${a.group===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div><button class="btn" data-act="openGmail" data-id="${a.id}" style="flex-basis:100%">Open Gmail</button></div>`).join('')||'<p class="sub" style="text-align:center;padding:30px 0 40px">No sending accounts yet.</p>'}</div>
<div class="card"><b style="font-size:22px">Backup account</b><p class="sub" style="margin:8px 0 14px">If the account whose turn it is has been switched off, the app sends from this one instead, so the run never stops.</p>${A.length?`<select data-bk="1"><option value="">No backup</option>${A.map(a=>`<option value="${a.id}" ${S.backup===a.id?'selected':''}>${esc(a.email)}</option>`).join('')}</select>`:'<p class="sub" style="text-align:center;padding:24px 0">Add an account first.</p>'}</div>`};

function dState(){
  if(!S.accs.some(a=>a.on&&(!S.activeGroup||a.group===S.activeGroup))&&!S.accs.some(a=>a.id===S.backup))return{msg:S.accs.length?'Switch on a sending account first.':'Add a sending account first.'};
  if(!S.msgs.some(m=>m.on))return{msg:'Switch on a message first.'};
  const nx=assign(ready().slice(0,1)).out[0];
  if(!nx)return{msg:ready().length?'Every account in the active batch has reached its send limit.':'Add a recipient first.'};
  return{nx};
}
function dispatchCards(){
  const d=dState(),nx=d.nx,ms=S.msgs,pend=S.batches.flatMap(b=>b.items.map(i=>({b:b.id,i}))).filter(x=>x.i.status==='pending');
  const body=nx?`<p style="margin:12px 0 0"><b>To ${esc(nx.p.email)}</b><br><span class="sub">From ${esc(nx.a.email)} · Message ${ms.findIndex(x=>x.id===nx.m.id)+1}</span></p><p style="margin:10px 0 0"><b>${esc(fill(nx.m.subject,nx.p))}</b></p><p class="sub" style="white-space:pre-wrap;margin:4px 0 14px;max-height:110px;overflow:hidden">${esc(fill(nx.m.body,nx.p))}</p>`:`<p class="sub" style="font-size:18px;margin:14px 0 44px">${d.msg}</p>`;
  const off=nx?'':' disabled';
  const saved=pend.length?`<p class="sub" style="margin:8px 0 6px">${pend.length} waiting — ${S.sent.length===1?'1 send is':S.sent.length+' sends are'} saved.</p>${pend.map(x=>{const a=S.accs.find(y=>y.id===x.i.accId);return `<div class="item"><div><b>${esc(x.i.email)}</b><p>From ${esc(a?a.email:'removed account')}</p></div><div class="acts"><button class="btn p" data-act="markSent" data-b="${x.b}" data-id="${esc(x.i.email)}">Mark sent</button><button class="btn" data-act="putBack" data-b="${x.b}" data-id="${esc(x.i.email)}">Put back</button></div></div>`}).join('')}`:`<p class="sub" style="font-size:18px;margin:14px 0 44px">Nothing waiting — ${S.sent.length===1?'1 send is':S.sent.length+' sends are'} saved.</p>`;
  return `<div class="card dispatch"><b class="ct"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px"><circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><path d="M12 7v1M7 12h1"/></svg>Next dispatch</b>${body}<div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="skipOne" style="flex:0 0 auto;border:0;background:none;color:var(--mute);padding:14px 18px"${off}>Skip</button><button class="btn p" data-act="sendOne" style="flex:1;padding:14px"${off}><svg class="ic" viewBox="0 0 24 24" style="width:20px;height:20px;vertical-align:-4px;margin-right:8px"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>Send this one</button></div></div>
<div class="card saved"><b class="ct"><svg class="ic" viewBox="0 0 24 24" style="color:var(--brand);vertical-align:-4px;margin-right:8px"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>Saved place</b>${saved}</div>`;
}
let addOpen=false,ex=null;
views.messages=()=>{const st=S.rot.style||'shuffle';return `<h2>Messages</h2><p class="sub"></p>
<div class="card"><b><span style="color:var(--brand)">⇄</span> Rotation style</b><p class="sub" style="margin:4px 0 0">How the next message and account are picked.</p>
<button class="opt ${st==='order'?'on':''}" data-act="setStyle" data-v="order"><b>In order</b><small>Message 1, then 2, then 3, then back to 1.</small></button>
<button class="opt ${st==='shuffle'?'on':''}" data-act="setStyle" data-v="shuffle"><b>Shuffled</b><small>Random order, but everything is used equally often.</small></button></div>
${S.msgs.map((m,i)=>`<div class="mrow"><div class="num">${i+1}</div><div class="mt" data-act="expand" data-id="${m.id}" style="cursor:pointer"><b>Message ${i+1}</b><small>${esc(m.subject)}</small></div><button class="sw ${m.on?'on':''}" data-act="togMsg" data-id="${m.id}" aria-label="Toggle message"></button><button class="trash" data-act="delMsg" data-id="${m.id}" aria-label="Delete message"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>${ex===m.id?`<div class="card"><label>Subject</label><input id="e-sub" value="${esc(m.subject)}"><label>Body</label><textarea id="e-body">${esc(m.body)}</textarea><div class="row" style="margin-top:10px"><button class="btn p" data-act="saveMsg" data-id="${m.id}">Save</button></div></div>`:''}`).join('')}
${addOpen?`<div class="card"><label>Subject</label><input id="m-sub" placeholder="Quick idea for {name}"><label>Body</label><textarea id="m-body" placeholder="Hi {name}, …"></textarea><div class="row" style="margin-top:10px"><button class="btn p" data-act="addMsg">Add message</button></div></div>`:''}
<button class="addb" data-act="showAdd">＋ Add another message body</button>`};
let rng='week';
views.activity=()=>{const ts=S.batches.flatMap(b=>b.items).filter(i=>i.ts).map(i=>i.ts),now=new Date(),b=[];
if(rng==='year'){for(let k=11;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);b.push({l:d.toLocaleDateString('en',{month:'short'}),n:ts.filter(t=>{const x=new Date(t);return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()}).length})}}
else{const days=rng==='week'?7:30;for(let k=days-1;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-k);b.push({l:rng==='week'?d.toLocaleDateString('en',{weekday:'short'}):(k%5===0?d.getDate():''),n:ts.filter(t=>new Date(t).toDateString()===d.toDateString()).length})}}
const tot=b.reduce((s,x)=>s+x.n,0),mx=Math.max(1,...b.map(x=>x.n)),nx=assign(ready().slice(0,1)).out[0],R={week:'This Week',month:'This Month',year:'This Year'};
const pv=nx?`<div class="card"><b>Preview</b><p class="sub" style="margin:2px 0 10px">To ${esc(nx.p.email)} · From ${esc(nx.a.email)}</p><b>${esc(fill(nx.m.subject,nx.p))}</b><p style="white-space:pre-wrap;margin:6px 0 0">${esc(fill(nx.m.body,nx.p))}</p></div>`:`<div class="card" style="text-align:center;padding:30px 14px"><b style="font-size:20px">No Preview</b><p class="sub" style="margin:6px 0 0">Import emails and generate to preview</p></div>`;
return `<h2>Activity</h2><p class="sub"></p>${pv}
<div class="card"><div class="row" style="justify-content:space-between"><b style="font-size:18px;flex:0 0 auto"><span style="color:#7c3aed">▇</span> Activity Overview</b><div class="seg" style="flex:0 0 auto">${['week','month','year'].map(r=>`<button class="${r===rng?'on':''}" data-act="setRange" data-v="${r}">${r[0].toUpperCase()+r.slice(1)}</button>`).join('')}</div></div>
<div class="tot"><span class="sub">Total Scouted (${R[rng]})</span><b>${tot}</b></div>
<div class="chart">${b.map(x=>`<div class="col" title="${x.n}"><div class="bar" style="height:${x.n/mx*100}%"></div></div>`).join('')}</div><div class="lbls">${b.map(x=>`<span>${x.l}</span>`).join('')}</div>
<p style="margin:14px 0 0"><span class="dot"></span>Scouted</p></div>
<div class="card">${S.log.map(l=>`<div class="item"><div>${esc(l.m)}</div><span class="tag">${new Date(l.t).toLocaleString()}</span></div>`).join('')||'<div class="empty">No activity yet.</div>'}</div><button class="btn d" data-act="reset">Reset all data</button>`};
const $=id=>document.getElementById(id);
const find=(b,e)=>{const bt=S.batches.find(x=>x.id===b);return[bt,bt&&bt.items.find(i=>i.email===e)]};
const acts={
addMsg(){const t=$('m-title').value.trim(),b=$('m-body').value.trim();if(!t||!b)return toast('Add a title and body');S.msgs.push({id:uid(),title:t,subject:$('m-sub').value.trim(),body:b,on:true});log('Added message “'+t+'”')},
togMsg(d){const m=S.msgs.find(x=>x.id===d.id);m.on=!m.on},
delMsg(d){S.msgs=S.msgs.filter(x=>x.id!==d.id)},
addAcc(){const e=$('a-email').value.trim();if(!MAIL.test(e))return toast('Enter a valid email');if(S.accs.some(a=>a.email===e))return toast('Account already added');S.accs.push({id:uid(),email:e,label:$('a-label').value.trim(),cap:Math.max(1,+$('a-cap').value||40),on:true});log('Added account '+e);if($('a-email'))$('a-email').value=''},
togAcc(d){const a=S.accs.find(x=>x.id===d.id);a.on=!a.on},
delAcc(d){S.accs=S.accs.filter(x=>x.id!==d.id)},
addPeople(){let add=0,dup=0,bad=0,rev=0;
 $('p-in').value.split('\n').forEach(line=>{if(!line.trim())return;const[e,n,s]=line.split(',').map(x=>x.trim());const email=(e||'').toLowerCase();
  if(!MAIL.test(email)||DISPOSABLE.test(email)){bad++;return}
  if(S.sent.includes(email)||S.people.some(p=>p.email===email)){dup++;return}
  const r=ROLE.test(email);if(r)rev++;S.people.push({email,name:n||'',store:s||'',status:r?'review':'verified'});add++});
 log(`Imported ${add} (${rev} need review), skipped ${dup} duplicates and ${bad} invalid`);toast(`Added ${add} · ${dup} duplicates · ${bad} invalid`)},
approve(d){S.people.find(p=>p.email===d.id).status='verified'},
approveAll(){S.people.forEach(p=>{if(p.status==='review')p.status='verified'})},
optout(d){S.people.find(p=>p.email===d.id).status='optout';log('Opted out '+d.id)},
delPerson(d){S.people=S.people.filter(p=>p.email!==d.id)},
mkBatch(){if(!S.msgs.some(m=>m.on))return toast('Turn on a message body');if(!S.accs.some(a=>a.on&&(!S.activeGroup||a.group===S.activeGroup))&&!S.accs.some(a=>a.id===S.backup))return toast(S.activeGroup?'The active batch has no accounts switched on':'Add an active account');
 const{out,sim}=assign(ready().slice(0,Math.max(1,+$('b-n').value||10)));if(!out.length)return toast('Nothing ready, or the batch limit is reached');
 S.rot.m=sim.m;S.rot.a=sim.a;S.rot.bag=sim.bag||[];S.batches.unshift({id:uid(),name:'Send queue '+new Date().toLocaleString(),items:out.map(o=>({email:o.p.email,accId:o.a.id,msgId:o.m.id,grp:S.activeGroup||null,status:'pending'}))});log('Created batch of '+out.length)},
delBatch(d){S.batches=S.batches.filter(x=>x.id!==d.id)},
markSent(d){const[,i]=find(d.b,d.id);i.status='sent';i.day=today();i.ts=Date.now();const gg=(S.groups||[]).find(x=>x.id===i.grp);if(gg){gg.count++;gg.counts=gg.counts||{};gg.counts[i.accId]=(gg.counts[i.accId]||0)+1}if(!S.sent.includes(i.email))S.sent.push(i.email);log('Sent to '+i.email)},
copy(d){const t=compose(d);navigator.clipboard&&navigator.clipboard.writeText(t.subject+'\n\n'+t.body).then(()=>toast('Copied'),()=>toast('Copy blocked'))},
open(d){const t=compose(d);location.href='mailto:'+encodeURIComponent(d.id)+'?subject='+encodeURIComponent(t.subject)+'&body='+encodeURIComponent(t.body)},
reset(){if(confirm('Erase everything?')){S=JSON.parse(JSON.stringify(DEF));S.msgs.forEach(m=>m.id=uid())}}
};
function compose(d){const[,i]=find(d.b,d.id),m=S.msgs.find(x=>x.id===i.msgId)||{subject:'',body:''},p=S.people.find(x=>x.email===i.email)||{};return{subject:fill(m.subject,p),body:fill(m.body,p)}}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tab]');if(t){if(window.SPA){e.preventDefault();tab=t.dataset.tab;history.replaceState(null,'','#'+tab);window.scrollTo(0,0);render()}return}
 const a=e.target.closest('[data-act]');if(!a)return;e.preventDefault();
 try{acts[a.dataset.act](a.dataset)}catch(err){toast('Something went wrong')}
 save();render();
});
Object.assign(acts,{setStyle(d){S.rot.style=d.v;S.rot.bag=[]},showAdd(){addOpen=!addOpen},expand(d){ex=ex===d.id?null:d.id},saveMsg(d){const m=S.msgs.find(x=>x.id===d.id),s=$('e-sub').value.trim(),b=$('e-body').value.trim();if(!s||!b)return toast('Add a subject and body');m.subject=s;m.body=b;ex=null;log('Edited a message body')},addMsg(){const s=$('m-sub').value.trim(),b=$('m-body').value.trim();if(!s||!b)return toast('Add a subject and body');S.msgs.push({id:uid(),title:'Message '+(S.msgs.length+1),subject:s,body:b,on:true});addOpen=false;S.rot.bag=[];log('Added a message body')}});
acts.setRange=d=>{rng=d.v};
Object.assign(acts,{addAccBulk(){const el=$('a-bulk'),seen=new Set(S.accs.map(a=>a.email));let n=0,dup=0,bad=0;
  (el?el.value:'').split('\n').forEach(l=>{if(!l.trim())return;const m=l.match(/[^\s,;<>"']+@[^\s,;<>"']+/g);if(!m){bad++;return}
    m.forEach(e=>{e=e.toLowerCase();if(!MAIL.test(e)){bad++;return}if(seen.has(e)){dup++;return}seen.add(e);S.accs.push({id:uid(),email:e,label:'',cap:40,on:true});n++})});
  if(el)el.value='';log(`Added ${n} accounts, skipped ${dup} duplicates and ${bad} invalid`);toast(`Added ${n} \u00b7 ${dup} duplicates \u00b7 ${bad} invalid`,3500)}});
Object.assign(acts,{skipOne(){const r=ready();if(r.length<2)return toast('Nothing else to skip to');const i=S.people.findIndex(p=>p.email===r[0].email),[p]=S.people.splice(i,1);S.people.push(p);log('Skipped '+p.email)},sendOne(){const s=dState();if(!s.nx)return toast(s.msg);const pr=JSON.stringify(S.rot),{out,sim}=assign(ready().slice(0,1)),o=out[0],b={id:uid(),name:'Send queue '+new Date().toLocaleString(),items:[{email:o.p.email,accId:o.a.id,msgId:o.m.id,grp:S.activeGroup||null,status:'pending'}]};S.rot.m=sim.m;S.rot.a=sim.a;S.rot.bag=sim.bag||[];S.batches.unshift(b);log('Opened send to '+o.p.email);const d={b:b.id,id:o.p.email};acts.open(d,()=>{acts.markSent(d);save();render();toast('Marked as sent — Gmail should show From: '+(S.accs.find(x=>x.id===b.items[0].accId)||o.a).email,5000)},()=>{acts.putBack(d);S.rot=JSON.parse(pr);save();render()})},putBack(d){const[b,i]=find(d.b,d.id);b.items=b.items.filter(x=>x!==i);if(!b.items.length)S.batches=S.batches.filter(x=>x!==b);log('Put back '+d.id)}});
function pendingFor(id){return S.batches.flatMap(b=>b.items).filter(i=>i.status==='pending'&&i.accId===id).length}
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const id=e.target.id;if(id==='a-email'||id==='p-one'){e.preventDefault();acts[id==='a-email'?'addAcc':'addOne']();save();render()}});
function effAcc(i){const a=S.accs.find(x=>x.id===i.accId);if(a&&a.on)return a;return S.accs.find(x=>x.id===S.backup)||a}
Object.assign(acts,{setOpen(d){S.opener=d.v},addAcc(){const e=$('a-email').value.trim().toLowerCase();if(!MAIL.test(e))return toast('Enter a valid email');if(S.accs.some(a=>a.email===e))return toast('Account already added');S.accs.push({id:uid(),email:e,label:'',cap:40,on:true});log('Added account '+e);if($('a-email'))$('a-email').value=''},delAcc(d){S.accs=S.accs.filter(x=>x.id!==d.id);if(S.backup===d.id)S.backup=null}});
const _ms=acts.markSent;acts.markSent=d=>{const[,i]=find(d.b,d.id),e=effAcc(i);if(e)i.accId=e.id;_ms(d)};
document.addEventListener('change',e=>{const c=e.target.closest('[data-cap]');if(c){S.accs.find(x=>x.id===c.dataset.cap).cap=Math.max(1,+c.value||40);save();render();return}const b=e.target.closest('[data-bk]');if(b){S.backup=b.value||null;save();render()}});
Object.assign(acts,{addOne(){const e=$('p-one').value.trim().toLowerCase();if(!/\S+@\S+/.test(e))return toast('Enter an email');if(addP(e)){log('Added '+e);toast('Added');$('p-one').value=''}else toast('Already on your list')},importList(){let a=0,d=0,x=0;$('p-in').value.split('\n').forEach(l=>{if(!l.trim())return;const[e,n,s]=l.split(',').map(v=>v.trim());if(!/\S+@\S+/.test(e||'')){x++;return}addP(e.toLowerCase(),n,s)?a++:d++});if($('p-in'))$('p-in').value='';log(`Imported ${a}, skipped ${d} duplicates and ${x} lines`);toast(`Added ${a} · ${d} duplicates · ${x} skipped`)},checkAll(){let c=0;S.people.forEach(p=>{if((p.chk||'unknown')==='unknown'){p.chk=chkAddr(p.email);c++}});log('Checked '+c+' addresses');toast(c?'Checked '+c:'Nothing to check')},togBad(){S.sendBad=!S.sendBad},clearAll(){if(confirm('Remove everyone from the list?')){S.people=[];log('Cleared the list')}},setPf(d){pf=d.v}});
Object.assign(acts,{grpAll(){S.activeGroup=null},grpAdd(){gAdd=!gAdd},grpSave(){S.groups=S.groups||[];S.groups.push({id:uid(),name:'Batch '+(S.groups.length+1),limit:Math.max(1,+$('g-lim').value||50),count:0,counts:{}});gAdd=false;log('Added batch '+S.groups.length)},grpPick(d){const x=S.groups.find(g=>g.id===d.id);S.activeGroup=x.id;x.count=0;x.counts={};log(x.name+' switched on, count starts fresh')},grpNext(){const g=S.groups,i=g.findIndex(x=>x.id===S.activeGroup),x=g[(i+1)%g.length];S.activeGroup=x.id;x.count=0;x.counts={};log('Switched to '+x.name)},grpDel(d){S.groups=S.groups.filter(x=>x.id!==d.id);S.accs.forEach(a=>{if(a.group===d.id)a.group=null});if(S.activeGroup===d.id)S.activeGroup=null}});
document.addEventListener('change',e=>{const s=e.target.closest('[data-grp]');if(!s)return;S.accs.find(x=>x.id===s.dataset.grp).group=s.value||null;save();render()});
function askFrom(email,ok,no){
  if(!document.getElementById('modal-css')){const s=document.createElement('style');s.id='modal-css';s.textContent='.modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:50;padding:16px}.mbox{background:var(--card);color:var(--ink);border-radius:14px;padding:18px;max-width:420px;width:100%}.mbox p{color:var(--mute);margin:8px 0 14px}';document.head.appendChild(s)}
  const o=document.createElement('div');o.className='modal';
  o.innerHTML=`<div class="mbox"><b style="font-size:18px">Send from ${esc(email)}</b><p>Gmail writes from the account it is currently on. If the From line shows a different address, tap it and pick <b>${esc(email)}</b>. The address is copied for you.</p><div class="row"><button class="btn" data-m="no">Cancel</button><button class="btn p" data-m="ok">Open Gmail</button></div></div>`;
  document.body.appendChild(o);
  try{navigator.clipboard&&navigator.clipboard.writeText(email).catch(()=>{})}catch(e){}
  o.onclick=e=>{const m=e.target.dataset.m;if(!m)return;o.remove();if(m==='ok')ok();else if(no)no()};
}
function gUrl(email,m){const q=encodeURIComponent;return m?`https://mail.google.com/mail/?view=cm&fs=1&authuser=${q(email)}&to=${q(m.to)}&su=${q(m.su)}&body=${q(m.body)}`:`https://mail.google.com/mail/?authuser=${q(email)}`}
function launchUrl(u,tab){const l=document.createElement('a');l.href=u;if(tab){l.target='_blank';l.rel='noopener'}document.body.appendChild(l);l.click();l.remove()}
function gmailLaunch(email,mode,m){
  if(!MAIL.test(email||''))return null;
  const web=gUrl(email,m);
  if(mode==='browser'||!/Android/i.test(navigator.userAgent)){launchUrl(web,true);return web}
  const q=encodeURIComponent,pkg=mode==='go'?'com.google.android.gm.lite':'com.google.android.gm',
    u=`intent:mailto:${q(m?m.to:'').replace(/%40/g,'@')}?subject=${q(m?m.su:'')}&body=${q(m?m.body:'')}#Intent;action=android.intent.action.SENDTO;package=${pkg};S.authAccount=${q(email)};S.fromAccountString=${q(email)};end`;
  launchUrl(u,false);return u}
const _open=d=>{const t=compose(d),[,i]=find(d.b,d.id),a=effAcc(i);if(!a||!MAIL.test(a.email||'')){toast('No valid email address for the sending account — nothing was opened');return false}if(String(d.id).trim().toLowerCase()===a.email.trim().toLowerCase()){toast('Sender and recipient are the same address — nothing was opened');return false}return gmailLaunch(a.email,S.opener||'app',{to:d.id,su:t.subject,body:t.body})!==null};
acts.open=(d,after,cancel)=>{const[,i]=find(d.b,d.id),a=effAcc(i),op=S.opener||'app';
  const orig=S.accs.find(x=>x.id===i.accId),go=()=>{if(_open(d)===false){if(cancel)cancel();return}if(a){S.lastFrom=a.email;S.lastFromAt=Date.now();save()}if(orig&&a&&orig.id!==a.id)notice('Backup account used',esc(orig.email)+' is switched off, so this send used the backup account <b>'+esc(a.email)+'</b>.','OK');if(after)after()};
  if(op!=='browser'&&/Android/i.test(navigator.userAgent))return askGmail(go,()=>{if(cancel)cancel()});
  return go();
};
function notice(title,text,okLabel,cb,cancelLabel,onNo){
  if(!document.getElementById('modal-css')){const s=document.createElement('style');s.id='modal-css';s.textContent='.modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:50;padding:16px}.mbox{background:var(--card);color:var(--ink);border-radius:14px;padding:18px;max-width:420px;width:100%}.mbox p{color:var(--mute);margin:8px 0 14px}';document.head.appendChild(s)}
  const o=document.createElement('div');o.className='modal';
  o.innerHTML=`<div class="mbox"><b style="font-size:18px">${title}</b><p>${text}</p><div class="row">${cancelLabel?`<button class="btn" data-m="no">${cancelLabel}</button>`:''}<button class="btn p" data-m="ok">${okLabel}</button></div></div>`;
  document.body.appendChild(o);
  o.onclick=e=>{const m=e.target.dataset.m;if(!m)return;o.remove();if(m==='ok'){if(cb)cb()}else if(m==='no'&&onNo)onNo()};
}
acts.openGmail=d=>{
  const a=S.accs.find(x=>x.id===d.id);
  if(!a){toast('Account not found \u2014 nothing was opened');return}
  if(!MAIL.test(a.email||'')){toast('This account has no valid email address \u2014 nothing was opened');return}
  const op=S.opener||'app',app=op!=='browser'&&/Android/i.test(navigator.userAgent);
  const go=()=>{gmailLaunch(a.email,op,null);toast(app?'Opening Gmail for '+a.email:'Opening Gmail for '+a.email+' \u2014 sign in as it if Google asks',app?2500:5000)};
  if(app)askGmail(go);else go();
};
function askGmail(ok,no){
  if(S.gmailOK)return ok();
  notice('Allow ameenis-solution to open the Gmail app?','This app will open the Gmail app to write a draft with the From address set to the account you choose. It cannot read your mail or see your accounts. Android decides which account Gmail actually uses, so check the From line.','Allow',()=>{S.gmailOK=true;save();ok()},'Not now',no);
}
const _so=acts.setOpen;acts.setOpen=d=>{_so(d);if(d.v!=='browser')S.gmailOK=false};
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e});
$('inst').onclick=()=>{if(dp){dp.prompt()}else toast('Use your browser menu: Add to Home Screen')};
render();

if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

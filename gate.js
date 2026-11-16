/* Passcode gate. Load this FIRST (no defer) in every page's <head>.
   To change the passcode: replace HASH below with the SHA-256 of the new passcode
   (see README). Changing it locks everyone out again until they enter the new one. */
(function(){
  var HASH='b6a13dee7653bdd53ea4b8cd424a8fac36ae2ff7fe3a0f0995d04c5ded77ab16';
  var KEY='ps_unlock';
  function addLockBtn(){
    var h=document.querySelector('.header-status');if(!h||document.getElementById('ps-lock'))return;
    var b=document.createElement('button');b.id='ps-lock';b.type='button';b.className='btn';b.textContent='Lock';b.onclick=function(){window.psLock()};h.appendChild(b);
  }
  var ok=false;try{ok=localStorage.getItem(KEY)===HASH}catch(e){}
  if(ok){window.psLock=function(){try{localStorage.removeItem(KEY)}catch(e){}location.reload()};
    document.addEventListener('DOMContentLoaded',addLockBtn);return}

  // Locked: hide the whole app until the correct passcode is entered
  var st=document.createElement('style');
  st.id='ps-gate-style';
  st.textContent='body>*:not(#ps-gate){display:none!important}'+
  '#ps-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#f4f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111}'+
  '#ps-gate .box{width:100%;max-width:340px;background:#fff;border:1px solid #dfe6e2;border-radius:16px;padding:28px 22px;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.08)}'+
  '#ps-gate img{width:56px;height:56px;margin-bottom:10px}'+
  '#ps-gate h1{font-size:19px;margin:0 0 4px}#ps-gate p{font-size:14px;margin:0 0 16px;color:#5b6b63}'+
  '#ps-gate input{width:100%;box-sizing:border-box;padding:13px 14px;font-size:16px;border:1px solid #c9d4ce;border-radius:10px;background:#fff;color:#111;text-align:center;letter-spacing:2px}'+
  '#ps-gate input:focus{outline:2px solid #00743d;border-color:#00743d}'+
  '#ps-gate button{width:100%;margin-top:12px;padding:13px;font-size:16px;font-weight:600;border:0;border-radius:10px;background:#00743d;color:#fff;cursor:pointer}'+
  '#ps-gate button:disabled{opacity:.55}'+
  '#ps-gate .err{min-height:18px;margin-top:10px;font-size:13px;color:#c0392b}'+
  '@media(prefers-color-scheme:dark){#ps-gate{background:#0f1512;color:#eee}#ps-gate .box{background:#18211c;border-color:#2a3830}#ps-gate p{color:#9bb0a5}#ps-gate input{background:#0f1512;color:#eee;border-color:#33453b}}';
  document.head.appendChild(st);

  function build(){
    var g=document.createElement('div');g.id='ps-gate';
    g.innerHTML='<form class="box" autocomplete="off"><img src="logo-mark.png" alt="">'+
      '<h1>Enter passcode</h1><p>This workspace is private.</p>'+
      '<input type="password" id="ps-pass" placeholder="Passcode" autocomplete="current-password" autofocus>'+
      '<button type="submit">Unlock</button><div class="err" id="ps-err" role="alert"></div></form>';
    document.body.appendChild(g);
    var f=g.querySelector('form'),inp=g.querySelector('#ps-pass'),err=g.querySelector('#ps-err'),btn=g.querySelector('button');
    var fails=+(sessionStorage.getItem('ps_fails')||0),until=+(sessionStorage.getItem('ps_until')||0);
    function tick(){
      var left=Math.ceil((until-Date.now())/1000);
      if(left>0){btn.disabled=true;err.textContent='Too many attempts. Try again in '+left+'s.';setTimeout(tick,500)}
      else{btn.disabled=false;if(/Too many/.test(err.textContent))err.textContent=''}
    }
    tick();
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(Date.now()<until)return;
      var v=inp.value;if(!v)return;
      sha256hex(v).then(function(h){
        if(h===HASH){
          try{localStorage.setItem(KEY,HASH);sessionStorage.removeItem('ps_fails')}catch(x){}
          location.reload();
        }else{
          fails++;sessionStorage.setItem('ps_fails',fails);
          err.textContent='Wrong passcode.';inp.value='';inp.focus();
          if(fails>=5){until=Date.now()+30000;sessionStorage.setItem('ps_until',until);fails=0;sessionStorage.setItem('ps_fails',0);tick()}
        }
      });
    });
    setTimeout(function(){inp.focus()},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();

  function sha256hex(s){
    if(window.crypto&&crypto.subtle){
      return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){
        return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')
      }).catch(function(){return Promise.resolve(sha256js(s))});
    }
    return Promise.resolve(sha256js(s));
  }
  // Pure-JS fallback (for browsers/contexts without crypto.subtle)
  function sha256js(str){
    var m=unescape(encodeURIComponent(str)),l=m.length,w=[],i,j;
    var K=[],H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];
    for(var c=2,n=0;n<64;c++){var p=1;for(var d=2;d*d<=c;d++)if(c%d==0){p=0;break}
      if(p){K[n++]=(Math.pow(c,1/3)*4294967296)|0}}
    for(i=0;i<l;i++)w[i>>2]|=m.charCodeAt(i)<<(24-(i%4)*8);
    w[l>>2]|=0x80<<(24-(l%4)*8);w[(((l+8)>>6)+1)*16-1]=l*8;
    function R(x,n){return(x>>>n)|(x<<(32-n))}
    for(j=0;j<w.length;j+=16){
      var a=H.slice(),W=[];
      for(i=0;i<64;i++){
        if(i<16)W[i]=w[j+i]|0;
        else{var s0=R(W[i-15],7)^R(W[i-15],18)^(W[i-15]>>>3),s1=R(W[i-2],17)^R(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)|0}
        var S1=R(a[4],6)^R(a[4],11)^R(a[4],25),ch=(a[4]&a[5])^(~a[4]&a[6]),t1=(a[7]+S1+ch+K[i]+W[i])|0;
        var S0=R(a[0],2)^R(a[0],13)^R(a[0],22),mj=(a[0]&a[1])^(a[0]&a[2])^(a[1]&a[2]),t2=(S0+mj)|0;
        a=[(t1+t2)|0,a[0],a[1],a[2],(a[3]+t1)|0,a[4],a[5],a[6]];
      }
      for(i=0;i<8;i++)H[i]=(H[i]+a[i])|0;
    }
    return H.map(function(x){return('0000000'+(x>>>0).toString(16)).slice(-8)}).join('');
  }

})();

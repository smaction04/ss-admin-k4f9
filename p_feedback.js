/* 받은 의견: 앱 홈의 토슬이 버튼으로 테스터가 보낸 글. 최신순. 답변 기능은 없다(읽기만).
   서버 함수 admin_feedback_list(관리자+2단계 확인). 30초마다 저절로 새로 불러온다. */
(function(){
  window.PAGES.feedback={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,timer=null,busy=false;
    root.innerHTML='<div id="fb"></div>';
    var box=root.querySelector('#fb');
    function dt(s){return s?new Date(s).toLocaleString('ko-KR',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
    function draw(list,stamp){
      var h='<div class="card"><b>받은 의견 '+list.length+'건</b>'+
        '<div class="muted sm">'+esc(stamp)+' 기준 · 최신순 · 답변은 앱에서 할 수 없어요</div></div>';
      if(!list.length){h+='<div class="card muted">아직 들어온 의견이 없어요.</div>'}
      list.forEach(function(r){
        h+='<div class="card"><div class="muted sm">'+esc(dt(r.created_at))+' · '+esc(r.email||'-')+' · 앱 '+esc(r.app_version||'-')+' · '+esc(r.device||'-')+'</div>'+
          '<div style="white-space:pre-wrap;margin-top:6px">'+esc(r.message)+'</div></div>';
      });
      box.innerHTML=h;
    }
    async function load(show){
      if(busy)return;busy=true;
      try{
        if(show&&!box.firstChild)box.innerHTML='<div class="muted">불러오는 중…</div>';
        var r=await sb.rpc('admin_feedback_list',{p_limit:200});
        if(r.error)throw new Error(r.error.message);
        draw(r.data||[],new Date().toLocaleTimeString('ko-KR',{hour12:false}));
      }catch(e){
        box.innerHTML='<div class="card"><b>의견을 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><button class="btn" id="retry">다시 시도</button></div>';
        var rt=box.querySelector('#retry');if(rt)rt.onclick=function(){load(true)};
      }finally{busy=false}
    }
    var st=document.createElement('style');
    st.textContent='.sm{font-size:12px}';
    root.appendChild(st);
    await load(true);
    timer=setInterval(function(){if(!root.isConnected){clearInterval(timer);return}if(!document.hidden)load(false)},30000);
  }};
})();

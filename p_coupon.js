/* 쿠폰 대상자: 테스트 기간에 14일 개근을 달성한 사람 명단.
   14일차 출석을 받는 순간 서버가 자동으로 올리고, 본인이 앱에서 성함·전화번호를 내면 이 표에 채워진다.
   "발송 완료"를 누르면 서버가 전화번호를 지운다(쿠폰 보내는 데만 쓰는 정보). 30초마다 저절로 새로 불러온다. */
(function(){
  window.PAGES.coupon={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,timer=null,busy=false;
    root.innerHTML='<div id="cp"></div>';
    var box=root.querySelector('#cp');
    function dt(s){return s?new Date(s).toLocaleString('ko-KR',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
    function phone(p){if(!p)return '—';return p.length===11?p.slice(0,3)+'-'+p.slice(3,7)+'-'+p.slice(7):p}
    function draw(list,stamp){
      var wait=list.filter(function(r){return !r.sent_at}).length;
      var noinfo=list.filter(function(r){return !r.sent_at&&!r.submitted_at}).length;
      var h='<div class="card"><b>달성 '+list.length+'명</b> · 보낼 사람 '+wait+'명'+(noinfo?' · 아직 정보 안 낸 사람 '+noinfo+'명':'')+
        '<div class="muted sm">'+esc(stamp)+' 기준 · 발송 완료를 누르면 전화번호는 서버에서 지워져요</div></div>';
      if(!list.length){h+='<div class="card muted">아직 14일을 채운 사람이 없어요.</div>'}
      else{
        h+='<div class="card"><table class="pt"><tr><th>계정</th><th>달성일</th><th>성함</th><th>전화번호</th><th>상태</th><th></th></tr>';
        list.forEach(function(r){
          var st=r.sent_at?'<span class="chip good">발송 완료 '+esc(dt(r.sent_at))+'</span>':(r.submitted_at?'<span class="chip warn">발송 대기</span>':'<span class="chip">정보 입력 전</span>');
          var btn=r.sent_at?'<button class="btn" data-u="'+esc(r.user_id)+'" data-s="0">완료 취소</button>':(r.submitted_at?'<button class="btn" data-u="'+esc(r.user_id)+'" data-s="1">발송 완료</button>':'');
          h+='<tr><td>'+esc(r.email||'-')+'</td><td>'+esc(r.achieved_date)+'</td><td>'+esc(r.name||'—')+'</td><td>'+esc(phone(r.phone))+'</td><td>'+st+'</td><td>'+btn+'</td></tr>';
        });
        h+='</table></div>';
      }
      box.innerHTML=h;
      box.querySelectorAll('button[data-u]').forEach(function(b){
        b.onclick=async function(){
          b.disabled=true;
          var r=await sb.rpc('admin_coupon_mark_sent',{p_user:b.dataset.u,p_sent:b.dataset.s==='1'});
          if(r.error){alert('처리하지 못했어요: '+r.error.message)}
          await load(true);
        };
      });
    }
    async function load(show){
      if(busy)return;busy=true;
      try{
        if(show&&!box.firstChild)box.innerHTML='<div class="muted">불러오는 중…</div>';
        var r=await sb.rpc('admin_coupon_winners');
        if(r.error)throw new Error(r.error.message);
        draw(r.data||[],new Date().toLocaleTimeString('ko-KR',{hour12:false}));
      }catch(e){
        box.innerHTML='<div class="card"><b>명단을 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><button class="btn" id="retry">다시 시도</button></div>';
        var rt=box.querySelector('#retry');if(rt)rt.onclick=function(){load(true)};
      }finally{busy=false}
    }
    var st=document.createElement('style');
    st.textContent='.pt{width:100%;border-collapse:collapse}.pt td,.pt th{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}.pt tr:last-child td{border-bottom:0}.pt th{font-size:12px;color:var(--ink-soft)}.sm{font-size:12px}';
    root.appendChild(st);
    await load(true);
    timer=setInterval(function(){if(!root.isConnected){clearInterval(timer);return}if(!document.hidden)load(false)},30000);
  }};
})();

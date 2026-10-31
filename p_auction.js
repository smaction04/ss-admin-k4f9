/* 경매: 업체가 올린 상품을 허락·거절하고, 당첨 뒤 배송·수취확인·정산까지 한 줄씩 챙기는 곳.
   모든 숫자(참여비·목표·당첨)는 뒤쪽 컴퓨터가 정하고, 이 화면은 버튼만 눌러 준다. 30초마다 저절로 새로 불러온다. */
(function(){
  window.PAGES.auction={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,timer=null,busy=false;
    root.innerHTML='<div id="au"></div>';
    var box=root.querySelector('#au');
    var ST={pending:['허락 대기','warn'],open:['모집 중','good'],failed:['미달·환불됨',''],rejected:['거절',''],drawn:['당첨자 나옴 · 배송 전','warn'],
      shipped:['배송 중','warn'],confirmed:['수취 확인 · 정산 전','warn'],disputed:['문제 신고','bad'],settled:['정산 완료','good']};
    function dt(s){return s?new Date(s).toLocaleString('ko-KR',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
    function won(n){return (n==null?'—':Number(n).toLocaleString('ko-KR')+'원')}
    function shipInfo(r){
      if(['drawn','shipped','disputed'].indexOf(r.status)<0)return '';
      var p=r.shipping;
      if(!p)return '<div class="sm"><span class="chip warn">받을 곳 아직 없음</span></div>';
      return '<div class="sm" style="margin-top:4px">받을 곳: <b>'+esc(p.recipient_name)+'</b> · '+esc(p.phone)+'<br>'+
        (p.postcode?'('+esc(p.postcode)+') ':'')+esc(p.address)+' '+esc(p.address_detail)+
        (p.memo?'<br>요청: '+esc(p.memo):'')+'<div class="muted sm">개인정보 동의 '+dt(p.agreed_at)+'</div></div>';
    }
    function actions(r){
      var id=esc(r.id);
      if(r.status==='pending')return '<button class="btn" data-a="approve" data-i="'+id+'">허락</button> <button class="btn" data-a="reject" data-i="'+id+'">거절</button>';
      if(r.status==='drawn')return r.shipping?'<button class="btn" data-a="ship" data-i="'+id+'">배송 시작 표시</button>':'<span class="muted sm">당첨자가 받을 곳을 적으면 배송 시작을 누를 수 있어요</span>';
      if(r.status==='disputed')return '<button class="btn" data-a="resolve_ok" data-i="'+id+'">문제 없음(확인 처리)</button> <button class="btn" data-a="resolve_hold" data-i="'+id+'">메모만 남김</button>';
      if(r.status==='confirmed')return '<button class="btn" data-a="settle" data-i="'+id+'">정산 기록</button>';
      return '';
    }
    function draw(list,stamp){
      var cnt=function(s){return list.filter(function(r){return r.status===s}).length};
      var todo=cnt('pending')+cnt('drawn')+cnt('disputed')+cnt('confirmed');
      var h='<div class="card"><b>할 일 '+todo+'건</b> · 허락 대기 '+cnt('pending')+' · 배송 전 '+cnt('drawn')+' · 문제 신고 '+cnt('disputed')+' · 정산 전 '+cnt('confirmed')+
        '<div class="muted sm">'+esc(stamp)+' 기준 · 모집 중 '+cnt('open')+'건 · 정산은 기록만 남겨요(실제 송금은 직접)</div>'+
        '<div style="margin-top:8px"><button class="btn" id="auto">배송 7일 지난 건 자동 수취확인 실행</button></div></div>';
      if(!list.length){h+='<div class="card muted">아직 올라온 경매 상품이 없어요. 업체 전용 페이지가 열리면 여기에 쌓여요.</div>'}
      else{
        h+='<div class="card"><table class="pt"><tr><th>상품 / 업체</th><th>판매가</th><th>모인 캐시</th><th>상태</th><th>일정</th><th></th></tr>';
        list.forEach(function(r){
          var s=ST[r.status]||[r.status,''];
          var pct=r.goal_krw?Math.min(100,Math.round(100*r.collected_krw/r.goal_krw)):0;
          var when=r.status==='open'?'마감 '+dt(r.deadline):r.status==='settled'?'정산 '+dt(r.settled_at)+' · '+won(r.settle_krw):
            r.status==='shipped'?'배송 '+dt(r.shipped_at):r.status==='drawn'?'당첨 '+dt(r.drawn_at):r.status==='confirmed'?'확인 '+dt(r.confirmed_at):dt(r.created_at);
          h+='<tr><td><b>'+esc(r.title)+'</b><div class="muted sm">'+esc(r.vendor_name)+' · '+esc(r.vendor_contact)+' · 사진 '+esc(r.photo_count)+'장</div>'+
            (r.description?'<div class="muted sm">'+esc(r.description)+'</div>':'')+
            (r.winner_email?'<div class="sm">당첨: '+esc(r.winner_email)+'</div>':'')+
            shipInfo(r)+
            (r.admin_note?'<div class="muted sm">메모: '+esc(r.admin_note)+'</div>':'')+'</td>'+
            '<td>'+won(r.price_krw)+'</td>'+
            '<td>'+Number(r.collected_krw).toLocaleString('ko-KR')+' / '+Number(r.goal_krw).toLocaleString('ko-KR')+' ('+pct+'%)<div class="muted sm">'+esc(r.entry_count)+'명 · 참여비 '+esc(r.entry_fee)+'</div></td>'+
            '<td><span class="chip '+s[1]+'">'+esc(s[0])+'</span></td><td class="sm">'+esc(when)+'</td><td>'+actions(r)+'</td></tr>';
        });
        h+='</table></div>';
      }
      box.innerHTML=h;
      var by={};list.forEach(function(r){by[r.id]=r});
      box.querySelectorAll('button[data-a]').forEach(function(b){
        b.onclick=async function(){
          var id=Number(b.dataset.i),a=b.dataset.a,r=by[id],res;
          b.disabled=true;
          if(a==='approve'){
            var d=prompt('모집 기간(일) — 1~60, 비우면 14일','14');if(d===null){b.disabled=false;return}
            var n=parseInt(d,10);if(!n)n=14;
            var note=prompt('메모(선택)','')||null;
            res=await sb.rpc('admin_auction_review',{p_item:id,p_approve:true,p_days:n,p_note:note});
          }else if(a==='reject'){
            var why=prompt('거절 이유(메모, 선택)','');if(why===null){b.disabled=false;return}
            res=await sb.rpc('admin_auction_review',{p_item:id,p_approve:false,p_days:14,p_note:why||null});
          }else if(a==='ship'){
            if(!confirm('"'+r.title+'" 배송을 시작했다고 표시할까요? 이때부터 7일 뒤 자동 수취확인이 가능해져요.')){b.disabled=false;return}
            res=await sb.rpc('admin_auction_mark_shipped',{p_item:id});
          }else if(a==='resolve_ok'||a==='resolve_hold'){
            var m=prompt('확인한 내용 메모','');if(m===null){b.disabled=false;return}
            res=await sb.rpc('admin_auction_resolve_dispute',{p_item:id,p_confirm:a==='resolve_ok',p_note:m||null});
          }else if(a==='settle'){
            if(!confirm('"'+r.title+'" 정산을 기록할까요? 업체에 줄 돈은 상품가의 99%예요. 실제 송금은 따로 하셔야 해요.')){b.disabled=false;return}
            res=await sb.rpc('admin_auction_settle',{p_item:id});
          }
          if(res&&res.error)alert('처리하지 못했어요: '+res.error.message);
          await load(true);
        };
      });
      var au=box.querySelector('#auto');
      if(au)au.onclick=async function(){
        au.disabled=true;
        var r=await sb.rpc('admin_auction_auto_confirm');
        if(r.error)alert('처리하지 못했어요: '+r.error.message);else alert(r.data+'건을 자동 수취확인 했어요.');
        await load(true);
      };
    }
    async function load(show){
      if(busy)return;busy=true;
      try{
        if(show&&!box.firstChild)box.innerHTML='<div class="muted">불러오는 중…</div>';
        var r=await sb.rpc('admin_auction_list');
        if(r.error)throw new Error(r.error.message);
        draw(r.data||[],new Date().toLocaleTimeString('ko-KR',{hour12:false}));
      }catch(e){
        box.innerHTML='<div class="card"><b>경매 목록을 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><button class="btn" id="retry">다시 시도</button></div>';
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

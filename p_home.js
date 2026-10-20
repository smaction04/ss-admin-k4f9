/* 홈: 열자마자 보는 요약. 실시간 숫자(관제실 함수) + 점검판 개수 + 지금 할 일 + 출시를 막는 것. 자세한 건 메뉴별 페이지에서. */
(function(){
  function sec(doc,re){var a=(doc&&doc.body&&doc.body.sections)||[];for(var i=0;i<a.length;i++){if(re.test(a[i].h||''))return a[i]}return null}
  function lines(s){return s?(s.paras||[]).concat(s.bullets||[]):[]}
  window.PAGES.home={render:async function(root,ctx){
    var esc=ctx.esc,md=ctx.md,won=function(n){return new Intl.NumberFormat('ko-KR').format(n||0)};
    var res=await Promise.allSettled([ctx.getDoc('status',true),ctx.getDoc('preflight',true),ctx.getDoc('checklist',true),ctx.sb.rpc('admin_dashboard_stats'),ctx.listDocs()]);
    var st=res[0].value,pf=res[1].value,cl=res[2].value,live=res[3].value,docs=res[4].value||[];
    var h='<style>.hl li{margin:0 0 6px}.hl{margin:0;padding-left:18px}.cta{display:inline-block;margin-top:8px;text-decoration:none}</style>'+
      '<h1 class="pt">슬립세이브 관리센터</h1>';
    var one=lines(sec(st,/^1\./)).join(' ');
    h+='<p class="sub">'+(one?md(one):'현황 문서가 아직 서버에 없어요 (sync_hub.py 실행 필요)')+'</p>';

    /* 실시간 숫자 */
    var s=live&&live.data&&(Array.isArray(live.data)?live.data[0]:live.data);
    h+='<div class="sec-h" style="margin-top:6px">지금 숫자 (실시간, 관제실과 같은 값)</div>';
    if(s){
      h+='<div class="grid g4">'+
        '<div class="tile"><b>오늘 활성(DAU)</b><span>'+won(s.dau_today)+'</span></div>'+
        '<div class="tile"><b>오늘 지급</b><span>'+won(s.today_payout_krw)+'원</span></div>'+
        '<div class="tile"><b>총 가입자</b><span>'+won(s.total_users)+'</span></div>'+
        '<div class="tile"><b>현재 발행 잔액</b><span>'+won(s.outstanding_balance_krw)+'원</span></div></div>';
      if(s.alert_outstanding||s.alert_annual) h+='<div class="card" style="border-color:var(--bad);margin-top:8px"><b style="color:var(--bad)">⚠ 전자금융거래법 기준 경보</b> — 관제실에서 확인하세요.</div>';
    }else h+='<div class="card muted">실시간 숫자를 못 불러왔어요'+(live&&live.error?': '+esc(live.error.message):(res[3].reason?': '+esc(res[3].reason.message):''))+'</div>';

    /* 점검판 + 대기 작업 + 다음 할 일 + 출시를 막는 것 */
    h+='<div class="grid g2" style="margin-top:14px">';
    if(cl){
      var n={open:0,part:0,done:0},hi=0;
      ((cl.body||{}).CATS||[]).forEach(function(c){(c.items||[]).forEach(function(it){n[it.st||'open']++;if(!it.st&&it.lv==='hi')hi++})});
      h+='<div class="card"><b>점검판</b><p class="muted" style="margin:4px 0 0">미해결 <b style="color:var(--ink)">'+n.open+'</b> (그중 높음 '+hi+') · 부분 완료 '+n.part+' · 완료 '+n.done+'</p><a class="btn cta" href="#/checklist">점검판 열기</a></div>';
    }
    var q=sec(st,/^0\./);
    if(q) h+='<div class="card" style="border-color:var(--warn)"><b>대기 작업 (다음 세션 첫 작업)</b><div class="muted" style="margin-top:4px">'+lines(q).map(function(x){return '<div>'+md(x)+'</div>'}).join('')+'</div></div>';
    var nx=sec(st,/^7\./);
    if(nx) h+='<div class="card"><b>다음 할 일</b><ul class="hl muted" style="margin-top:6px">'+lines(nx).map(function(x){return '<li>'+md(x)+'</li>'}).join('')+'</ul><a class="btn cta" href="#/status">현황 열기</a></div>';
    var bk=sec(pf,/출시를 막는/);
    if(bk) h+='<div class="card"><b>지금 출시를 막는 것</b><div class="muted" style="margin-top:4px">'+lines(bk).map(function(x){return '<div>'+md(x)+'</div>'}).join('')+'</div><a class="btn cta" href="#/preflight">출시 점검 열기</a></div>';
    h+='</div>';

    /* 문서 반영 시각 */
    if(docs.length){
      var names={status:'현황·업체',preflight:'출시 점검',todo:'결정·대기',checklist:'점검판',links:'바로가기'};
      h+='<div class="sec-h">문서가 서버에 반영된 시각</div><div class="muted" style="font-size:12.5px">'+docs.filter(function(d){return names[d.key]}).map(function(d){return esc(names[d.key])+' '+esc(ctx.ago(d.updated_at))}).join(' · ')+'</div>'+
        '<div class="muted" style="font-size:12px;margin-top:4px">문서는 Claude가 <code>sync_hub.py</code>로 올릴 때 갱신돼요. 이 화면이 오래돼 보이면 "현황 갱신해줘"라고 말씀하세요.</div>';
    }
    root.innerHTML=h;
  }};
})();

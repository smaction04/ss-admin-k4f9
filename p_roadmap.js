/* 업데이트 예정: 앞으로 앱에 넣을 콘텐츠 후보. 항목 문구는 사용자 원문 그대로, 상태는 정해질 때마다 고친다. */
(function(){
  var ITEMS=[
    ['1. 캐시로 경매하기','아직 얘기 안 함'],
    ['2. 커뮤니티 만들기','아직 얘기 안 함'],
    ['3. 레퍼럴 구조','아직 얘기 안 함'],
    ['4. 뭔가를 키워서 머물게 하고 거기에 화면을 가리지 않는 광고가 돌아가게끔 하는 여부?','아직 얘기 안 함'],
    ['5. 쿠팡광고_해당링크통해 쿠팡물건 구매시 우리의 캐시를 추가로 주면되는데 보통 파트너스 3%니까 고객에게는 1%를 캐시로 적립해주면 우리는 더 남는장사지 않나?','아직 얘기 안 함']];
  window.PAGES.roadmap={render:async function(root,ctx){
    var esc=ctx.esc;
    var h='<h1 class="pt">업데이트 예정</h1><p class="sub">2026-10-26 사용자 제안 · 하나씩 물어보며 정하는 중</p><div class="sec-h">후보 5개</div>';
    ITEMS.forEach(function(i){h+='<div class="card"><b>'+esc(i[0])+'</b><div class="muted" style="font-size:12px;margin-top:6px">상태: '+esc(i[1])+'</div></div>'});
    root.innerHTML=h;
  }};
})();

/* 테스터 참여 신청: 신청 확인 → 콘솔 등록 → 설치링크 전달 절차와 바로가기. 신청자 명단(이메일)은 개인정보라 여기엔 두지 않고 구글 폼 응답 화면에서만 본다. */
(function(){
  var APP='4976033012549514793', CON='https://play.google.com/console/u/1/developers/5868784087709381187/app/'+APP;
  var LINKS=[
    ['신청 폼 응답 보기(신청자 이메일)','https://docs.google.com/forms/d/1HLYdYJsplR0TUMXbVhYCOiRjzId3IoD-408Yy2Wumkc/edit?authuser=1#responses','sleepsave2026 계정으로 열어야 [응답] 탭이 보여요'],
    ['신청 폼(공개 주소)','https://docs.google.com/forms/d/e/1FAIpQLSduUybiTX1rQgN_HHZNZ3CR4xPAQ-EG9OyiEobBpZPCDTpn2w/viewform','신청자에게 퍼뜨리는 주소'],
    ['플레이 콘솔 · 비공개 테스트','https://play.google.com/console/u/1/developers/5868784087709381187/app/'+APP+'/closed-testing','트랙 관리 → 테스터 탭에서 이메일 명단 등록'],
    ['테스터 참여 링크(설치 안내)','https://play.google.com/apps/testing/com.sycompany.sleepsave','등록이 끝난 신청자에게 개별로 보내는 주소']];
  window.PAGES.tester={render:async function(root,ctx){
    var esc=ctx.esc;
    var h='<style>.lk{display:block;text-decoration:none;color:inherit;padding:10px 14px}.lk:hover{background:var(--surface-2)}.lk b{display:block}.lk span{font-size:12px;color:var(--ink-soft)}</style>'+
      '<h1 class="pt">테스터 참여 신청</h1><p class="sub">신청 확인부터 설치링크 전달까지 · 목표 12명 이상</p>'+
      '<div class="sec-h">진행 순서</div><div class="card"><ol style="margin:0;padding-left:20px;line-height:1.8">'+
      '<li>신청 폼 응답에서 새 신청자 이메일을 확인한다(같은 이메일 중복은 1명으로 센다).</li>'+
      '<li>플레이 콘솔 테스터 탭의 이메일 명단에 추가하고 저장한다.</li>'+
      '<li>등록이 끝난 걸 확인한 뒤에만 참여 링크를 개별로 보낸다.</li>'+
      '<li>받은 사람은 링크에서 \'테스터 되기\'를 누르고 플레이 스토어에서 설치한다.</li></ol></div>'+
      '<div class="sec-h">바로가기</div><div class="grid g2">';
    LINKS.forEach(function(l){h+='<a class="card lk" href="'+esc(l[1])+'" target="_blank" rel="noopener"><b>'+esc(l[0])+'</b><span>'+esc(l[2])+'</span></a>'});
    root.innerHTML=h+'</div>';
  }};
})();

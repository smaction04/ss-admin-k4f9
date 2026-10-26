/* 테스터 참여 신청: 신청 확인 → 콘솔 등록 → 설치링크 전달 절차와 바로가기. 신청자 명단(이메일)은 개인정보라 여기엔 두지 않고 구글 폼 응답 화면에서만 본다. */
(function(){
  var APP='4976033012549514793', CON='https://play.google.com/console/u/1/developers/5868784087709381187/app/'+APP;
  var LINKS=[
    ['① 누가 신청했나 보기','https://docs.google.com/forms/d/1HLYdYJsplR0TUMXbVhYCOiRjzId3IoD-408Yy2Wumkc/edit?authuser=1#responses','신청서를 낸 사람들의 이메일이 적혀 있어요. 맨 먼저 여기를 봐요.'],
    ['② 신청서 화면 (남에게 보내는 주소)','https://docs.google.com/forms/d/e/1FAIpQLSduUybiTX1rQgN_HHZNZ3CR4xPAQ-EG9OyiEobBpZPCDTpn2w/viewform','신청하려는 사람이 보는 화면이에요. 사람을 모을 때 이 주소를 보내요.'],
    ['③ 구글 플레이에 이름 올리기','https://play.google.com/console/u/1/developers/5868784087709381187/app/4976033012549514793/closed-testing','신청한 사람의 이메일을 여기 명단에 적어야 그 사람이 앱을 받을 수 있어요.'],
    ['④ 설치 초대장 (등록 끝난 사람에게만)','https://play.google.com/apps/testing/com.sycompany.sleepsave','③에 이름을 올린 사람에게 보내는 주소예요. 이름이 없는 사람은 열어도 막혀요.']];
  window.PAGES.tester={render:async function(root,ctx){
    var esc=ctx.esc;
    var h='<style>.lk{display:block;text-decoration:none;color:inherit;padding:10px 14px}.lk:hover{background:var(--surface-2)}.lk b{display:block}.lk span{font-size:12px;color:var(--ink-soft)}</style>'+
      '<h1 class="pt">테스터 참여 신청</h1><p class="sub">신청 확인부터 설치링크 전달까지 · 목표 12명 이상</p>'+
      '<div class="sec-h">진행 순서</div><div class="card"><ol style="margin:0;padding-left:20px;line-height:1.8">'+
      '<li>①에서 새로 신청한 사람의 이메일을 본다(같은 이메일이 두 번 나오면 1명으로 센다).</li>'+
      '<li>③에서 그 이메일을 명단에 적고 저장한다.</li>'+
      '<li>명단에 올라간 걸 확인한 뒤에만 ④ 초대장을 그 사람에게 따로 보낸다.</li>'+
      '<li>받은 사람은 링크에서 \'테스터 되기\'를 누르고 플레이 스토어에서 설치한다.</li></ol></div>'+
      '<div class="sec-h">바로가기</div><div class="grid g2">';
    LINKS.forEach(function(l){h+='<a class="card lk" href="'+esc(l[1])+'" target="_blank" rel="noopener"><b>'+esc(l[0])+'</b><span>'+esc(l[2])+'</span></a>'});
    root.innerHTML=h+'</div>';
  }};
})();

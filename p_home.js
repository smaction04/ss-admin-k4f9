/* 오늘 할 일: 열자마자 보는 첫 화면. "지금 내가 할 일 / Claude가 할 일 / 출시를 막는 것 / 기다리는 중"만 모은다.
   재료는 서버 문서의 꼬리표(meta·bmeta: s 상태·o 담당·p 중요도·l 표시 글자·n 이유 — classify.py가 붙임).
   원문은 그대로 두고 여기서는 골라 보여 주기만 한다. 자세한 건 각 메뉴 원본에서. */
(function(){
  function sec(doc,re){var a=(doc&&doc.body&&doc.body.sections)||[];for(var i=0;i<a.length;i++){if(re.test(a[i].h||''))return a[i]}return null}
  function lines(s){return s?(s.paras||[]).concat(s.bullets||[]):[]}
  /* 문서 안에서 꼬리표가 붙은 줄을 모두 모은다 */
  function collect(doc,src){
    var out=[];
    ((doc&&doc.body&&doc.body.sections)||[]).forEach(function(s){
      (s.tables||[]).forEach(function(t){
        var id=/^#$/.test(String((t.cols||[])[0]||'').trim());
        (t.rows||[]).forEach(function(r,i){var m=t.meta&&t.meta[i];if(m)out.push({t:id&&r.length>1?r[0]+' · '+r[1]:r[0],m:m,src:src})});
      });
      (s.bullets||[]).forEach(function(b,i){var m=s.bmeta&&s.bmeta[i];if(m)out.push({t:b,m:m,src:src})});
    });
    return out;
  }
  var SRC={todo:'보류·할 일 장부',status:'현재 상태 한 장',preflight:'출시 점검표'};
  window.PAGES.home={render:async function(root,ctx){
    var esc=ctx.esc,md=ctx.md,won=function(n){return new Intl.NumberFormat('ko-KR').format(n||0)};
    var res=await Promise.allSettled([ctx.getDoc('status',true),ctx.getDoc('preflight',true),ctx.getDoc('todo',true),ctx.getDoc('checklist',true),ctx.sb.rpc('admin_dashboard_stats'),ctx.listDocs()]);
    var st=res[0].value,pf=res[1].value,td=res[2].value,cl=res[3].value,live=res[4].value,docs=res[5].value||[];
    var all=collect(td,'todo').concat(collect(st,'status'),collect(pf,'preflight'));
    function pick(f){return all.filter(f).sort(function(a,b){return (a.m.p==='core'?0:1)-(b.m.p==='core'?0:1)})}
    function item(x){
      var t=String(x.t||'').replace(/\*\*/g,'');if(t.length>90)t=t.slice(0,90)+'…';
      return '<li><div class="it"><span class="chip '+(x.m.s==='act'?'warn':x.m.s==='bad'?'bad':'')+'">'+esc(x.m.l||x.m.s)+'</span>'+
        (x.m.p==='core'?'<span class="core">핵심</span>':'')+'<a href="#/'+x.src+'">'+md(t)+'</a></div>'+
        (x.m.n?'<div class="why">'+md(x.m.n)+'</div>':'')+'<div class="src">'+esc(SRC[x.src])+'</div></li>';
    }
    function box(title,list,empty,tone){
      return '<div class="card'+(tone?' '+tone:'')+'"><b>'+title+' <span class="muted">'+list.length+'</span></b>'+
        (list.length?'<ul class="hl">'+list.map(item).join('')+'</ul>':'<p class="muted" style="margin:6px 0 0">'+empty+'</p>')+'</div>';
    }
    var h='<style>.hl{list-style:none;margin:8px 0 0;padding:0}.hl li{padding:8px 0;border-top:1px dashed var(--line)}.hl li:first-child{border-top:0}'+
      '.it{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}.it a{color:var(--ink);text-decoration:none;font-weight:600;overflow-wrap:anywhere;min-width:0}.it a:hover{text-decoration:underline}'+
      '.core{font-size:11px;font-weight:800;border-radius:5px;padding:0 5px;background:var(--bad-bg);color:var(--bad)}'+
      '.why{font-size:12.5px;color:var(--ink-soft);margin-top:2px;overflow-wrap:anywhere}.src{font-size:11px;color:var(--ink-faint)}'+
      '.card.warnc{border-color:var(--warn)}.card.badc{border-color:var(--bad)}.fold-h{cursor:pointer;font-weight:700;list-style:none}.fold-h::-webkit-details-marker{display:none}'+
      '.g4 .tile span{font-size:18px}.cta{display:inline-block;margin-top:8px;text-decoration:none}</style>'+
      '<h1 class="pt">오늘 할 일</h1>';
    if(!td&&!st) h+='<div class="card muted">문서를 못 불러왔어요 (서버에 아직 없으면 sync_hub.py 실행 필요)</div>';

    /* 1. 할 일 두 칸: 나 / Claude */
    var mine=pick(function(x){return x.m.s==='act'&&/사용자/.test(x.m.o||'')});
    var claude=pick(function(x){return x.m.s==='act'&&/Claude/i.test(x.m.o||'')});
    h+='<div class="grid g2">'+box('🙋 내가 할 일',mine,'지금 내가 할 일은 없어요','warnc')+box('🤖 Claude가 할 일',claude,'Claude 몫으로 남은 일은 없어요')+'</div>';

    /* 2. 출시를 막는 것: 출시 점검표 맨 위 요약 + 아직 안 해 본 점검 */
    var bk=sec(pf,/출시를 막는/),unrun=pick(function(x){return x.src==='preflight'&&x.m.s==='act'});
    h+='<div class="sec-h">🚀 출시를 막는 것</div><div class="card badc">'+
      (bk?lines(bk).map(function(x){return '<div style="margin-bottom:4px">'+md(x)+'</div>'}).join(''):'<span class="muted">출시 점검표에 요약이 없어요</span>')+
      (unrun.length?'<div class="muted" style="margin-top:8px;font-size:12.5px">아직 안 해 본 출시 점검 '+unrun.length+'개: '+unrun.map(function(x){return esc(String(x.t).replace(/\*\*/g,''))}).join(' · ')+'</div>':'')+
      '<a class="btn cta" href="#/launch">출시 준비 열기</a></div>';

    /* 3. 기다리는 중 (접힘) */
    var wait=pick(function(x){return x.m.s==='wait'||x.m.s==='bad'});
    if(wait.length) h+='<details class="card" style="margin-top:10px"><summary class="fold-h">⏳ 조건이 생기면 할 일 '+wait.length+'개 ▾ <span class="muted" style="font-weight:500">(지금은 손댈 수 없음)</span></summary><ul class="hl">'+wait.map(item).join('')+'</ul></details>';

    /* 4. 지금 숫자 (관제실과 같은 값, 작게) */
    var s=live&&live.data&&(Array.isArray(live.data)?live.data[0]:live.data);
    h+='<div class="sec-h">📊 지금 숫자 <span class="muted" style="font-weight:500">(자세한 건 관제실)</span></div>';
    if(s){
      h+='<div class="grid g4">'+
        '<div class="tile"><b>오늘 들어온 사람</b><span>'+won(s.dau_today)+'</span></div>'+
        '<div class="tile"><b>오늘 내준 돈</b><span>'+won(s.today_payout_krw)+'원</span></div>'+
        '<div class="tile"><b>전체 가입자</b><span>'+won(s.total_users)+'</span></div>'+
        '<div class="tile"><b>쌓여 있는 캐시 잔액</b><span>'+won(s.outstanding_balance_krw)+'원</span></div></div>';
      if(s.alert_outstanding||s.alert_annual) h+='<div class="card badc" style="margin-top:8px"><b style="color:var(--bad)">⚠ 전자금융거래법 기준 경보</b> — 관제실에서 확인하세요.</div>';
    }else h+='<div class="card muted">실시간 숫자를 못 불러왔어요'+(live&&live.error?': '+esc(live.error.message):(res[4].reason?': '+esc(res[4].reason.message):''))+'</div>';

    /* 5. 앱 품질 점검판 한 줄 */
    if(cl){
      var n={open:0,part:0,done:0},hi=0;
      ((cl.body||{}).CATS||[]).forEach(function(c){(c.items||[]).forEach(function(it){var k=(it.st==='done'||it.st==='part')?it.st:'open';n[k]++;if(k==='open'&&it.lv==='hi')hi++})});
      h+='<div class="card" style="margin-top:10px"><b>✅ 앱 품질 점검판</b> <span class="muted">남은 것 '+n.open+'(그중 중요 '+hi+') · 일부 됨 '+n.part+' · 끝남 '+n.done+'</span> <a href="#/checklist">열기</a></div>';
    }

    /* 6. 지금 상태 한 줄 + 대기 작업 블록(접힘) */
    var one=lines(sec(st,/^1\./)).join(' '),q=sec(st,/^0\./);
    if(one||q) h+='<details class="card" style="margin-top:10px"><summary class="fold-h">📋 현재 상태 문서 첫머리 ▾ <span class="muted" style="font-weight:500">(원본 그대로, 오래됐을 수 있음)</span></summary>'+
      (one?'<p class="muted" style="margin:8px 0 0">'+md(one)+'</p>':'')+
      (q?'<div class="muted" style="margin-top:8px"><b>'+esc(q.h)+'</b>'+lines(q).map(function(x){return '<div>'+md(x)+'</div>'}).join('')+'</div>':'')+'</details>';

    /* 7. 문서 반영 시각 */
    if(docs.length){
      var names={todo:'할 일 장부',status:'현재 상태',preflight:'출시 점검표',checklist:'품질 점검판',vendors:'업체'};
      h+='<div class="muted" style="font-size:12px;margin-top:14px">서버에 올린 시각: '+docs.filter(function(d){return names[d.key]}).map(function(d){return esc(names[d.key])+' '+esc(ctx.ago(d.updated_at))}).join(' · ')+
        '<br>오래돼 보이면 Claude에게 "관리센터 갱신해줘"라고 말씀하세요.</div>';
    }
    root.innerHTML=h;
  }};
})();

/* 점검판: Fable 종합 평가 항목을 분류별로 나열하고, 누르면 쉬운 설명(비유 → 무슨 일 → 고치는 법)을 보여 준다. */
(function(){
  var LV={hi:'높음',mid:'중간',lo:'낮음'}, ST={done:'완료',part:'부분 완료'};
  var STH={done:'완료 — 확인까지 끝남',part:'부분 완료 — 아직 못 끝낸 이유'};
  window.PAGES.checklist={render:async function(root,ctx){
    var esc=ctx.esc,md=ctx.md;
    var doc=await ctx.getDoc('checklist',true), CATS=(doc.body||{}).CATS||[], TOP=(doc.body||{}).TOP||[];
    var byId={}, n={open:0,part:0,done:0}, lv={hi:0,mid:0,lo:0};
    CATS.forEach(function(c){c.items=c.items||[];c.items.forEach(function(it){byId[it.id]=it;var k=(it.st==='done'||it.st==='part')?it.st:'open';n[k]++;if(k==='open'&&lv[it.lv]!=null)lv[it.lv]++})});
    var filter='open';
    root.innerHTML='<style>'+
      '.cl{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.9fr);gap:14px;align-items:start}'+
      '@media (max-width:900px){.cl{grid-template-columns:1fr}.det{position:static!important;max-height:none!important}}'+
      '.fl{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.fl button{border:1px solid var(--line);border-radius:99px;padding:3px 12px;font-size:12.5px;font-weight:600;background:var(--surface);color:var(--ink-soft)}.fl button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}'+
      '.cat{margin-bottom:14px}.cat h2{font-size:12.5px;margin:0 0 6px;color:var(--ink-soft);letter-spacing:.04em}'+
      '.it{display:flex;gap:8px;align-items:flex-start;width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);margin-bottom:5px}.it:hover{background:var(--surface-2)}.it[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}'+
      '.pl{flex:none;font-size:11px;font-weight:800;border-radius:5px;padding:1px 6px;min-width:3em;text-align:center}.pl.hi{background:var(--bad-bg);color:var(--bad)}.pl.mid{background:var(--warn-bg);color:var(--warn)}.pl.lo{background:var(--surface-2);color:var(--ink-soft)}.pl.done{background:var(--good);color:var(--accent-ink)}.pl.part{background:var(--warn-bg);color:var(--warn);border:1px dashed var(--warn)}'+
      '.it.done .tt{text-decoration:line-through;text-decoration-color:var(--bad);text-decoration-thickness:2px;color:var(--ink-soft)}'+
      '.det{position:sticky;top:12px;max-height:calc(100vh - 90px);overflow:auto}.det h3{margin:0 0 6px;font-size:16px;line-height:1.35}'+
      '.bk{margin-top:10px}.bk b{display:block;font-size:11.5px;color:var(--ink-soft);letter-spacing:.04em;margin-bottom:2px}.bk p,.bk ul{margin:0}.bk ul{padding-left:18px}'+
      '.sim{background:var(--surface-2);border-radius:8px;padding:8px 10px}.sim p{font-weight:600}.stbox{border-radius:8px;padding:8px 10px}.stbox.done{background:var(--good-bg)}.stbox.part{background:var(--warn-bg)}'+
      '.tech{margin-top:12px;border-top:1px dashed var(--line);padding-top:8px;font-size:12px;color:var(--ink-soft)}'+
      '</style>'+
      '<h1 class="pt">점검판</h1><p class="sub">Fable 종합 평가(코드·문서를 읽은 평가, 앱을 직접 돌려 본 건 아님) · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
      '<div class="grid g4" style="margin-bottom:12px">'+
        '<div class="tile"><b>미해결</b><span>'+n.open+'</span></div>'+
        '<div class="tile"><b>부분 완료</b><span>'+n.part+'</span></div>'+
        '<div class="tile"><b>완료</b><span>'+n.done+'</span></div>'+
        '<div class="tile"><b>미해결 중 높음 / 중간 / 낮음</b><span>'+lv.hi+' / '+lv.mid+' / '+lv.lo+'</span></div></div>'+
      '<div class="sec-h" style="margin-top:6px">출시 전 TOP 5</div><div id="top5" class="grid g2" style="margin-bottom:6px"></div>'+
      '<div class="fl" id="fl"></div><div class="cl"><div id="lists"></div><aside class="card det" id="det" aria-live="polite"><span class="muted">항목을 누르면 쉬운 설명이 나와요.</span></aside></div>';

    var det=root.querySelector('#det'), lists=root.querySelector('#lists'), sel=null;
    function show(id){
      var it=byId[id]; if(!it) return; sel=id;
      lists.querySelectorAll('.it').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false')});
      var h='<h3>'+esc(it.t)+'</h3><div><span class="pl '+(it.st||it.lv)+'">'+(it.st?ST[it.st]:LV[it.lv])+'</span> <span class="muted" style="font-size:12px">담당: '+esc(it.who||'')+'</span></div>';
      if(it.st) h+='<div class="bk stbox '+it.st+'"><b>'+STH[it.st]+'</b><p>'+md(it.why||'')+'</p></div>';
      h+='<div class="bk sim"><b>한마디로</b><p>'+md(it.sim||'')+'</p></div>';
      h+='<div class="bk"><b>무슨 일이 생기나</b><p>'+md(it.now||'')+'</p></div>';
      h+='<div class="bk"><b>이렇게 고쳐요</b><p>'+md(it.chg||'')+'</p></div>';
      h+='<div class="bk"><b>다른 방법</b><ul>'+(it.alt||[]).map(function(a){return '<li>'+md(a)+'</li>'}).join('')+'</ul></div>';
      if(it.tech) h+='<p class="tech">원래 기술 이름: '+esc(it.tech)+'</p>';
      det.innerHTML=h; det.scrollTop=0;
      if(window.matchMedia('(max-width:900px)').matches) det.scrollIntoView({block:'start',behavior:'smooth'});
    }
    function draw(){
      lists.innerHTML='';
      CATS.forEach(function(c){
        var items=c.items.filter(function(it){return filter==='all'||(filter==='open'&&!it.st)||(filter==='part'&&it.st==='part')||(filter==='done'&&it.st==='done')});
        if(!items.length) return;
        var d=document.createElement('div');d.className='cat';d.innerHTML='<h2>'+esc(c.name)+' · '+items.length+'건</h2>';
        items.forEach(function(it){
          var b=document.createElement('button');b.type='button';b.className='it'+(it.st?' '+it.st:'');b.dataset.id=it.id;b.setAttribute('aria-pressed',sel===it.id?'true':'false');
          b.innerHTML='<span class="pl '+(it.st||it.lv)+'">'+(it.st?ST[it.st]:(LV[it.lv]||''))+'</span><span class="tt">'+esc(it.t)+'</span>';
          b.onclick=function(){show(it.id)};d.appendChild(b);
        });
        lists.appendChild(d);
      });
      if(!lists.children.length) lists.innerHTML='<div class="muted">해당 항목이 없어요.</div>';
    }
    var fl=root.querySelector('#fl');
    [['open','미해결 '+n.open],['part','부분 완료 '+n.part],['done','완료 '+n.done],['all','전체 '+(n.open+n.part+n.done)]].forEach(function(f){
      var b=document.createElement('button');b.type='button';b.textContent=f[1];b.setAttribute('aria-pressed',f[0]===filter?'true':'false');
      b.onclick=function(){filter=f[0];fl.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');draw()};
      fl.appendChild(b);
    });
    var t5=root.querySelector('#top5');
    TOP.forEach(function(x,i){
      var it=byId[x[1]],b=document.createElement('button');b.type='button';b.className='it'+(it&&it.st?' '+it.st:'');
      b.innerHTML='<span class="pl '+(it&&it.st?it.st:'mid')+'">'+(i+1)+'</span><span class="tt">'+esc(x[0])+'</span>';
      b.onclick=function(){show(x[1])};t5.appendChild(b);
    });
    draw();
    var first=null;CATS.some(function(c){return c.items.some(function(it){if(!it.st){first=it.id;return true}})});
    if(first) show(first);
  }};
})();

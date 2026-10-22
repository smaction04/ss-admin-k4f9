/* 디자인 시안: 서버 문서 'design_html'의 HTML 파일을 원본 그대로 sandbox iframe(srcdoc)에 보여 준다.
   sandbox="" 라 스크립트·외부 접근이 모두 막힌다(시안은 정적 HTML).
   status가 '보관'인 항목은 "이전 버전" 접이식 칸에 모은다(최신·확정만 위쪽 탭). */
(function(){
  window.PAGES.design={render:async function(root,ctx){
    var esc=ctx.esc;
    var doc=await ctx.getDoc('design_html',true), items=(doc.body||{}).items||[];
    root.innerHTML='<style>.dtab{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.dold{margin:0 0 10px}.dold>summary{cursor:pointer;font-weight:700;color:var(--ink-soft);padding:4px 0}.dold .dtab{margin:6px 0 0}.dfr{width:100%;height:calc(100vh - 190px);min-height:520px;border:1px solid var(--line);border-radius:12px;background:#fff}.dst{font-size:11px;opacity:.7;margin-left:4px}</style>'+
      '<h1 class="pt">디자인 시안</h1><p class="sub">원본 HTML 그대로 · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
      '<div class="dtab" id="dt"></div><details class="dold" id="do" hidden><summary>이전 버전 ▾</summary><div class="dtab" id="dd"></div></details>'+
      '<iframe class="dfr" id="df" sandbox="" title="디자인 시안"></iframe>';
    var tabs=root.querySelector('#dt'),olds=root.querySelector('#dd'),box=root.querySelector('#do'),fr=root.querySelector('#df');
    if(!items.length){tabs.innerHTML='<div class="card muted">시안이 아직 서버에 없어요 (sync_hub.py 실행 필요)</div>';return}
    var btns=[];
    function show(i){
      fr.srcdoc=items[i].html;
      btns.forEach(function(b,j){b.className='btn'+(j===i?' primary':'')});
      if(items[i].status==='보관') box.open=true;
    }
    items.forEach(function(it,i){
      var b=document.createElement('button');
      b.innerHTML=esc(it.name)+(it.status?'<span class="dst">'+esc(it.status)+'</span>':'');
      b.onclick=function(){show(i)};
      btns.push(b);
      if(it.status==='보관'){olds.appendChild(b);box.hidden=false}else tabs.appendChild(b);
    });
    show(0);
  }};
})();

/* 디자인 시안: 서버 문서 'design_html'의 HTML 파일을 원본 그대로 sandbox iframe(srcdoc)에 보여 준다.
   sandbox="" 라 스크립트·외부 접근이 모두 막힌다(시안은 정적 HTML). */
(function(){
  window.PAGES.design={render:async function(root,ctx){
    var esc=ctx.esc;
    var doc=await ctx.getDoc('design_html',true), items=(doc.body||{}).items||[];
    root.innerHTML='<style>.dtab{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.dtab button{cursor:pointer}.dfr{width:100%;height:calc(100vh - 190px);min-height:520px;border:1px solid var(--line);border-radius:12px;background:#fff}</style>'+
      '<h1 class="pt">디자인 시안</h1><p class="sub">원본 HTML 그대로 · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
      '<div class="dtab" id="dt"></div><iframe class="dfr" id="df" sandbox="" title="디자인 시안"></iframe>';
    var tabs=root.querySelector('#dt'),fr=root.querySelector('#df');
    if(!items.length){tabs.innerHTML='<div class="card muted">시안이 아직 서버에 없어요 (sync_hub.py 실행 필요)</div>';return}
    function show(i){
      fr.srcdoc=items[i].html;
      Array.prototype.forEach.call(tabs.children,function(b,j){b.className='btn'+(j===i?' primary':'')});
    }
    items.forEach(function(it,i){
      var b=document.createElement('button');b.textContent=it.name;b.onclick=function(){show(i)};tabs.appendChild(b);
    });
    show(0);
  }};
})();

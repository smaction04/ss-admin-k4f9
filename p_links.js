/* 바로가기: 운영에 쓰는 바깥 사이트 모음. 서버 문서 'links'를 그린다(주소는 sync_hub.py의 LINKS에서 고친다). */
(function(){
  window.PAGES.links={render:async function(root,ctx){
    var esc=ctx.esc,md=ctx.md;
    var doc=await ctx.getDoc('links',true), groups=doc.body.groups||[];
    var h='<style>.lk{display:block;text-decoration:none;color:inherit;padding:10px 14px}.lk:hover{background:var(--surface-2)}.lk b{display:block}.lk span{font-size:12px;color:var(--ink-soft)}</style>'+
      '<h1 class="pt">바로가기</h1><p class="sub">운영에 쓰는 바깥 사이트 · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>';
    groups.forEach(function(g){
      h+='<div class="sec-h">'+esc(g.name)+'</div><div class="grid g2">';
      (g.items||[]).forEach(function(it){
        if(!/^https?:\/\//.test(it.url||'')) return;
        h+='<a class="card lk" href="'+esc(it.url)+'" target="_blank" rel="noopener"><b>'+esc(it.name)+'</b><span>'+md(it.note||'')+'</span></a>';
      });
      h+='</div>';
    });
    root.innerHTML=h;
  }};
})();

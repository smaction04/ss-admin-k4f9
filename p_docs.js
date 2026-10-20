/* 문서형 메뉴 4개(현황·출시 점검·업체·결정·대기)가 같이 쓰는 그림틀.
   서버 문서(sync_hub.py가 STATUS/PREFLIGHT/보류_할일 .md를 쪼개 올린 것)를 구역 → 카드로 그린다. */
(function(){
  /* 메뉴별 설정: 어느 문서의 어느 구역을 보여 줄지 */
  var CFG={
    status:{key:'status',title:'현황',sub:'STATUS.md — 새 세션이 제일 먼저 읽는 "현재 상태 한 장"',
      pick:function(h){return !/^4\./.test(h)}},
    vendors:{key:'status',title:'업체',sub:'광고·기프티콘 업체 접점 (STATUS 4절) + 외부 회신 대기',
      pick:function(h){return /^4\./.test(h)||/^5\./.test(h)}},
    preflight:{key:'preflight',title:'출시 점검',sub:'PREFLIGHT.md — 출시 직전 체크리스트와 사전 점검 기록',
      pick:function(){return true}},
    todo:{key:'todo',title:'결정·대기',sub:'보류_할일.md — 사용자 결정·외부 회신·내가 할 일',
      pick:function(){return true}}
  };

  function tone(text){
    var t=String(text||'').slice(0,40).toLowerCase();
    if(/failed|blocked|막힘|반려|실패/.test(t)) return 'bad';
    if(/not_run|대기|hold|wait|보류|미결|미착수|진행 ?중|일부|부분/.test(t)) return 'warn';
    if(/passed|done|완료|확인함|통과|종결|해소|\bok\b/.test(t)) return 'good';
    return '';
  }
  function plain(s){return String(s||'').replace(/\*\*|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')}

  function card(ctx,cols,row){
    var esc=ctx.esc,md=ctx.md;
    var title=plain(row[0]).slice(0,120)||'(제목 없음)';
    var stCol=row.length>=3?1:-1;
    var st=stCol>=0?row[stCol]:'';
    var chipText=plain(st).split(/[\/(,;·]/)[0].trim().slice(0,22);
    var d=document.createElement('details');d.className='card dc';
    var h='<summary><span class="dt">'+md(row[0].length>120?row[0].slice(0,120)+'…':row[0])+'</span>'+
      (st&&chipText?'<span class="chip '+tone(st)+'">'+esc(chipText)+'</span>':'')+'</summary><div class="db">';
    for(var i=1;i<row.length;i++){
      if(!row[i]) continue;
      h+='<div class="dr"><b>'+esc(cols[i]||'')+'</b><div>'+md(row[i])+'</div></div>';
    }
    d.innerHTML=h+'</div>';
    d.dataset.q=plain(row.join(' ')).toLowerCase();
    return d;
  }

  ['status','vendors','preflight','todo'].forEach(function(name){
    window.PAGES[name]={render:async function(root,ctx,page){
      var cfg=CFG[page],esc=ctx.esc,md=ctx.md;
      var doc=await ctx.getDoc(cfg.key,true);
      var secs=(doc.body.sections||[]).filter(function(s){return cfg.pick(s.h||'')});
      root.innerHTML='<style>.dc{padding:0;margin-bottom:6px}.dc summary{list-style:none;cursor:pointer;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px}.dc summary::-webkit-details-marker{display:none}.dc .dt{font-weight:600;min-width:0;overflow-wrap:anywhere}.db{padding:0 14px 12px;border-top:1px dashed var(--line)}.dr{margin-top:8px}.dr b{display:block;font-size:11.5px;color:var(--ink-soft);margin-bottom:1px}.dr div{overflow-wrap:anywhere}.sec{margin-top:18px}.sec>summary{cursor:pointer;font-weight:800;font-size:15px;padding:6px 0}.note{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 12px;margin:0 0 6px;overflow-wrap:anywhere}.warnbox{border-color:var(--warn);background:var(--warn-bg)}</style>'+
        '<h1 class="pt">'+esc(cfg.title)+'</h1><p class="sub">'+esc(cfg.sub)+' · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
        '<input class="search" id="q" type="search" placeholder="검색 (예: TNK, 기프티쇼, 광고)" aria-label="검색">';
      var host=document.createElement('div');root.appendChild(host);
      secs.forEach(function(s,idx){
        var wrap=document.createElement('details');wrap.className='sec';
        wrap.open=idx<2||/^0\./.test(s.h||'')||/다음 할 일|지금 출시를 막는/.test(s.h||'');
        var n=0;
        var inner=document.createElement('div');
        (s.paras||[]).forEach(function(p){var e=document.createElement('div');e.className='note'+(/^0\./.test(s.h||'')?' warnbox':'');e.innerHTML=md(p);e.dataset.q=plain(p).toLowerCase();inner.appendChild(e);n++});
        (s.tables||[]).forEach(function(t){(t.rows||[]).forEach(function(r){inner.appendChild(card(ctx,t.cols||[],r));n++})});
        (s.bullets||[]).forEach(function(b){var e=document.createElement('div');e.className='note';e.innerHTML=md(b);e.dataset.q=plain(b).toLowerCase();inner.appendChild(e);n++});
        if(!n) return;
        wrap.innerHTML='<summary>'+esc((s.h||'(머리말)').replace(/^#+\s*/,''))+' <span class="muted" style="font-weight:500">'+n+'</span></summary>';
        wrap.appendChild(inner);host.appendChild(wrap);
      });
      var q=root.querySelector('#q');
      q.addEventListener('input',function(){
        var v=q.value.trim().toLowerCase();
        host.querySelectorAll('details.sec').forEach(function(sec){
          var any=false;
          sec.querySelectorAll('[data-q]').forEach(function(el){var hit=!v||el.dataset.q.indexOf(v)>=0;el.hidden=!hit;if(hit)any=true});
          sec.hidden=!any;if(v&&any)sec.open=true;
        });
      });
    }};
  });
})();

/* 업체: 서버 문서 'vendors'(data/vendors.json + STATUS 4절 원문 행)를 상태 그룹별로 그린다.
   기준: 관리센터/분류기준.md — 할 일 → 진행·유지 → 대기 → (접힘) 종결·보류. 카드는 이름+상태+중요도+한 줄 요약+다음 할 일+마지막 접점, 펼치면 원문 전문과 분류 근거. */
(function(){
  var PRIO_ORDER={core:0,aux:1,ref:2};
  var TONE={act:'s-act',keep:'s-keep',wait:'s-wait',closed:'s-hold',unsorted:'s-bad'};
  function plain(s){return String(s||'').replace(/\*\*|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')}

  window.PAGES.vendors={render:async function(root,ctx){
    var esc=ctx.esc,md=ctx.md;
    var doc=await ctx.getDoc('vendors',true), body=doc.body||{}, groups=body.groups||[], items=body.items||[];
    var ROLE=body.roles||{}, PR=body.prio||{};
    var cnt={core:0,act:0,keep:0,wait:0,closed:0,unsorted:0};
    items.forEach(function(it){if(it.prio==='core')cnt.core++;if(cnt[it.group]!=null)cnt[it.group]++});

    root.innerHTML='<style>'+
      '.vc{padding:12px 14px;margin-bottom:8px}.vh{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.vh b{font-size:15px}'+
      '.role{font-size:11px;color:var(--ink-soft);border:1px solid var(--line);border-radius:5px;padding:0 6px}'+
      '.pr{font-size:11px;font-weight:800;border-radius:5px;padding:0 6px}.pr.core{background:var(--bad-bg);color:var(--bad)}.pr.aux{background:var(--surface-2);color:var(--ink-soft)}.pr.ref{color:var(--ink-faint)}'+
      '.chip.s-act{background:var(--warn-bg);color:var(--warn)}.chip.s-keep{background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent)}.chip.s-wait{border:1px dashed var(--line);background:transparent;color:var(--ink-soft)}.chip.s-hold{color:var(--ink-faint)}.chip.s-bad{background:var(--bad-bg);color:var(--bad)}'+
      '.vs{margin:6px 0 4px;overflow-wrap:anywhere}.vn{display:grid;grid-template-columns:5.5em 1fr;gap:2px 8px;font-size:13px;margin-top:6px}.vn b{color:var(--ink-soft);font-weight:600;font-size:11.5px;padding-top:2px}.vn div{overflow-wrap:anywhere}'+
      '.vd{margin-top:8px}.vd>summary{cursor:pointer;font-size:12px;color:var(--accent);list-style:none}.vd>summary::-webkit-details-marker{display:none}.vd .dr{margin-top:8px}.vd .dr>b{display:block;font-size:11.5px;color:var(--ink-soft)}.vd .dr>div{overflow-wrap:anywhere;font-size:13px}.why{margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--surface-2);font-size:12.5px}'+
      '.sec{margin-top:18px}.sec>summary{cursor:pointer;font-weight:800;font-size:15px;padding:6px 0;list-style:none}.sec>summary::-webkit-details-marker{display:none}.sec>summary .muted{font-weight:500}.sec .gd{font-size:12.5px;color:var(--ink-soft);margin:0 0 8px}'+
      '.fl{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.fl button{border:1px solid var(--line);border-radius:99px;padding:3px 12px;font-size:12.5px;font-weight:600;background:var(--surface);color:var(--ink-soft)}.fl button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}'+
      '.empty{color:var(--ink-soft);font-size:13px;padding:6px 0}'+
      '</style>'+
      '<h1 class="pt">업체</h1><p class="sub">광고·기프티콘 업체 관계 — 원문은 STATUS.md 4절(펼치면 전문) · 분류 기준은 관리센터/분류기준.md · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
      '<div class="fl" id="fl"></div>'+
      '<input class="search" id="q" type="search" placeholder="검색 (예: TNK, 기프티쇼, 정산)" aria-label="검색">';
    var host=document.createElement('div');root.appendChild(host);

    function card(it){
      var d=document.createElement('div');d.className='card vc';d.dataset.g=it.group;
      var label=it.state_label||(groups.filter(function(g){return g.id===it.group})[0]||{}).name||it.group;
      var h='<div class="vh"><b>'+esc(it.name)+'</b>'+
        '<span class="chip '+(TONE[it.group]||'')+'">'+esc(label)+'</span>'+
        (it.prio?'<span class="pr '+esc(it.prio)+'">'+esc(PR[it.prio]||it.prio)+'</span>':'')+
        (it.role?'<span class="role">'+esc(ROLE[it.role]||it.role)+'</span>':'')+'</div>'+
        '<div class="vs">'+md(it.summary||'')+'</div>'+
        '<div class="vn">'+
          '<b>다음 할 일</b><div>'+(it.next?md(it.next):'<span class="muted">없음</span>')+'</div>'+
          '<b>담당</b><div>'+esc(it.owner||'-')+'</div>'+
          '<b>마지막 접점</b><div>'+md(it.last||'-')+'</div></div>';
      var dt=it.detail||{}, rows=dt.row?[dt.row]:(dt.row_static||[]), cols=dt.cols||[];
      var dh='';
      rows.forEach(function(r){
        if(dt.row){for(var i=0;i<r.length;i++){if(!r[i])continue;dh+='<div class="dr"><b>'+esc(cols[i]||'')+'</b><div>'+md(r[i])+'</div></div>'}}
        else dh+='<div class="dr"><b>'+esc(r[0])+'</b><div>'+md(r[1]||'')+'</div></div>';
      });
      if(it.why) dh+='<div class="why"><b>이렇게 분류한 이유</b> — '+md(it.why)+'</div>';
      if(it.refs&&it.refs.length) dh+='<div class="muted" style="font-size:12px;margin-top:6px">관련: '+it.refs.map(esc).join(' · ')+'</div>';
      h+='<details class="vd"><summary>원문 전문·분류 근거 ▾</summary>'+dh+'</details>';
      d.innerHTML=h;
      d.dataset.q=plain([it.name,it.summary,it.next,it.last,it.owner,it.why].concat(rows.map(function(r){return r.join(' ')})).join(' ')).toLowerCase();
      return d;
    }

    groups.forEach(function(g){
      var list=items.filter(function(it){return it.group===g.id});
      if(!list.length&&g.id!=='act') return;
      list.sort(function(a,b){return (PRIO_ORDER[a.prio]||1)-(PRIO_ORDER[b.prio]||1)});
      var sec=document.createElement('details');sec.className='sec';sec.dataset.g=g.id;sec.open=!g.collapsed;
      sec.innerHTML='<summary>'+esc(g.name)+' <span class="muted">'+list.length+'</span></summary><p class="gd">'+esc(g.desc||'')+'</p>';
      if(!list.length){var e=document.createElement('div');e.className='empty';e.textContent='지금 업체 쪽에서 당장 할 일은 없어요. 다음 시점은 "진행·유지 중" 카드의 다음 할 일을 보세요.';sec.appendChild(e)}
      list.forEach(function(it){sec.appendChild(card(it))});
      host.appendChild(sec);
    });

    /* 요약 칩 = 필터 */
    var filter='all', fl=root.querySelector('#fl'), q=root.querySelector('#q');
    function apply(){
      var v=q.value.trim().toLowerCase();
      host.querySelectorAll('details.sec').forEach(function(sec){
        var any=false;
        sec.querySelectorAll('.vc').forEach(function(el){
          var hit=(!v||el.dataset.q.indexOf(v)>=0)&&(filter==='all'||filter==='core'&&/핵심/.test(el.querySelector('.pr')?el.querySelector('.pr').textContent:'')||el.dataset.g===filter);
          el.hidden=!hit;if(hit)any=true;
        });
        sec.hidden=!any&&!(filter==='all'&&!v&&sec.dataset.g==='act');
        if((v||filter!=='all')&&any) sec.open=true;
      });
    }
    [['all','전체 '+items.length],['core','핵심 '+cnt.core],['act','할 일 '+cnt.act],['keep','진행·유지 '+cnt.keep],['wait','대기 '+cnt.wait],['closed','종결·보류 '+cnt.closed]].forEach(function(f){
      var b=document.createElement('button');b.type='button';b.textContent=f[1];b.setAttribute('aria-pressed',f[0]===filter?'true':'false');
      b.onclick=function(){filter=f[0];fl.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');apply()};
      fl.appendChild(b);
    });
    q.addEventListener('input',apply);
  }};
})();

/* 문서형 메뉴(현황·출시 점검·결정·대기 + 읽는 가이드 문서)가 같이 쓰는 그림틀.
   서버 문서(sync_hub.py가 .md를 쪼개 올린 것)를 구역 → 카드로 그린다.
   관리용 문서(현황·출시 점검·결정·대기)는 sync_hub.py(classify.py)가 행마다 붙인 꼬리표(meta: s 상태·o 담당·p 중요도·l 표시 글자)로
   그룹(할 일 → 진행 중 → 대기 → 막힘 → 접힘: 보류·완료·참고)을 나눠 보여 준다. 기준: 관리센터/분류기준.md. 원문 글자는 그대로다.
   읽는 문서(guide_*, ordered)는 글 순서 그대로 보여 준다. */
(function(){
  var CFG={
    status:{key:'status',title:'현황',sub:'STATUS.md — 새 세션이 제일 먼저 읽는 "현재 상태 한 장" (업체 표는 업체 메뉴로)',
      pick:function(h){return !/^4\./.test(h)}},
    preflight:{key:'preflight',title:'출시 점검',sub:'PREFLIGHT.md — "지금 출시를 막는 것"이 맨 위, 사전 점검 기록은 남은 것부터',
      pick:function(){return true}},
    todo:{key:'todo',title:'결정·대기',sub:'보류_할일.md — 할 일(사용자 결정·Claude 작업) → 진행 중 → 대기 → 접힘(보류·완료·기록)',
      pick:function(){return true}},
    guide_intro:{key:'guide_intro',title:'서비스 소개서',sub:'서비스소개서.md',ordered:true,pick:function(){return true}},
    guide_plan:{key:'guide_plan',title:'단독 실행 기획서',sub:'솔로실행기획서_fable.md — 전체 로드맵과 기획',ordered:true,pick:function(){return true}},
    guide_screen:{key:'guide_screen',title:'화면 설계',sub:'Phase1_화면가이드.md · Phase1_화면구성안.md',ordered:true,pick:function(){return true}},
    guide_gifti:{key:'guide_gifti',title:'기프티쇼 API',sub:'기프티쇼_API요점.md · 기프티쇼비즈_API_메모.md',ordered:true,pick:function(){return true}},
    guide_feedback:{key:'guide_feedback',title:'테스터 피드백',sub:'테스터피드백_수정기록.md — 받은 의견·고친 내용·신청서 초안',ordered:true,pick:function(){return true}},
    guide_design:{key:'guide_design',title:'디자인 개편안',sub:'디자인개편_제안서.md — 색·측정기·첫 진입 결정 3가지',ordered:true,pick:function(){return true}}
  };
  /* 상태 어휘(classify.py 와 같음) */
  var ORDER=['act','keep','wait','bad','hold','done','ref'];
  var LABEL={act:'할 일',keep:'진행 중',wait:'대기',bad:'막힘',hold:'보류',done:'완료',ref:'참고'};
  var FOLD={hold:1,done:1,ref:1};            // 기본 접히는 그룹
  var PRIO={core:'핵심',aux:'',ref:'참고'};

  function tone(text){
    var t=String(text||'').slice(0,40).toLowerCase();
    if(/failed|blocked|막힘|반려|실패/.test(t)) return 'bad';
    if(/not_run|대기|hold|wait|보류|미결|미착수|진행 ?중|일부|부분/.test(t)) return 'warn';
    if(/passed|done|완료|확인함|통과|종결|해소|\bok\b/.test(t)) return 'good';
    return '';
  }
  function plain(s){return String(s||'').replace(/\*\*|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')}
  function chipOf(esc,m){
    if(!m) return '';
    var h='<span class="chip s-'+esc(m.s)+'">'+esc(m.l||LABEL[m.s]||m.s)+'</span>';
    if(m.o) h+='<span class="own">'+esc(m.o)+'</span>';
    if(m.p==='core') h+='<span class="pr core">핵심</span>';
    return h;
  }

  function card(ctx,cols,row,m){
    var esc=ctx.esc,md=ctx.md;
    row=row.map(function(c){return c==null?'':String(c)});
    var stCol=row.length>=3?1:-1;
    var st=stCol>=0?row[stCol]:'';
    var chipText=plain(st).split(/[\/(,;·]/)[0].trim().slice(0,22);
    /* 첫 칸이 '#'(A1·C12 같은 번호)이면 제목 = 번호 + 항목 칸 */
    var idCol=/^#$/.test(String(cols[0]||'').trim())&&row.length>1;
    var title=idCol?row[0]+' · '+row[1]:row[0];
    if(idCol){st=row.length>=4?row[2]:'';}
    var d=document.createElement('details');d.className='card dc';if(m)d.dataset.s=m.s;
    var h='<summary><span class="dt">'+md(title.length>140?title.slice(0,140)+'…':title)+'</span><span class="ch">'+
      (m?chipOf(esc,m):(st&&chipText?'<span class="chip '+tone(st)+'">'+esc(chipText)+'</span>':''))+'</span></summary><div class="db">';
    for(var i=idCol?2:1;i<row.length;i++){
      if(!row[i]) continue;
      h+='<div class="dr"><b>'+esc(cols[i]||'')+'</b><div>'+md(row[i])+'</div></div>';
    }
    if(m&&m.n) h+='<div class="dr why"><b>이렇게 분류한 이유</b><div>'+md(m.n)+'</div></div>';
    d.innerHTML=h+'</div>';
    d.dataset.q=plain(row.join(' ')).toLowerCase();
    return d;
  }
  function note(ctx,text,cls,m){
    var e=document.createElement('div');e.className='note'+(cls?' '+cls:'');if(m)e.dataset.s=m.s;
    var body=text;
    if(/^\[ \]\s*/.test(text)) body='<span class="box">☐</span> '+ctx.md(text.replace(/^\[ \]\s*/,''));
    else if(/^\[x\]\s*/i.test(text)) body='<span class="box">☑</span> '+ctx.md(text.replace(/^\[x\]\s*/i,''));
    else body=ctx.md(text);
    e.innerHTML=(m?'<span class="ch nl">'+chipOf(ctx.esc,m)+'</span>':'')+body;
    e.dataset.q=plain(text).toLowerCase();
    return e;
  }
  /* 꼬리표가 있는 항목 묶음을 그룹별로 나눠 넣는다. 접히는 그룹은 "완료·종결 N ▾" 안에. 돌려주는 값: 상태별 개수 */
  function grouped(ctx,inner,els){
    var by={};els.forEach(function(x){(by[x.m.s]=by[x.m.s]||[]).push(x)});
    var n={},fold=document.createElement('details');fold.className='fold';var fn=0,fl=[];
    ORDER.forEach(function(s){
      var list=by[s];if(!list) return;n[s]=list.length;
      list.sort(function(a,b){return (a.m.p==='core'?0:1)-(b.m.p==='core'?0:1)});
      if(FOLD[s]){list.forEach(function(x){fold.appendChild(x.el)});fn+=list.length;fl.push(LABEL[s]+' '+list.length);return}
      var gh=document.createElement('div');gh.className='gh';gh.textContent=LABEL[s]+' '+list.length;inner.appendChild(gh);
      list.forEach(function(x){inner.appendChild(x.el)});
    });
    if(fn){var sm=document.createElement('summary');sm.textContent=fl.join(' · ')+' ▾';fold.insertBefore(sm,fold.firstChild);inner.appendChild(fold)}
    return n;
  }

  Object.keys(CFG).forEach(function(name){
    window.PAGES[name]={render:async function(root,ctx,page){
      var cfg=CFG[page],esc=ctx.esc,md=ctx.md;
      var doc=await ctx.getDoc(cfg.key,true);
      var secs=((doc.body||{}).sections||[]).filter(function(s){return cfg.pick(s.h||'')});
      /* 경보 절(0절·지금 출시를 막는 것)은 맨 위로 */
      secs=secs.filter(function(s){return s.kind==='alert'}).concat(secs.filter(function(s){return s.kind!=='alert'}));
      var total={};
      root.innerHTML='<style>.dc{padding:0;margin-bottom:6px}.dc summary{list-style:none;cursor:pointer;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px}.dc summary::-webkit-details-marker{display:none}.dc .dt{font-weight:600;min-width:0;overflow-wrap:anywhere}.ch{display:inline-flex;gap:5px;align-items:center;flex:none;flex-wrap:wrap;justify-content:flex-end}.ch.nl{float:right;margin:0 0 4px 8px}.db{padding:0 14px 12px;border-top:1px dashed var(--line)}.dr{margin-top:8px}.dr>b{display:block;font-size:11.5px;color:var(--ink-soft);margin-bottom:1px}.dr>div{overflow-wrap:anywhere}.dr.why{background:var(--surface-2);border-radius:8px;padding:6px 10px;font-size:12.5px}'+
        '.sec{margin-top:18px}.sec>summary{cursor:pointer;font-weight:800;font-size:15px;padding:6px 0;list-style:none}.sec>summary::-webkit-details-marker{display:none}.sec.alert{border:1px solid var(--warn);border-radius:12px;padding:4px 12px 8px;background:var(--warn-bg)}.sec.alert>summary{color:var(--warn)}'+
        '.note{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 12px;margin:0 0 6px;overflow-wrap:anywhere}.warnbox{border-color:var(--warn);background:var(--warn-bg)}.box{color:var(--ink-soft)}'+
        '.gh{font-size:12px;letter-spacing:.05em;color:var(--ink-soft);font-weight:700;margin:12px 0 6px}.fold{margin-top:10px}.fold>summary{cursor:pointer;font-size:12.5px;color:var(--ink-soft);font-weight:700;padding:4px 0;list-style:none}.fold>summary::-webkit-details-marker{display:none}.fold>summary::before{content:"▸ ";}.fold[open]>summary::before{content:"▾ "}'+
        '.chip.s-act{background:var(--warn-bg);color:var(--warn)}.chip.s-keep{background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent)}.chip.s-wait{border:1px dashed var(--line);background:transparent;color:var(--ink-soft)}.chip.s-hold{color:var(--ink-faint)}.chip.s-done{background:var(--good-bg);color:var(--good)}.chip.s-ref{color:var(--ink-faint)}.chip.s-bad{background:var(--bad-bg);color:var(--bad)}'+
        '.own{font-size:11px;color:var(--ink-soft);border:1px solid var(--line);border-radius:5px;padding:0 5px;white-space:nowrap}.pr{font-size:11px;font-weight:800;border-radius:5px;padding:0 5px}.pr.core{background:var(--bad-bg);color:var(--bad)}'+
        '.fl{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.fl button{border:1px solid var(--line);border-radius:99px;padding:3px 12px;font-size:12.5px;font-weight:600;background:var(--surface);color:var(--ink-soft)}.fl button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}</style>'+
        '<h1 class="pt">'+esc(cfg.title)+'</h1><p class="sub">'+esc(cfg.sub)+' · 서버 반영 '+esc(ctx.ago(doc.updated_at))+'</p>'+
        (cfg.ordered?'':'<div class="fl" id="fl"></div>')+
        '<input class="search" id="q" type="search" placeholder="검색 (예: TNK, 기프티쇼, 광고)" aria-label="검색">';
      var host=document.createElement('div');root.appendChild(host);
      secs.forEach(function(s,idx){
        var wrap=document.createElement('details');wrap.className='sec'+(s.kind==='alert'?' alert':'');
        var n=0, tagged=[], inner=document.createElement('div');
        if(cfg.ordered&&s.blocks){
          /* 읽는 문서: 글 순서 그대로 */
          s.blocks.forEach(function(b){
            if(b.k==='tb'){var t=(s.tables||[])[b.i];if(t)(t.rows||[]).forEach(function(r){inner.appendChild(card(ctx,t.cols||[],r));n++});return}
            inner.appendChild(note(ctx,(b.k==='li'?'• ':'')+b.x));n++;
          });
        }else{
          (s.paras||[]).forEach(function(p){inner.appendChild(note(ctx,p,s.kind==='alert'?'warnbox':''));n++});
          (s.tables||[]).forEach(function(t){(t.rows||[]).forEach(function(r,i){
            var m=t.meta&&t.meta[i];var el=card(ctx,t.cols||[],r,m);n++;
            if(m)tagged.push({el:el,m:m});else inner.appendChild(el);
          })});
          (s.bullets||[]).forEach(function(b,i){
            var m=s.bmeta&&s.bmeta[i];var el=note(ctx,b,'',m);n++;
            if(m)tagged.push({el:el,m:m});else inner.appendChild(el);
          });
          if(tagged.length){var cnt=grouped(ctx,inner,tagged);Object.keys(cnt).forEach(function(k){total[k]=(total[k]||0)+cnt[k]})}
        }
        if(!n) return;
        var openCnt=tagged.filter(function(x){return !FOLD[x.m.s]}).length;
        var hint=s.kind==='ref'?'참고':s.kind==='checklist'?'출시 직전 최종 점검표 — 아직 비움':s.kind==='log'?'시간순 일지(최신이 위) — 남은 일은 결정·대기 메뉴에서 관리':'';
        var tiny=!(s.tables||[]).length&&!(s.bullets||[]).length&&(s.paras||[]).length<=3;   // 한 줄·머리말 같은 짧은 절은 펼침
        wrap.open=cfg.ordered?idx<4:(s.kind==='alert'||(s.kind!=='ref'&&s.kind!=='checklist'&&s.kind!=='log'&&(tagged.length?openCnt>0:(idx<2||tiny))));
        wrap.innerHTML='<summary>'+esc((s.h||'(머리말)').replace(/^#+\s*/,''))+' <span class="muted" style="font-weight:500">'+(tagged.length?openCnt+'/'+n:n)+(hint?' · '+esc(hint):'')+'</span></summary>';
        wrap.appendChild(inner);host.appendChild(wrap);
      });
      if(!host.children.length) host.innerHTML='<div class="card muted" style="margin-top:14px">표시할 내용이 아직 서버에 없어요 (sync_hub.py 실행 필요)</div>';

      /* 검색 + 상태 필터 */
      var q=root.querySelector('#q'),fl=root.querySelector('#fl'),filter='all';
      function apply(){
        var v=q.value.trim().toLowerCase();
        host.querySelectorAll('details.sec').forEach(function(sec){
          var any=false;
          sec.querySelectorAll('[data-q]').forEach(function(el){
            var hit=(!v||el.dataset.q.indexOf(v)>=0)&&(filter==='all'||el.dataset.s===filter);
            el.hidden=!hit;if(hit)any=true;
          });
          sec.hidden=!any;
          if((v||filter!=='all')&&any){sec.open=true;sec.querySelectorAll('details.fold').forEach(function(f){f.open=true})}
        });
      }
      q.addEventListener('input',apply);
      if(fl){
        var all=0;Object.keys(total).forEach(function(k){all+=total[k]});
        [['all','전체 '+all]].concat(ORDER.filter(function(s){return total[s]}).map(function(s){return [s,LABEL[s]+' '+total[s]]})).forEach(function(f){
          var b=document.createElement('button');b.type='button';b.textContent=f[1];b.setAttribute('aria-pressed',f[0]===filter?'true':'false');
          b.onclick=function(){filter=f[0];fl.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');apply()};
          fl.appendChild(b);
        });
      }
    }};
  });
})();

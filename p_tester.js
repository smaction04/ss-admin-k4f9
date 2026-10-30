/* 테스터 관리: 신청자 한 사람당 한 줄로 "신청 → 명단 등록 → 앱 가입 → 기록 → 14일 달성"을 보는 화면.
   신청자 정보는 구글 폼 응답 시트에서 복사해 붙여넣으면 서버에 저장되고, 테스트가 끝나면 한 번에 모두 지운다. 30초마다 저절로 새로 불러온다. */
(function(){
  var APP='4976033012549514793';
  var LINKS=[
    ['① 누가 신청했나 보기','https://docs.google.com/forms/d/1HLYdYJsplR0TUMXbVhYCOiRjzId3IoD-408Yy2Wumkc/edit?authuser=1#responses','신청서를 낸 사람들의 이메일이 적혀 있어요. 맨 먼저 여기를 봐요.'],
    ['② 신청서 화면 (남에게 보내는 주소)','https://docs.google.com/forms/d/e/1FAIpQLSduUybiTX1rQgN_HHZNZ3CR4xPAQ-EG9OyiEobBpZPCDTpn2w/viewform','신청하려는 사람이 보는 화면이에요. 사람을 모을 때 이 주소를 보내요.'],
    ['③ 구글 플레이에 이름 올리기','https://play.google.com/console/u/1/developers/5868784087709381187/app/'+APP+'/closed-testing','신청한 사람의 이메일을 여기 명단에 적어야 그 사람이 앱을 받을 수 있어요.'],
    ['④ 설치 초대장 (등록 끝난 사람에게만)','https://play.google.com/apps/testing/com.sycompany.sleepsave','③에 이름을 올린 사람에게 보내는 주소예요. 이름이 없는 사람은 열어도 막혀요.']];
  var GOAL=12;
  var STATES=['전체','미참여','설치만','멈춤','참여중','달성','제외'];
  /* 상태별 배지 색 */
  var COLOR={
    '달성':'background:var(--good-bg);color:var(--good)',
    '참여중':'background:rgba(62,95,219,.18);color:var(--accent)',
    '설치만':'background:var(--warn-bg);color:var(--warn)',
    '멈춤':'background:rgba(240,130,40,.2);color:#E07A1A',
    '미참여':'background:var(--surface-2);color:var(--ink-soft)',
    '제외':'background:var(--surface-2);color:var(--ink-faint)'};
  window.PAGES.tester={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,timer=null,busy=false,filter='전체',data=null;
    root.innerHTML='<style>'+
      '.tt{width:100%;border-collapse:collapse;font-size:12.5px}.tt td,.tt th{padding:6px 5px;border-bottom:1px solid var(--line);vertical-align:middle;text-align:left}.tt th{font-size:12px;color:var(--ink-soft);white-space:nowrap}.tt tr:last-child td{border-bottom:0}.tt tr.ex td{opacity:.55}'+
      '.tw{overflow-x:auto}.sumrow{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center}.sumrow .n{display:inline-block;border-radius:8px;padding:3px 10px;font-weight:700;font-size:13px}'+
      '.fl{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.fl .btn.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}'+
      '.tt input.memo{width:140px;font-size:12px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--ink)}'+
      '.tt input[type=checkbox]{width:16px;height:16px}.sm{font-size:12px}'+
      '.lk{display:block;text-decoration:none;color:inherit;padding:10px 14px}.lk:hover{background:var(--surface-2)}.lk b{display:block}.lk span{font-size:12px;color:var(--ink-soft)}'+
      'details.card>summary{cursor:pointer;font-weight:700}details.card[open]>summary{margin-bottom:8px}'+
      '#tpaste{width:100%;min-height:90px;box-sizing:border-box;font-size:12px;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)}'+
      '</style>'+
      '<h1 class="pt">테스터 관리</h1><p class="sub">신청한 사람이 지금 어디까지 왔는지 한눈에 · 목표 '+GOAL+'명 이상</p>'+
      '<div id="tsum"></div>'+
      '<div class="muted sm" style="margin:6px 2px">구글 플레이 콘솔은 사람이 테스터 참여 링크를 눌렀는지 알려주지 않아요. 그래서 \'앱 가입\'과 \'기록\'을 보고 참여했는지 추정해요.</div>'+
      '<details class="card"><summary>상태는 이렇게 정해져요</summary><div class="muted sm" style="line-height:1.7">'+
      '<b>제외</b> 내가 빼기로 한 사람 · <b>달성</b> 14일 개근을 채움 · <b>미참여</b> 앱에 아직 가입 안 함 · <b>설치만</b> 가입은 했지만 출석·캐시 기록이 한 건도 없음 · <b>멈춤</b> 기록은 있는데 마지막 활동이 3일 넘게 없음 · <b>참여중</b> 기록이 있고 3일 안에 활동함</div></details>'+
      '<div class="fl" id="tfl"></div>'+
      '<div id="tbox"></div>'+
      '<details class="card" id="tpd"><summary>신청자 붙여넣기</summary>'+
      '<p class="muted sm" style="margin:0 0 6px">구글 폼 응답 시트에서 표(머리글 줄 포함)를 복사해 아래에 붙여 넣으세요. 이름·이메일·기기·타임스탬프 칸을 알아서 찾아요. 이미 있는 이메일은 새 내용으로 고쳐져요.</p>'+
      '<textarea id="tpaste" placeholder="여기에 붙여넣기"></textarea>'+
      '<div id="tprev" class="muted sm" style="margin:6px 0"></div>'+
      '<button class="btn primary" id="tsave" disabled>저장</button></details>'+
      '<details class="card"><summary>테스트 끝난 뒤 정리</summary>'+
      '<p class="muted sm" style="margin:0 0 8px">신청자 이름·이메일 같은 개인 정보는 테스트가 끝나면 지우는 게 좋아요. 누르면 되돌릴 수 없어요.</p>'+
      '<button class="btn" id="tclear" style="color:var(--bad)">테스트 끝났을 때 신청자 정보 모두 지우기</button></details>'+
      '<div class="sec-h">바로가기</div><div class="grid g2" id="tlk"></div>';
    var sumEl=root.querySelector('#tsum'),flEl=root.querySelector('#tfl'),box=root.querySelector('#tbox'),
        ta=root.querySelector('#tpaste'),prev=root.querySelector('#tprev'),saveBtn=root.querySelector('#tsave');
    var lk='';LINKS.forEach(function(l){lk+='<a class="card lk" href="'+esc(l[1])+'" target="_blank" rel="noopener"><b>'+esc(l[0])+'</b><span>'+esc(l[2])+'</span></a>'});
    root.querySelector('#tlk').innerHTML=lk;

    function dt(s){return s?new Date(s).toLocaleString('ko-KR',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
    function dd(s){return s?new Date(s).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'}):'—'}
    function num(c,bg,fg,label,v){return '<span class="n" style="background:'+bg+';color:'+fg+'">'+esc(label)+' '+esc(String(v))+'</span>'}

    function drawSummary(){
      var s=(data&&data.summary)||{},rows=(data&&data.rows)||[];
      var joined=rows.filter(function(r){return r.status==='참여중'||r.status==='달성'}).length;
      sumEl.innerHTML='<div class="card"><div class="sumrow">'+
        num(0,'var(--surface-2)','var(--ink)','신청',s.applied||0)+
        num(0,'rgba(62,95,219,.18)','var(--accent)','명단 등록',s.listed||0)+
        num(0,'var(--warn-bg)','var(--warn)','앱 가입',s.signed_up||0)+
        num(0,'rgba(240,130,40,.2)','#E07A1A','기록 있음',s.has_record||0)+
        num(0,'var(--good-bg)','var(--good)','14일 달성',s.achieved_14||0)+
        '<b style="margin-left:6px">목표 '+GOAL+'명 중 참여 '+joined+'명</b></div>'+
        '<div class="muted sm" style="margin-top:6px">'+(data&&data.generated_at?esc(dt(data.generated_at))+' 기준':'')+' · 제외 '+esc(String(s.excluded||0))+'명</div></div>';
    }
    function drawFilter(){
      var rows=(data&&data.rows)||[],h='';
      STATES.forEach(function(k){
        var c=k==='전체'?rows.length:rows.filter(function(r){return r.status===k}).length;
        h+='<button class="btn'+(k===filter?' on':'')+'" data-f="'+esc(k)+'">'+esc(k)+' '+c+'</button>';
      });
      flEl.innerHTML=h;
      flEl.querySelectorAll('button[data-f]').forEach(function(b){b.onclick=function(){filter=b.dataset.f;drawFilter();drawTable()}});
    }
    async function setRow(id,listed,excluded,note){
      var r=await sb.rpc('admin_tester_set',{p_id:id,p_listed:listed,p_excluded:excluded,p_note:note});
      if(r.error){alert('저장하지 못했어요: '+r.error.message)}
      await load(true);
    }
    function drawTable(){
      var rows=((data&&data.rows)||[]).filter(function(r){return filter==='전체'||r.status===filter});
      var h='';
      if(filter==='미참여'||filter==='멈춤')h+='<div class="when">연락해 볼 사람이에요. '+(filter==='미참여'?'신청은 했는데 앱에 아직 가입하지 않았어요.':'기록은 있었는데 3일 넘게 활동이 없어요.')+'</div>';
      if(!rows.length){h+='<div class="card muted">'+(data&&data.rows&&data.rows.length?'이 상태인 사람이 없어요.':'아직 신청자가 없어요. 아래 \'신청자 붙여넣기\'로 넣어 주세요.')+'</div>'}
      else{
        h+='<div class="card tw"><table class="tt"><tr><th>이름</th><th>메일 앞부분</th><th>기기</th><th>신청일</th><th>명단 등록</th><th>앱 가입일</th><th>첫 기록일</th><th>최근 활동</th><th>출석일수</th><th>상태</th><th>제외</th><th>메모</th></tr>';
        rows.forEach(function(r){
          var id=esc(String(r.id));
          h+='<tr'+(r.excluded?' class="ex"':'')+'><td>'+esc(r.name||'—')+'</td><td>'+esc(r.email_hint||'—')+'</td><td>'+esc(r.device||'—')+'</td><td>'+esc(dd(r.applied_at))+'</td>'+
            '<td><input type="checkbox" data-k="listed" data-id="'+id+'"'+(r.listed?' checked':'')+' title="구글 플레이 명단에 올렸으면 체크"></td>'+
            '<td>'+esc(dd(r.signed_up_at))+'</td><td>'+esc(r.first_record_date?dd(r.first_record_date):'—')+'</td><td>'+esc(dt(r.last_activity))+'</td><td>'+esc(String(r.attendance_days==null?0:r.attendance_days))+'일</td>'+
            '<td><span class="chip" style="'+(COLOR[r.status]||'')+'">'+esc(r.status||'—')+'</span></td>'+
            '<td><input type="checkbox" data-k="excluded" data-id="'+id+'"'+(r.excluded?' checked':'')+' title="빼기로 한 사람이면 체크"></td>'+
            '<td><input class="memo" data-k="note" data-id="'+id+'" data-old="'+esc(r.note||'')+'" value="'+esc(r.note||'')+'" placeholder="메모"></td></tr>';
        });
        h+='</table></div>';
      }
      box.innerHTML=h;
      box.querySelectorAll('input[type=checkbox]').forEach(function(c){
        c.onchange=function(){
          c.disabled=true;
          var id=Number(c.dataset.id);if(isNaN(id))id=c.dataset.id;
          if(c.dataset.k==='listed')setRow(id,c.checked,null,null);else setRow(id,null,c.checked,null);
        };
      });
      box.querySelectorAll('input.memo').forEach(function(m){
        function save(){if(m.value===m.dataset.old)return;m.dataset.old=m.value;var id=Number(m.dataset.id);if(isNaN(id))id=m.dataset.id;setRow(id,null,null,m.value)}
        m.onblur=save;m.onkeydown=function(e){if(e.key==='Enter')m.blur()};
      });
    }
    async function load(show){
      if(busy)return;busy=true;
      try{
        if(show&&!box.firstChild)box.innerHTML='<div class="muted">불러오는 중…</div>';
        var r=await sb.rpc('admin_tester_overview');
        if(r.error)throw new Error(r.error.message);
        data=r.data||{summary:{},rows:[]};
        drawSummary();drawFilter();drawTable();
      }catch(e){
        box.innerHTML='<div class="card"><b>명단을 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><button class="btn" id="retry">다시 시도</button></div>';
        var rt=box.querySelector('#retry');if(rt)rt.onclick=function(){load(true)};
      }finally{busy=false}
    }

    /* 붙여넣기 해석 */
    function toIso(s){
      s=(s||'').trim();if(!s)return null;
      var m=s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if(m){
        var hh=parseInt(m[5],10);
        if(m[4]==='오후'&&hh<12)hh+=12;if(m[4]==='오전'&&hh===12)hh=0;
        var p=function(n){return ('0'+n).slice(-2)};
        return m[1]+'-'+p(m[2])+'-'+p(m[3])+'T'+p(hh)+':'+m[6]+':'+p(m[7]||0)+'+09:00';
      }
      var d=new Date(s);return isNaN(d.getTime())?null:d.toISOString();
    }
    function parse(text){
      var lines=text.replace(/\r/g,'').split('\n').filter(function(l){return l.trim()});
      if(!lines.length)return [];
      var first=lines[0].split('\t').map(function(c){return c.trim()});
      var idx={ts:-1,email:-1,name:-1,dev:-1};
      var hasHead=!first.some(function(c){return c.indexOf('@')>=0});
      if(hasHead){
        first.forEach(function(c,i){
          if(idx.ts<0&&/타임스탬프|시간|일시|날짜|timestamp/i.test(c))idx.ts=i;
          else if(idx.email<0&&/이메일|메일|email|e-mail/i.test(c))idx.email=i;
          else if(idx.name<0&&/이름|성함|name/i.test(c))idx.name=i;
          else if(idx.dev<0&&/기기|기종|폰|휴대|device|모델/i.test(c))idx.dev=i;
        });
        lines=lines.slice(1);
      }
      var out=[];
      lines.forEach(function(l){
        var c=l.split('\t').map(function(x){return x.trim()});
        var e=idx.email,
            em=(e>=0&&c[e]&&c[e].indexOf('@')>=0)?e:c.findIndex(function(x){return x.indexOf('@')>=0});
        if(em<0)return;
        var ts=idx.ts,nm=idx.name,dv=idx.dev;
        if(!hasHead||ts<0||nm<0||dv<0){ /* 순서로 추정: 날짜처럼 보이는 칸, 이메일 뒤나 앞의 남는 칸 순서로 이름·기기 */
          var rest=[];
          c.forEach(function(x,i){
            if(i===em)return;
            if(ts<0&&/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}|\d{4}-\d{2}-\d{2}/.test(x)){ts=i;return}
            if(i===ts||i===nm||i===dv)return;
            rest.push(i);
          });
          if(nm<0&&rest.length)nm=rest.shift();
          if(dv<0&&rest.length)dv=rest.shift();
        }
        out.push({name:nm>=0?(c[nm]||''):'',email:c[em],device:dv>=0?(c[dv]||''):'',applied_at:ts>=0?toIso(c[ts]):null});
      });
      return out;
    }
    var parsed=[];
    ta.oninput=function(){
      parsed=parse(ta.value);
      if(!ta.value.trim()){prev.textContent='';saveBtn.disabled=true;return}
      prev.textContent=parsed.length?parsed.length+'건을 찾았어요. 맞으면 저장을 누르세요.':'이메일이 들어 있는 줄을 못 찾았어요. 시트에서 표를 다시 복사해 보세요.';
      saveBtn.disabled=!parsed.length;
    };
    saveBtn.onclick=async function(){
      if(!parsed.length)return;
      saveBtn.disabled=true;
      var r=await sb.rpc('admin_tester_upsert',{p_rows:parsed});
      if(r.error){alert('저장하지 못했어요: '+r.error.message);saveBtn.disabled=false;return}
      var d=r.data||{};
      prev.textContent='저장했어요 · 새로 '+(d.inserted||0)+'건 · 고침 '+(d.updated||0)+'건 · 건너뜀 '+(d.skipped||0)+'건';
      ta.value='';parsed=[];
      await load(true);
    };
    root.querySelector('#tclear').onclick=async function(){
      if(!confirm('신청자 정보(이름·이메일·메모 등)를 전부 지울까요?\n되돌릴 수 없어요.'))return;
      if(!confirm('정말 지울까요? 이 화면의 신청자 명단이 모두 사라져요.'))return;
      var r=await sb.rpc('admin_tester_clear');
      if(r.error){alert('지우지 못했어요: '+r.error.message);return}
      alert('신청자 '+(r.data==null?0:r.data)+'건을 지웠어요.');
      await load(true);
    };

    await load(true);
    timer=setInterval(function(){
      if(!root.isConnected){clearInterval(timer);return}
      var a=document.activeElement;
      if(document.hidden||busy||(a&&root.contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')))return;
      load(false);
    },30000);
  }};
})();

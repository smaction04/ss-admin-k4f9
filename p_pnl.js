/* 손익: 사업자가 한 달 단위로 "얼마 벌고 얼마 나갔나"를 보는 화면.
   재료는 서버 한 번 호출(admin_pnl_get)로 받고, 30초마다 저절로 다시 불러온다(보고 있는 동안만).
   서버에 자동으로 안 들어오는 값(애드몹 수익·고정비 등)은 맨 아래 칸에 월별로 직접 적으면 계산에 바로 들어간다.
   값이 모자라 계산 못 하는 줄은 "—"와 "무엇이 필요한지"를 보여 준다. */
(function(){
  var KEYS=[
    ['admob_revenue','애드몹 광고 수익','원','애드몹 > 결제 > 이번 달 예상 수익'],
    ['ecpm','광고 1,000회당 수익(eCPM)','원','애드몹 > 보고서 — 위 수익을 못 적을 때 시청 횟수로 추정'],
    ['fee_gifticon','기프티콘 수수료·부대비용','원','기프티쇼 이용 내역(교환 원가 외 별도 수수료가 있을 때)'],
    ['cost_server','서버·도구 비용','원','Supabase·도메인·개발자 계정 등 이번 달 청구액'],
    ['cost_marketing','광고·홍보비','원','테스터 쿠폰·광고 집행비 등'],
    ['cost_other','그 밖의 비용','원','세무·법인·기타']
  ];
  var TYPES={gauge_reward:'게이지 보상',roulette_win:'룰렛 당첨',offerwall_reward:'무료충전소(TNK)',attendance:'출석',adjustment:'운영자 조정'};
  var n=function(v){return Number(v)||0};
  var won=function(v){return new Intl.NumberFormat('ko-KR').format(Math.round(n(v)))+'원'};
  var num=function(v){return new Intl.NumberFormat('ko-KR').format(Math.round(n(v)))};
  var pct=function(v){return (Math.round(v*1000)/10)+'%'};
  function ym(s,delta){var p=s.split('-'),d=new Date(+p[0],+p[1]-1+delta,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function nowYm(){var k=new Date(Date.now()+9*3600*1000).toISOString();return k.slice(0,7)}
  function daysIn(s){var p=s.split('-');return new Date(+p[0],+p[1],0).getDate()}

  window.PAGES.pnl={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,month=nowYm(),timer=null,busy=false;
    root.innerHTML='<div id="pn"></div>';
    var box=root.querySelector('#pn');

    function row(label,val,note,chip){
      return '<tr><td>'+esc(label)+(note?'<div class="muted sm">'+esc(note)+'</div>':'')+'</td><td class="r">'+val+(chip?' '+chip:'')+'</td></tr>';
    }
    var AUTO='<span class="chip good">자동</span>',MAN='<span class="chip warn">직접 입력</span>',WAIT='<span class="chip">데이터 대기</span>';

    function draw(d,stamp){
      var inp=d.inputs||{},iv=function(k){return inp[k]?n(inp[k].v):null};
      var issuedBy=d.issued||{},issued=0;Object.keys(issuedBy).forEach(function(k){issued+=n(issuedBy[k])});
      var tnk=n(d.tnk&&d.tnk.settle),adsN=0;Object.keys(d.ads||{}).forEach(function(k){adsN+=n(d.ads[k])});
      var admob=iv('admob_revenue'),ecpm=iv('ecpm'),adsRev=null,adsHow='';
      if(admob!=null){adsRev=admob;adsHow='직접 입력한 실제 수익'}
      else if(ecpm!=null){adsRev=adsN*ecpm/1000;adsHow='시청 '+num(adsN)+'회 × eCPM으로 추정'}
      var revenue=tnk+(adsRev||0);
      var ex=d.exchange||{},exKrw=n(ex.sent_krw),fee=iv('fee_gifticon')||0;
      var fixed=(iv('cost_server')||0)+(iv('cost_marketing')||0)+(iv('cost_other')||0);
      var cashProfit=revenue-exKrw-fee-fixed,issuedProfit=revenue-issued-fee-fixed;
      var u=d.users||{},active=n(u.active),total=n(u.total);
      var days=daysIn(d.month),cur=d.month===nowYm(),elapsed=cur?Math.max(1,new Date(Date.now()+9*3600*1000).getUTCDate()):days;
      var proj=function(v){return cur?v*days/elapsed:v};
      var lia=d.liability||{};

      /* 위쪽 큰 칸 */
      var tiles='<div class="grid g4">'+
        tile('들어온 돈(수익)',won(revenue),adsRev==null?'애드몹 수익 입력 전':'무료충전소+광고')+
        tile('약속한 캐시(발행)',won(issued),'유저에게 쌓아 준 캐시')+
        tile('실제 나간 돈(교환)',won(exKrw),'기프티콘 발송 '+num(ex.sent_n)+'건')+
        tile('이번 달 손익(현금 기준)','<span class="'+(cashProfit<0?'neg':'pos')+'">'+won(cashProfit)+'</span>','수익 − 교환 − 비용')+
      '</div>';

      /* 손익 계산서 */
      var rows='';
      rows+=row('무료충전소(TNK) 정산액',won(tnk),'TNK가 알려 준 정산 금액 '+num(d.tnk&&d.tnk.n)+'건 합계. 금액 단위는 첫 정산 때 TNK 어드민과 대조',AUTO);
      rows+=row('애드몹 광고 수익',adsRev==null?'—':won(adsRev),adsRev==null?'필요한 것: 애드몹 수익(또는 eCPM)을 맨 아래 칸에 입력':adsHow,adsRev==null?WAIT:(admob!=null?MAN:MAN));
      rows+='<tr class="tot"><td>① 수익 합계</td><td class="r">'+won(revenue)+'</td></tr>';
      rows+=row('기프티콘 교환 원가(실제 나간 돈)',won(exKrw),'발송 완료 '+num(ex.sent_n)+'건 · 실패 '+num(ex.failed_n)+'건 · 처리 중 '+num(ex.pending_n)+'건',AUTO);
      rows+=row('기프티콘 수수료·부대비용',iv('fee_gifticon')==null?'—':won(fee),iv('fee_gifticon')==null?'필요한 것: 기프티쇼 수수료 확인 후 입력':'',iv('fee_gifticon')==null?WAIT:MAN);
      rows+=row('서버·도구 비용',iv('cost_server')==null?'—':won(iv('cost_server')),iv('cost_server')==null?'필요한 것: 이번 달 청구액 입력':'',iv('cost_server')==null?WAIT:MAN);
      rows+=row('광고·홍보비',iv('cost_marketing')==null?'—':won(iv('cost_marketing')),iv('cost_marketing')==null?'필요한 것: 쿠폰·광고비 입력':'',iv('cost_marketing')==null?WAIT:MAN);
      rows+=row('그 밖의 비용',iv('cost_other')==null?'—':won(iv('cost_other')),'',iv('cost_other')==null?WAIT:MAN);
      rows+='<tr class="tot"><td>② 실제 나간 돈 합계</td><td class="r">'+won(exKrw+fee+fixed)+'</td></tr>';
      rows+='<tr class="tot big"><td>손익 = ① − ② (현금 기준)</td><td class="r"><span class="'+(cashProfit<0?'neg':'pos')+'">'+won(cashProfit)+'</span></td></tr>';
      rows+=row('참고: 손익(발행 기준, 보수적)',won(issuedProfit),'아직 교환 안 된 캐시까지 전부 나간 돈으로 본 최악의 경우 = 수익 − 발행 캐시 − 비용');
      var pl='<div class="sec-h">손익 계산서 — '+esc(d.month)+'</div><div class="card"><table class="pt">'+rows+'</table></div>';

      /* 발행 캐시 내역 */
      var iss=Object.keys(TYPES).filter(function(k){return issuedBy[k]!=null}).map(function(k){return row(TYPES[k],won(issuedBy[k]))}).join('');
      var issCard='<div class="sec-h">약속한 캐시 내역 (유저에게 쌓아 준 것)</div><div class="card"><table class="pt">'+(iss||'<tr><td class="muted">이번 달 지급 기록 없음</td></tr>')+
        row('부스터 구매로 되돌아온 캐시',won(d.booster_spent),'유저가 캐시를 써서 사 간 부스터 — 약속한 캐시가 줄어드는 쪽')+'</table></div>';

      /* 사업 체력 지표 */
      function kpi(label,val,note,need,good){
        return '<tr><td>'+esc(label)+'<div class="muted sm">'+esc(val==null?need:note)+'</div></td><td class="r">'+(val==null?'—':val)+(val==null?' '+WAIT:(good===false?' <span class="chip bad">주의</span>':good===true?' <span class="chip good">양호</span>':''))+'</td></tr>';
      }
      var rate=revenue>0?issued/revenue:null;
      var arpu=revenue>0&&active>0?revenue/active:null,payPer=active>0?issued/active:null;
      var perAd=adsRev!=null&&adsN>0?adsRev/adsN:null;
      var beUsers=(arpu!=null&&payPer!=null&&arpu>payPer&&(fixed>0))?Math.ceil(fixed/(arpu-payPer)):null;
      var kp='<tr><td>지급률 (발행 캐시 ÷ 수익)<div class="muted sm">'+(rate==null?'필요한 것: 수익이 한 건이라도 잡혀야 계산돼요 (목표 30% 이하)':'목표 30% 이하 — 넘으면 벌어들인 것보다 많이 약속한 상태')+'</div></td><td class="r">'+(rate==null?'—'+' '+WAIT:pct(rate)+' '+(rate<=0.3?'<span class="chip good">목표 안</span>':'<span class="chip bad">목표 초과</span>'))+'</td></tr>';
      kp+=kpi('활동 유저 1명당 수익',arpu==null?null:won(arpu),'수익 ÷ 이번 달 활동 유저 '+num(active)+'명','필요한 것: 수익 + 활동 유저');
      kp+=kpi('활동 유저 1명당 지급',payPer==null?null:won(payPer),'발행 캐시 ÷ 활동 유저','필요한 것: 활동 유저');
      kp+=kpi('광고 1건당 수익',perAd==null?null:won(perAd),'광고 수익 ÷ 확인된 시청 '+num(adsN)+'회','필요한 것: 애드몹 수익 입력 + 광고 시청 기록');
      kp+=kpi('손익분기 활동 유저 수',beUsers==null?null:num(beUsers)+'명','고정비 ÷ (1명당 수익 − 1명당 지급)','필요한 것: 고정비 입력 + 1명당 수익이 1명당 지급보다 클 것');
      kp+=kpi('이번 달 말 예상 손익',cur&&revenue>0?won(proj(revenue)-proj(exKrw)-fee-fixed):null,'지금까지 속도로 월말까지 간다고 가정(고정비는 그대로)','필요한 것: 이번 달 수익이 잡힌 뒤부터');
      var kpiCard='<div class="sec-h">사업 체력 지표</div><div class="card"><table class="pt">'+kp+'</table></div>';

      /* 유저·부채 */
      var biz=lia.biz_balance_krw;
      var lv='<table class="pt">'+
        row('전체 가입자',num(total)+'명','이번 달 새 가입 '+num(u.new)+'명')+
        row('이번 달 활동 유저',num(active)+'명','룰렛 돌린 유저 '+num(u.spun)+'명')+
        row('유저가 가진 캐시 잔액(갚아야 할 몫)',won(lia.outstanding_krw),'전체 유저 잔액 합계 — 전자금융 발행잔액 경보 기준과 같은 숫자')+
        row('기프티쇼 충전금 잔액',biz==null?'—':won(biz),lia.biz_checked_at?'확인 시각 '+esc(String(lia.biz_checked_at).slice(0,16).replace('T',' ')):'',biz==null?WAIT:(lia.biz_ok?AUTO:'<span class="chip bad">확인 실패</span>'))+
        row('확인된 광고 시청',num(adsN)+'회','부스터 '+num((d.ads||{}).booster)+' · 룰렛 '+num((d.ads||{}).roulette_claim)+' · 미확인 '+num(d.ads_unverified))+'</table>';
      var lvCard='<div class="sec-h">유저·맡아 둔 돈</div><div class="card">'+lv+'</div>';

      /* 일별 */
      var mx=1;(d.daily||[]).forEach(function(x){mx=Math.max(mx,n(x.tnk_settle),n(x.issued),n(x.exchanged))});
      var dr=(d.daily||[]).slice().reverse().map(function(x){
        return '<tr><td>'+esc(x.day.slice(5))+'</td><td class="r">'+num(x.tnk_settle)+'</td><td class="r">'+num(x.issued)+'</td><td class="r">'+num(x.exchanged)+'</td></tr>';
      }).join('');
      var daily='<div class="sec-h">날짜별 (최근이 위)</div><div class="card" style="padding:6px 10px;max-height:280px;overflow:auto"><table class="pt dt"><tr><th>날짜</th><th class="r">TNK 정산</th><th class="r">발행 캐시</th><th class="r">교환(원가)</th></tr>'+dr+'</table></div>';

      /* 직접 입력 */
      var form=KEYS.map(function(k){
        var cur0=inp[k[0]];
        return '<label class="fld"><span>'+esc(k[1])+' <small class="muted">('+k[2]+')</small></span><small class="muted">'+esc(k[3])+'</small><input type="number" min="0" step="any" inputmode="decimal" data-k="'+k[0]+'" value="'+(cur0?n(cur0.v):'')+'" placeholder="비워 두면 \'데이터 대기\'"></label>';
      }).join('');
      var edit='<div class="sec-h">직접 입력 — '+esc(d.month)+' (저장하면 위 계산에 바로 반영)</div><div class="card"><div class="flds">'+form+'</div><div style="margin-top:10px"><button class="btn primary" id="save">저장</button> <span id="msg" class="muted sm"></span></div></div>';

      box.innerHTML=
        '<div class="bar"><button class="btn" id="prev">◀ 이전 달</button><b class="mon">'+esc(d.month)+'</b><button class="btn" id="next"'+(d.month>=nowYm()?' disabled':'')+'>다음 달 ▶</button><span class="spacer"></span><span class="muted sm" id="stamp">'+esc(stamp)+' 갱신 · 30초마다 자동</span><button class="btn" id="now">지금 새로고침</button></div>'+
        tiles+pl+kpiCard+issCard+lvCard+daily+edit+
        '<p class="muted sm" style="margin-top:14px">보는 법: 「현금 기준」은 실제로 나간 기프티콘 원가만 비용으로 봅니다. 「발행 기준」은 유저에게 약속한 캐시를 전부 비용으로 봐서 더 보수적입니다. 두 숫자 사이 차이가 아직 교환되지 않은 약속입니다.</p>';
      box.querySelector('#prev').onclick=function(){month=ym(month,-1);load(true)};
      box.querySelector('#next').onclick=function(){month=ym(month,1);load(true)};
      box.querySelector('#now').onclick=function(){load(true)};
      box.querySelector('#save').onclick=save;
    }
    function tile(a,b,c){return '<div class="tile"><b>'+esc(a)+'</b><span>'+b+'</span><div class="muted sm">'+esc(c||'')+'</div></div>'}

    async function save(){
      var msg=box.querySelector('#msg'),ins=box.querySelectorAll('input[data-k]'),cnt=0;
      msg.textContent='저장 중…';
      for(var i=0;i<ins.length;i++){
        var v=ins[i].value.trim(),k=ins[i].dataset.k;
        var r=await sb.rpc('admin_pnl_set',{p_month:month,p_key:k,p_value:v===''?null:Number(v),p_note:null});
        if(r.error){msg.textContent='저장 실패: '+r.error.message;return}
        cnt++;
      }
      await load(true);
      var m2=box.querySelector('#msg');if(m2)m2.textContent='저장했어요';
    }
    async function load(show){
      if(busy)return;busy=true;
      try{
        if(show&&!box.firstChild)box.innerHTML='<div class="muted">불러오는 중…</div>';
        var r=await sb.rpc('admin_pnl_get',{p_month:month});
        if(r.error)throw new Error(r.error.message);
        /* 직접 입력 중인 칸이 있으면 자동 갱신으로 덮어쓰지 않는다 */
        var typing=box.contains(document.activeElement)&&document.activeElement.tagName==='INPUT';
        if(show||!typing){var t=new Date();draw(r.data,t.toLocaleTimeString('ko-KR',{hour12:false}))}
      }catch(e){
        box.innerHTML='<div class="card"><b>손익 숫자를 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><p class="muted sm">서버에 손익 조회 기능(0055)이 아직 적용 전이면 이 메시지가 나옵니다.</p><button class="btn" id="retry">다시 시도</button></div>';
        var rt=box.querySelector('#retry');if(rt)rt.onclick=function(){load(true)};
      }finally{busy=false}
    }
    var st=document.createElement('style');
    st.textContent='.pt{width:100%;border-collapse:collapse}.pt td,.pt th{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}.pt .r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.pt tr:last-child td{border-bottom:0}.pt .tot td{font-weight:800;background:var(--surface-2)}.pt .big td{font-size:15px}.sm{font-size:12px}.pos{color:var(--good)}.neg{color:var(--bad)}.bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}.mon{font-size:16px;min-width:70px;text-align:center}.flds{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.fld{display:flex;flex-direction:column;gap:3px}.fld input{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:7px 10px;font:inherit}.dt th{font-size:12px;color:var(--ink-soft)}.tile .sm{margin-top:2px}';
    root.appendChild(st);
    await load(true);
    /* 보고 있는 동안만 30초마다 갱신. 다른 메뉴로 가서 이 화면이 사라지면 멈춘다 */
    timer=setInterval(function(){if(!root.isConnected){clearInterval(timer);return}if(!document.hidden)load(false)},30000);
  }};
})();

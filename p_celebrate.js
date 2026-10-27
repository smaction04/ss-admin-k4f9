/* 축하창: 잭팟·7일 출석 보상을 받은 순간 앱에 뜨는 창의 글과 모양을 고친다. 저장하면 앱에 바로 반영(새 앱 필요 없음).
   글자 안의 {amount}는 받은 캐시 금액, {day}는 출석 일차로 바뀐다. 끄면 앱은 예전 기본 안내창을 쓴다. */
(function(){
  window.PAGES.celebrate={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,list=[];
    root.innerHTML='<div id="cb"></div>';
    var box=root.querySelector('#cb');
    function f(c,k){return esc(String(c[k]==null?'':c[k]))}
    function row(label,html){return '<label style="display:block;margin-top:8px"><span class="muted sm" style="display:block">'+label+'</span>'+html+'</label>'}
    function preview(c){
      var t=(c.title||'').replace(/\{amount\}/g,'30000').replace(/\{day\}/g,'7'),b=(c.body||'').replace(/\{amount\}/g,'30000').replace(/\{day\}/g,'7');
      return '<div style="background:'+esc(c.bg_color)+';border-radius:20px;padding:24px 20px 12px;text-align:center;max-width:300px">'+
        (c.emoji?'<div style="font-size:48px">'+esc(c.emoji)+'</div>':'')+
        '<div style="font-weight:700;margin:8px 0;font-size:'+Number(c.title_size)+'px;color:'+esc(c.title_color)+'">'+esc(t)+'</div>'+
        (b?'<div style="font-size:'+Number(c.body_size)+'px;color:'+esc(c.body_color)+'">'+esc(b)+'</div>':'')+
        '<div style="text-align:right;margin-top:14px;color:#8fa2ff;font-size:14px">'+(c.show_cash_button?'캐시함 보기 &nbsp;&nbsp;':'')+esc(c.button_text||'확인')+'</div></div>';
    }
    function cardHtml(c,i){
      var inp='style="width:100%;padding:7px;box-sizing:border-box"';
      return '<div class="card" data-i="'+i+'"><div style="display:flex;gap:20px;flex-wrap:wrap"><div style="flex:1;min-width:260px">'+
        '<b>'+esc(c.label)+'</b> <span class="muted sm">('+esc(c.event_key)+')</span>'+
        row('이 축하창 쓰기','<input type="checkbox" data-k="enabled"'+(c.enabled?' checked':'')+'> 켜짐 (끄면 예전 기본 안내창이 떠요)')+
        row('그림 글자(이모지)','<input data-k="emoji" maxlength="8" '+inp+' value="'+f(c,'emoji')+'">')+
        row('제목 (80자까지)','<input data-k="title" maxlength="80" '+inp+' value="'+f(c,'title')+'">')+
        row('내용 ({amount}=받은 캐시, {day}=출석 일차)','<textarea data-k="body" maxlength="500" rows="3" '+inp+'>'+f(c,'body')+'</textarea>')+
        '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
          '<div>'+row('제목 색','<input type="color" data-k="title_color" value="'+f(c,'title_color')+'">')+'</div>'+
          '<div>'+row('내용 색','<input type="color" data-k="body_color" value="'+f(c,'body_color')+'">')+'</div>'+
          '<div>'+row('바탕 색','<input type="color" data-k="bg_color" value="'+f(c,'bg_color')+'">')+'</div></div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
          '<div>'+row('제목 크기(12~40)','<input type="number" min="12" max="40" data-k="title_size" style="width:80px" value="'+f(c,'title_size')+'">')+'</div>'+
          '<div>'+row('내용 크기(10~30)','<input type="number" min="10" max="30" data-k="body_size" style="width:80px" value="'+f(c,'body_size')+'">')+'</div>'+
          '<div>'+row('자동 닫힘 초(0=안 닫힘, 최대 30)','<input type="number" min="0" max="30" data-k="auto_close_sec" style="width:80px" value="'+f(c,'auto_close_sec')+'">')+'</div></div>'+
        row('확인 버튼 글자 (12자까지)','<input data-k="button_text" maxlength="12" '+inp+' value="'+f(c,'button_text')+'">')+
        row('캐시함 버튼','<input type="checkbox" data-k="show_cash_button"'+(c.show_cash_button?' checked':'')+'> "캐시함 보기" 버튼 보이기')+
        '<div style="margin-top:12px"><button class="btn" data-save="'+i+'">저장</button> <span class="muted sm" data-msg></span></div></div>'+
        '<div><div class="muted sm" style="margin-bottom:6px">미리보기 (예: 30,000캐시 · 7일차)</div><div data-pv>'+preview(c)+'</div></div></div></div>';
    }
    function read(card,c){
      var o=Object.assign({},c);
      card.querySelectorAll('[data-k]').forEach(function(el){
        var k=el.dataset.k;o[k]=el.type==='checkbox'?el.checked:(el.type==='number'?Number(el.value):el.value);
      });
      return o;
    }
    function draw(){
      box.innerHTML=list.map(cardHtml).join('')||'<div class="card muted">축하창 설정이 없어요.</div>';
      box.querySelectorAll('.card').forEach(function(card){
        var i=Number(card.dataset.i);
        card.addEventListener('input',function(){card.querySelector('[data-pv]').innerHTML=preview(read(card,list[i]))});
        card.querySelector('[data-save]').onclick=async function(){
          var c=read(card,list[i]),msg=card.querySelector('[data-msg]'),btn=this;
          btn.disabled=true;msg.textContent='저장 중…';
          var r=await sb.rpc('admin_celebration_save',{p_key:c.event_key,p_label:c.label,p_enabled:c.enabled,p_emoji:c.emoji,p_title:c.title,p_body:c.body,
            p_title_color:c.title_color,p_body_color:c.body_color,p_bg_color:c.bg_color,p_title_size:c.title_size,p_body_size:c.body_size,
            p_button_text:c.button_text,p_show_cash_button:c.show_cash_button,p_auto_close_sec:c.auto_close_sec});
          btn.disabled=false;
          if(r.error){msg.textContent='저장하지 못했어요: '+r.error.message;return}
          list[i]=c;msg.textContent='저장했어요. 앱에 바로 반영돼요.';
        };
      });
    }
    try{
      var r=await sb.rpc('admin_celebration_list');
      if(r.error)throw new Error(r.error.message);
      list=r.data||[];draw();
    }catch(e){box.innerHTML='<div class="card"><b>불러오지 못했어요</b><p class="muted">'+esc(e.message)+'</p></div>'}
  }};
})();

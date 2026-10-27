/* 공지사항: 여기서 쓴 공지가 앱 홈 맨 위 전광판(오른쪽→왼쪽으로 흐름)과 설정의 공지사항 게시판에 보인다.
   전광판에는 "가장 최근 공지"와 "중요"로 지정한 공지가 나온다. 쓰기·고치기·지우기 모두 바로 반영된다. */
(function(){
  window.PAGES.notice={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb,editId=null;
    root.innerHTML='<div id="nt"></div>';
    var box=root.querySelector('#nt'),list=[];
    function dt(s){return s?new Date(s).toLocaleString('ko-KR',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
    function draw(){
      var cur=editId?list.filter(function(n){return n.id===editId})[0]:null;
      var h='<div class="card"><b>'+(cur?'공지 고치기':'새 공지 쓰기')+'</b>'+
        '<div class="muted sm">제목은 80자까지, 내용은 2000자까지예요. 제목이 전광판에 흐릅니다.</div>'+
        '<input id="nt_title" maxlength="80" placeholder="제목 (전광판에 흐르는 글)" style="width:100%;margin-top:8px;padding:8px;box-sizing:border-box" value="'+esc(cur?cur.title:'')+'">'+
        '<textarea id="nt_body" maxlength="2000" rows="5" placeholder="내용 (게시판에서 눌러 열면 보여요)" style="width:100%;margin-top:8px;padding:8px;box-sizing:border-box">'+esc(cur?cur.body:'')+'</textarea>'+
        '<label style="display:block;margin-top:8px"><input type="checkbox" id="nt_imp"'+(cur&&cur.important?' checked':'')+'> 중요 공지 (전광판에 계속 흘러요)</label>'+
        '<div style="margin-top:10px"><button class="btn" id="nt_save">'+(cur?'고친 내용 저장':'공지 올리기')+'</button>'+(cur?' <button class="btn" id="nt_cancel">고치기 취소</button>':'')+'</div></div>';
      if(!list.length){h+='<div class="card muted">아직 올린 공지가 없어요.</div>'}
      else{
        h+='<div class="card"><table class="pt"><tr><th>제목</th><th>올린 때</th><th>구분</th><th></th></tr>';
        list.forEach(function(n,i){
          h+='<tr><td>'+esc(n.title)+'</td><td>'+esc(dt(n.created_at))+'</td><td>'+
            (n.important?'<span class="chip warn">중요</span> ':'')+(i===0?'<span class="chip good">최신</span>':'')+'</td>'+
            '<td><button class="btn" data-e="'+n.id+'">고치기</button> <button class="btn" data-d="'+n.id+'">지우기</button></td></tr>';
        });
        h+='</table></div>';
      }
      box.innerHTML=h;
      box.querySelector('#nt_save').onclick=async function(){
        var t=box.querySelector('#nt_title').value.trim(),b=box.querySelector('#nt_body').value.trim();
        if(!t){alert('제목을 적어 주세요');return}
        this.disabled=true;
        var r=await sb.rpc('admin_notice_save',{p_id:editId,p_title:t,p_body:b,p_important:box.querySelector('#nt_imp').checked});
        if(r.error){alert('저장하지 못했어요: '+r.error.message);this.disabled=false;return}
        editId=null;await load();
      };
      var c=box.querySelector('#nt_cancel');if(c)c.onclick=function(){editId=null;draw()};
      box.querySelectorAll('button[data-e]').forEach(function(b){b.onclick=function(){editId=Number(b.dataset.e);draw();window.scrollTo(0,0)}});
      box.querySelectorAll('button[data-d]').forEach(function(b){
        b.onclick=async function(){
          if(!confirm('이 공지를 지울까요? 앱에서도 사라져요.'))return;
          b.disabled=true;
          var r=await sb.rpc('admin_notice_delete',{p_id:Number(b.dataset.d)});
          if(r.error){alert('지우지 못했어요: '+r.error.message)}
          await load();
        };
      });
    }
    async function load(){
      try{
        var r=await sb.rpc('admin_notice_list');
        if(r.error)throw new Error(r.error.message);
        list=r.data||[];draw();
      }catch(e){
        box.innerHTML='<div class="card"><b>공지를 못 불러왔어요</b><p class="muted">'+esc(e.message)+'</p><button class="btn" id="retry">다시 시도</button></div>';
        var rt=box.querySelector('#retry');if(rt)rt.onclick=load;
      }
    }
    var st=document.createElement('style');
    st.textContent='.pt{width:100%;border-collapse:collapse}.pt td,.pt th{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}.pt tr:last-child td{border-bottom:0}.pt th{font-size:12px;color:var(--ink-soft)}.sm{font-size:12px}';
    root.appendChild(st);
    await load();
  }};
})();

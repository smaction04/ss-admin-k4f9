/* 업체: 경매 업체 가입 신청을 사업자등록증과 함께 보고 허락·거절하는 곳. 허락된 업체만 업체 전용 페이지에서 상품을 올린다. */
(function(){
  window.PAGES.vendor={render:async function(root,ctx){
    var esc=ctx.esc,sb=ctx.sb;
    root.innerHTML='<div id="vd"></div>';
    var box=root.querySelector('#vd');
    var ST={pending:['허락 대기','warn'],approved:['허락됨','good'],rejected:['거절','']};
    function dt(s){return s?new Date(s).toLocaleDateString('ko-KR'):'—'}
    async function load(){
      var r=await sb.rpc('admin_vendor_list');
      if(r.error){box.innerHTML='<div class="card"><b>업체 목록을 못 불러왔어요</b><p class="muted">'+esc(r.error.message)+'</p></div>';return}
      var list=r.data||[],by={};list.forEach(function(v){by[v.user_id]=v});
      var wait=list.filter(function(v){return v.status==='pending'}).length;
      var h='<div class="card"><b>허락 대기 '+wait+'건</b> · 전체 '+list.length+'곳<div class="muted" style="font-size:12px">업체 전용 페이지 주소: <code>https://smaction04.github.io/ss-admin-k4f9/vendor.html</code></div></div>';
      if(!list.length)h+='<div class="card muted">아직 가입한 업체가 없어요.</div>';
      list.forEach(function(v){
        var s=ST[v.status]||[v.status,''],id=esc(v.user_id);
        h+='<div class="card"><b>'+esc(v.company_name)+'</b> <span class="chip '+s[1]+'">'+esc(s[0])+'</span>'+
          '<div class="muted" style="font-size:12px">'+esc(v.contact)+' · '+esc(v.email)+' · 신청 '+dt(v.created_at)+'</div>'+
          (v.admin_note?'<div class="muted" style="font-size:12px">메모: '+esc(v.admin_note)+'</div>':'')+
          '<div style="margin-top:8px"><button class="btn" data-a="doc" data-i="'+id+'">사업자등록증 보기</button> '+
          (v.status!=='approved'?'<button class="btn" data-a="yes" data-i="'+id+'">허락</button> ':'')+
          (v.status!=='rejected'?'<button class="btn" data-a="no" data-i="'+id+'">거절</button>':'')+'</div></div>';
      });
      box.innerHTML=h;
      box.querySelectorAll('button[data-a]').forEach(function(b){
        b.onclick=async function(){
          var v=by[b.dataset.i],a=b.dataset.a,res;
          b.disabled=true;
          if(a==='doc'){
            var w=window.open('','_blank');
            var s=await sb.storage.from('vendor-docs').createSignedUrl(v.license_path,120);
            if(s.error||!s.data){if(w)w.close();alert('파일을 열지 못했어요: '+(s.error?s.error.message:'경로 없음'))}
            else if(w){w.opener=null;w.location=s.data.signedUrl}
            b.disabled=false;return;
          }
          var note=prompt(a==='yes'?'메모(선택)':'거절 이유(업체에게 보여요, 선택)','');if(note===null){b.disabled=false;return}
          res=await sb.rpc('admin_vendor_review',{p_user:v.user_id,p_approve:a==='yes',p_note:note||null});
          if(res.error)alert('처리하지 못했어요: '+res.error.message);
          await load();
        };
      });
    }
    await load();
  }};
})();

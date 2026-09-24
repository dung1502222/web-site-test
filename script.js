(function(){
  // Room spot dots
  document.querySelectorAll('.dots').forEach(function(d){
    var total=+d.dataset.total, taken=+d.dataset.taken, html='';
    for(var i=0;i<total;i++) html+='<i'+(i<taken?'':' class="o"')+'></i>';
    d.innerHTML=html+'<span>'+(total-taken)+' spots left</span>';
    d.setAttribute('aria-label',(total-taken)+' of '+total+' spots left');
  });
  // Join room toggle
  document.querySelectorAll('.room .r .btn').forEach(function(b){
    b.addEventListener('click',function(){
      var on=b.getAttribute('aria-pressed')!=='true';
      b.setAttribute('aria-pressed',on);
      b.textContent=on?'Joined':'Join room';
      var dots=b.closest('.room').querySelector('.dots');
      dots.dataset.taken=+dots.dataset.taken+(on?1:-1);
      var total=+dots.dataset.total, taken=+dots.dataset.taken, html='';
      for(var i=0;i<total;i++) html+='<i'+(i<taken?'':' class="o"')+'></i>';
      dots.innerHTML=html+'<span>'+(total-taken)+' spots left</span>';
    });
  });
  // Phone: choose one option per group
  document.querySelectorAll('.opts').forEach(function(g){
    g.addEventListener('click',function(e){
      var b=e.target.closest('.opt'); if(!b) return;
      g.querySelectorAll('.opt').forEach(function(o){o.setAttribute('aria-pressed',o===b)});
      var c=document.querySelector('.confirm'); c.classList.remove('done'); c.textContent='Confirm plan';
    });
  });
  var confirmBtn=document.querySelector('.confirm');
  confirmBtn.addEventListener('click',function(){confirmBtn.classList.add('done');confirmBtn.textContent='Plan confirmed'});
  // See again
  var msg=document.querySelector('.sa-done');
  document.querySelectorAll('[data-sa]').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('[data-sa]').forEach(function(o){o.setAttribute('aria-pressed',o===b)});
      msg.textContent=b.dataset.sa==='yes'?'Answer saved. We’ll tell you if Hà says yes too.':'Answer saved. Hà won’t be told.';
      msg.classList.add('show');
    });
  });
  // Waitlist form
  var form=document.querySelector('.field'), input=document.getElementById('email'), note=document.getElementById('join-msg');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())){
      note.className='err'; note.textContent='Enter an email address like name@example.com.'; input.focus(); return;
    }
    note.className='ok'; note.textContent='You’re on the list. We’ll email you when odds opens in Saigon.';
    form.querySelector('button').textContent='Applied';
  });
})();

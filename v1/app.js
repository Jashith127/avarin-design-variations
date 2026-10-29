(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveals */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.15});
    rv.forEach(function(el){ io.observe(el); });
  } else { rv.forEach(function(el){ el.classList.add('in'); }); }

  /* briefing: Sia reads out the morning */
  var list = document.getElementById('briefList');
  var items = list ? [].slice.call(list.children) : [];
  var timers = [];
  function play(){
    timers.forEach(clearTimeout); timers = [];
    list.classList.add('is-arming');
    items.forEach(function(li){ li.classList.remove('in'); });
    items.forEach(function(li,i){
      timers.push(setTimeout(function(){ li.classList.add('in'); }, reduce ? 0 : 500 + i*900));
    });
  }
  if (list){
    document.getElementById('askBtn').addEventListener('click', play);
    play();
  }

  /* draft reply: approve or ask for a change */
  var draft = document.getElementById('draft');
  if (draft){
    var txt = document.getElementById('draftText'), st = document.getElementById('draftState');
    var warm = 'Thank you for staying with us, and thank you for telling us about room 204. I am sorry the night was disturbed. Our engineer is looking at it today, and I would like to make it right on your next visit.';
    var base = txt.textContent;
    document.getElementById('draftOk').addEventListener('click', function(){
      draft.classList.add('is-ok'); st.textContent = 'Approved by your GRM';
    });
    document.getElementById('draftEdit').addEventListener('click', function(){
      draft.classList.remove('is-ok');
      st.textContent = 'Sia is rewriting, warmer';
      txt.style.opacity = .25;
      setTimeout(function(){
        txt.textContent = (txt.textContent === base) ? warm : base;
        txt.style.opacity = 1;
        st.textContent = 'Revised. Waiting for your GRM';
      }, reduce ? 0 : 700);
    });
  }

  /* team row: lit centre panel */
  var row = document.getElementById('row');
  if (row){
    var pnls = [].slice.call(row.querySelectorAll('.pnl'));
    var nm = document.getElementById('pName'), tx = document.getElementById('pText');
    var cur = 0;
    function centre(){
      var mid = row.scrollLeft + row.clientWidth/2, best = 0, bd = 1e9;
      pnls.forEach(function(p,i){
        var d = Math.abs(p.offsetLeft + p.offsetWidth/2 - mid);
        if (d < bd){ bd = d; best = i; }
      });
      if (best !== cur || !pnls[best].classList.contains('is-on')){
        cur = best;
        pnls.forEach(function(p,i){ p.classList.toggle('is-on', i === best); });
        nm.textContent = pnls[best].dataset.name; tx.textContent = pnls[best].dataset.text;
      }
    }
    row.addEventListener('scroll', centre, {passive:true});
    function go(n){
      n = Math.max(0, Math.min(pnls.length-1, n));
      var p = pnls[n];
      row.scrollTo({left: p.offsetLeft + p.offsetWidth/2 - row.clientWidth/2, behavior: reduce ? 'auto' : 'smooth'});
    }
    document.getElementById('prev').addEventListener('click', function(){ go(cur-1); });
    document.getElementById('next').addEventListener('click', function(){ go(cur+1); });
    row.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(cur+1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); go(cur-1); }
    });
    var down = false, sx = 0, sl = 0;
    row.addEventListener('pointerdown', function(e){ if(e.pointerType==='mouse'){ down = true; sx = e.clientX; sl = row.scrollLeft; row.style.scrollSnapType='none'; } });
    window.addEventListener('pointerup', function(){ if(down){ down = false; row.style.scrollSnapType=''; go(cur); } });
    window.addEventListener('pointermove', function(e){ if(down){ row.scrollLeft = sl - (e.clientX - sx); } });
    centre(); setTimeout(function(){ go(0); }, 50);
  }

  /* she learns: statements drive the stage */
  var sts = [].slice.call(document.querySelectorAll('.st'));
  var stage = document.getElementById('learnStage');
  if (sts.length && stage){
    function pick(){
      var line = window.innerHeight * (window.innerWidth <= 640 ? .78 : .62), best = sts[0];
      sts.forEach(function(s){
        if (s.querySelector('.st-h').getBoundingClientRect().top <= line) best = s;
      });
      sts.forEach(function(s){ s.classList.toggle('is-on', s === best); });
      stage.dataset.state = best.dataset.s;
    }
    window.addEventListener('scroll', pick, {passive:true});
    window.addEventListener('resize', pick);
    pick();
  }

  /* trust: who approves replies */
  var seg = document.querySelector('.seg');
  if (seg){
    var out = document.getElementById('swOut');
    var msg = {
      team: 'Every reply waits for your GRM. Nothing goes out until it is approved.',
      auto: 'Replies go out on their own, in the tone you set. Your team can still review them afterwards.'
    };
    seg.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b) return;
      [].forEach.call(seg.children, function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      out.textContent = msg[b.dataset.v];
    });
  }

  /* closing sentence */
  var form = document.getElementById('blank');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var v = document.getElementById('em').value.trim();
      document.getElementById('after').textContent = v ? 'Thank you. [confirm: wire this field to trial signup]' : 'Add your work email first.';
    });
  }
  /* hero: gentle pointer tilt */
  var hs = document.querySelector('.hero-stage');
  if (hs && !reduce && window.matchMedia('(pointer:fine)').matches){
    var pn = hs.querySelector('.panel'), tt = hs.querySelector('.toast');
    hs.addEventListener('pointermove', function(e){
      var r = hs.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      pn.style.transform = 'perspective(1000px) rotateY('+(x*5)+'deg) rotateX('+(-y*5)+'deg)';
      tt.style.translate = (x*-18)+'px '+(y*-12)+'px';
    });
    hs.addEventListener('pointerleave', function(){ pn.style.transform=''; tt.style.translate=''; });
  }
})();

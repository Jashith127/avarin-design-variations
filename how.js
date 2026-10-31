/* "What she does": multi-screen mocks, scroll-driven swipe track, zig-zag reveal. */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var all = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* A mock holds whole screens. play() walks them in order and stays on the last. */
  function Mock(el){
    var screens = all('.scr', el), dots = all('.mk-dots i', el);
    var times = (el.getAttribute('data-times') || '').split(',').map(Number);
    var timers = [];
    function show(i){
      screens.forEach(function(s, k){ s.classList.toggle('is-on', k === i); });
      dots.forEach(function(d, k){ d.classList.toggle('on', k === i); });
    }
    this.reset = function(){ timers.forEach(window.clearTimeout); timers = []; show(0); };
    this.play = function(){
      this.reset();
      if (reduce) return;
      var t = 0;
      for (var i = 1; i < screens.length; i++){
        t += times[i - 1] || 3200;
        (function(n, at){ timers.push(window.setTimeout(function(){ show(n); }, at)); }(i, t));
      }
    };
    show(0);
  }
  var mocks = all('.mock').map(function(m){ return new Mock(m); });

  /* ---- A: scroll-driven swipe track ---- */
  var pin = $('#tkPin');
  if (pin){
    var sticky = $('.tk-sticky', pin), track = $('#tkTrack'), slides = all('.slide', track);
    var bar = $('#tkBar'), count = $('#tkCount'), N = slides.length, active = -1, ticking = false;
    pin.style.setProperty('--n', N);
    var STICK = 70;
    function span(){ return pin.offsetHeight - sticky.offsetHeight; }
    function centerOf(i){ return slides[i].offsetLeft + slides[i].offsetWidth / 2; }
    /* smootherstep eases each segment so a card lingers near the center, then yields */
    function easeSeg(f){ f = Math.min(1, Math.max(0, f)); return f * f * f * (f * (f * 6 - 15) + 10); }
    function rawP(){
      var r = pin.getBoundingClientRect();
      return Math.min(1, Math.max(0, (STICK - r.top) / Math.max(1, span())));
    }
    function update(){
      ticking = false;
      var p = rawP(), g = p * (N - 1), e = p;
      if (N > 1){
        var i0 = Math.min(N - 2, Math.floor(g));
        e = (i0 + easeSeg(g - i0)) / (N - 1);
      }
      var half = sticky.clientWidth / 2;
      var x0 = half - centerOf(0), x1 = half - centerOf(N - 1);
      track.style.transform = 'translate3d(' + (x0 + (x1 - x0) * e).toFixed(1) + 'px,0,0)';
      bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      var a = Math.round(g);
      if (a !== active){
        active = a;
        slides.forEach(function(s, i){ s.classList.toggle('on', i === a); });
        mocks.forEach(function(m, i){ if (i === a) m.play(); else m.reset(); });
        count.textContent = (a + 1) + ' / ' + N;
      }
    }
    function request(){ if (!ticking){ ticking = true; window.requestAnimationFrame(update); } }
    function goto(i){
      i = Math.max(0, Math.min(N - 1, i));
      var y = window.pageYOffset + pin.getBoundingClientRect().top - STICK + span() * (i / (N - 1));
      window.scrollTo({ top:y + 1, behavior:reduce ? 'auto' : 'smooth' });
    }
    /* magnet: when a scroll pause leaves a card near the center, settle it there */
    var snapT = null, snapping = false, settled = -1;
    function snap(){
      snapT = null;
      if (reduce || snapping) return;
      var r = pin.getBoundingClientRect();
      if (r.bottom < innerHeight * .3 || r.top > innerHeight * .7) return;
      var g = rawP() * (N - 1), i = Math.round(g), frac = Math.abs(g - i);
      if (frac > .3) settled = -1;
      if (frac < .22 && frac > .001 && settled !== i){
        settled = i; snapping = true;
        goto(i);
        window.setTimeout(function(){ snapping = false; }, 900);
      }
    }
    window.addEventListener('scroll', function(){
      request();
      if (!reduce){
        if (snapT) window.clearTimeout(snapT);
        snapT = window.setTimeout(snap, 150);
      }
    }, { passive:true });
    window.addEventListener('resize', request);
    $('#tkPrev').addEventListener('click', function(){ goto(active - 1); });
    $('#tkNext').addEventListener('click', function(){ goto(active + 1); });
    slides.forEach(function(s, i){ s.addEventListener('click', function(){ if (i !== active) goto(i); }); });

    /* horizontal trackpad / wheel gestures move the page, which moves the track */
    sticky.addEventListener('wheel', function(e){
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)){
        e.preventDefault();
        window.scrollBy(0, e.deltaX * 1.2);
      }
    }, { passive:false });
    /* swipe or drag sideways */
    var sx = 0, sy = 0, last = 0, drag = false, moved = false;
    sticky.addEventListener('pointerdown', function(e){
      if (e.target.closest('button,a')) return;
      drag = true; moved = false; sx = last = e.clientX; sy = e.clientY;
    });
    window.addEventListener('pointermove', function(e){
      if (!drag) return;
      var dx = e.clientX - last;
      if (!moved && Math.abs(e.clientX - sx) < 6) return;
      if (!moved && Math.abs(e.clientY - sy) > Math.abs(e.clientX - sx)){ drag = false; return; }
      moved = true;
      last = e.clientX;
      window.scrollBy(0, -dx * (span() / (centerOf(N - 1) - centerOf(0))));
    });
    window.addEventListener('pointerup', function(){ drag = false; });
    window.addEventListener('pointercancel', function(){ drag = false; });
    sticky.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); goto(active + 1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); goto(active - 1); }
    });
    update();
  }

  /* ---- B: zig-zag rows ---- */
  var rows = all('.zz-row');
  if (rows.length){
    if (reduce || !('IntersectionObserver' in window)){
      rows.forEach(function(r){ r.classList.add('on'); });
    } else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          var i = rows.indexOf(en.target);
          if (en.isIntersecting){
            en.target.classList.add('on');
            if (mocks[i]) mocks[i].play();
          } else if (mocks[i]){
            mocks[i].reset();
          }
        });
      }, { threshold:.5 });
      rows.forEach(function(r){ io.observe(r); });
    }
  }
}());

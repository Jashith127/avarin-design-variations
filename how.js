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

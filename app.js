(function(){
  'use strict';

  /*
    Configurable wording. Marked PENDING DECISION because the client has
    not chosen the final copy yet. Only these tasks set labels:
    OQ-01 primary CTA
    OQ-02 secondary CTA
    OQ-09 demo destination
    OQ-14 role-card expansion width
    OQ-19 briefing label
    S-07 chapter eyebrows
  */
  var CONFIG = {
    CTA_LABEL:'Book a walkthrough',
    CTA_HREF:'mailto:team@avarin.ai?subject=Book%20a%20walkthrough%20of%20Sia',
    CTA_SECONDARY:'',          /* none rendered until OQ-02 is answered */
    BRIEFING_LABEL:"Today's briefing",
    CHAPTER_EYEBROWS:false,    /* S-07 proposal, off by default */
    PLAN_CTA_LABEL:'Talk to our team',
    PLAN_CTA_HREF:'mailto:team@avarin.ai?subject=Talk%20to%20sales%20about%20Sia'
  };

  /* Every gate stays hidden at launch. */
  var CLAIMS_CONFIRMED = {
    learning:false,
    staffReport:false,
    'scene-4':false,
    ownReviews:false,
    siaPersona:false,
    '24/7':false
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var psi = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  function show(el){ if(el){ el.hidden = false; } }
  function hideEl(el){ if(el){ el.hidden = true; } }

  /* ---------------------------------------------------
     Reveal on scroll (opacity/transform only, once).
  ---------------------------------------------------- */
  function initReveals(){
    var items = psi('.rv');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)){
      items.forEach(function(item){ item.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold:.15 });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---------------------------------------------------
     Mobile disclosure navigation.
  ---------------------------------------------------- */
  function initMobileNav(){
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileNav');
    if (!toggle || !menu) return;
    var openMenu = menu;

    function isOpen(){
      return toggle.getAttribute('aria-expanded') === 'true';
    }
    function setOpen(open, focusToggle){
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      menu.hidden = !open;
      if (open && focusToggle){
        var firstLink = openMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      }
      if (!open && focusToggle){
        toggle.focus();
      }
    }
    toggle.addEventListener('click', function(){
      setOpen(!isOpen(), false);
    });
    menu.addEventListener('click', function(event){
      if (event.target.closest('a')){
        setOpen(false, false);
      }
    });
    document.addEventListener('keydown', function(event){
      if (event.code === 'Escape' && isOpen()){
        setOpen(false, true);
      }
    });
    document.addEventListener('pointerdown', function(event){
      if (isOpen() && !event.target.closest('.bar')){
        setOpen(false, false);
      }
    });
  }

  /* ---------------------------------------------------
     Feature-chapter one-shots. End state is markup; JS primes a
     starting state, then plays it once at threshold 0.55.
  ---------------------------------------------------- */
  function initOneShots(){
    var sections = psi('.one-shot');
    if (!sections.length) return;

    /* All sections begin from their finished state; we prime the
       start state for the sections with a staged lifecycle. */
    sections.forEach(function(section){
      if (reduceMotion){
        return;
      }
      section.classList.add('is-primed');
      var steps = psi('[data-lifecycle]', section);
      steps.forEach(function(step, index){
        step.classList.remove('is-done','is-current','is-ended');
        var text = step.querySelector('.step-state');
        if (text){
          text.textContent = index === 0 ? 'Done' : index === 1 ? 'Current' : 'Pending';
        }
        step.classList.add(index === 0 ? 'is-done' : index === 1 ? 'is-current' : 'is-ended');
      });
    });

    function transitionClosure(section){
      var steps = psi('[data-lifecycle]', section);
      if (!steps.length){
        setTimeout(function(){
          section.classList.remove('is-primed');
        }, reduceMotion ? 0 : 250);
        return;
      }
      setTimeout(function(){
        section.classList.remove('is-primed');
      }, reduceMotion ? 0 : 250);
      setTimeout(function(){
        steps.forEach(function(step){
          step.classList.remove('is-done','is-current','is-ended');
          var text = step.querySelector('.step-state');
          if (step.dataset.lifecycle === 'open'){
            step.classList.add('is-done');
            if (text) text.textContent = 'Done';
          } else if (step.dataset.lifecycle === 'progress'){
            step.classList.add('is-done');
            if (text) text.textContent = 'Done';
          } else {
            step.classList.add('is-current');
            if (text) text.textContent = 'Current';
          }
        });
      }, reduceMotion ? 0 : 900);
    }

    if (reduceMotion || !('IntersectionObserver' in window)){
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting || entry.target._played) return;
        entry.target._played = true;
        io.unobserve(entry.target);
        transitionClosure(entry.target);
      });
    }, { threshold:.55 });
    sections.forEach(function(el){ io.observe(el); });
  }

  /* ---------------------------------------------------
     Role cards. Desktop is a hover-expand strip; below 1024px is a
     stacked accordion.
  ---------------------------------------------------- */
  function initRoleCards(){
    var grid = document.getElementById('roleGrid');
    if (!grid) return;
    var cards = psi('#roleGrid .role-card').filter(function(card){ return !card.hidden; });
    var activeIndex = 0;
    var timers = [];

    function isStacked(){
      return window.innerWidth < 1024;
    }

    function apply(){
      cards.forEach(function(card, index){
        var active = index === activeIndex;
        var trigger = card.querySelector('.role-trigger');
        var detail = card.querySelector('.role-detail');
        var indicator = card.querySelector('.role-toggle');
        card.classList.toggle('is-active', active);
        trigger.setAttribute('aria-expanded', String(active));
        if (indicator){
          indicator.textContent = active ? '−' : '+';
        }
        if (active){
          detail.removeAttribute('inert');
        } else {
          detail.setAttribute('inert','');
        }
      });
      if (isStacked()){
        grid.style.gridTemplateColumns = '';
      } else {
        grid.style.gridTemplateColumns = cards.map(function(_, i){
          return i === activeIndex ? '6fr' : '1fr';
        }).join(' ');
      }
    }

    cards.forEach(function(card, index){
      var trigger = card.querySelector('.role-trigger');
      trigger.addEventListener('click', function(){
        activeIndex = index;
        apply();
      }, { once:true });
      if (window.matchMedia('(hover:hover)').matches){
        trigger.addEventListener('pointerenter', function(event){
          if (event.pointerType !== 'mouse') return;
          window.clearTimeout(timers[index]);
          timers[index] = window.setTimeout(function(){
            activeIndex = index;
            apply();
          }, 80);
        });
        trigger.addEventListener('pointerleave', function(){
          window.clearTimeout(timers[index]);
        });
      }
    });

    grid.addEventListener('keydown', function(event){
      var focusCard = document.activeElement && document.activeElement.closest('.role-card');
      if (!focusCard) return;
      var index = cards.indexOf(focusCard);
      if (index < 0) return;
      var next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown'){
        next = (index + 1) % cards.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp'){
        next = (index - 1 + cards.length) % cards.length;
      } else {
        return;
      }
      event.preventDefault();
      activeIndex = next;
      apply();
      cards[next].querySelector('.role-trigger').focus();
    });

    var resizeTimer = null;
    window.addEventListener('resize', function(){
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function(){
        if (isStacked() && (activeIndex < 0 || activeIndex >= cards.length)){
          activeIndex = 0;
        }
        apply();
      }, 140);
    });

    apply();
  }

  /* ---------------------------------------------------
     Trust: the approval setting updates its own result line.
  ---------------------------------------------------- */
  function initApprovalControl(){
    psi('[data-approve]').forEach(function(group){
      var output = group.querySelector('[data-approve-output]');
      var inputs = psi('input[name="approveMode"]', group);
      if (!output || !inputs.length) return;

      function update(){
        var checked = group.querySelector('input:checked');
        var mode = checked ? checked.value : 'team';
        output.textContent = mode === 'positive'
          ? 'Positive reviews are pre-approved. A person still posts it.'
          : 'Your team checks every reply. A person posts it.';
        inputs.forEach(function(input){
          var label = input.closest('.approve-option');
          if (label) label.classList.toggle('is-selected', input.checked);
        });
      }

      inputs.forEach(function(input){
        input.addEventListener('change', update);
      });
      update();
    });
  }

  /* ---------------------------------------------------
     Gated Learning. Steps drive one stage; no sticky stack.
  ---------------------------------------------------- */
  function initLearningSteps(){
    var section = document.getElementById('learns');
    if (!section || section.hidden) return;
    var tabs = psi('.learning-step', section);
    var states = psi('.learning-state', section);
    function show(index){
      tabs.forEach(function(tab, i){
        tab.classList.toggle('is-active', i === index);
        tab.setAttribute('aria-selected', String(i === index));
        tab.setAttribute('tabindex', String(i === index ? '0' : '-1'));
      });
      states.forEach(function(state, i){
        state.hidden = i !== index;
      });
    }
    tabs.forEach(function(tab, i){
      tab.addEventListener('click', function(){
        show(i);
      });
    });
    show(0);
  }

  /* ---------------------------------------------------
     Team: a row of role panels, the centred one lit.
  ---------------------------------------------------- */
  function initTeamRow(){
    var row = document.getElementById('row');
    if (!row) return;
    var pnls = psi('.pnl', row);
    var nm = document.getElementById('pName'), tx = document.getElementById('pText');
    var cur = 0;
    function centre(){
      var mid = row.scrollLeft + row.clientWidth / 2, best = 0, bd = 1e9;
      pnls.forEach(function(p, i){
        var d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid);
        if (d < bd){ bd = d; best = i; }
      });
      if (best !== cur || !pnls[best].classList.contains('is-on')){
        cur = best;
        pnls.forEach(function(p, i){ p.classList.toggle('is-on', i === best); });
        nm.textContent = pnls[best].dataset.name;
        tx.textContent = pnls[best].dataset.text;
      }
    }
    function go(n){
      n = Math.max(0, Math.min(pnls.length - 1, n));
      var p = pnls[n];
      row.scrollTo({ left:p.offsetLeft + p.offsetWidth / 2 - row.clientWidth / 2, behavior:reduceMotion ? 'auto' : 'smooth' });
    }
    row.addEventListener('scroll', centre, { passive:true });
    document.getElementById('prev').addEventListener('click', function(){ go(cur - 1); });
    document.getElementById('next').addEventListener('click', function(){ go(cur + 1); });
    row.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); go(cur - 1); }
    });
    var down = false, sx = 0, sl = 0;
    row.addEventListener('pointerdown', function(e){ if (e.pointerType === 'mouse'){ down = true; sx = e.clientX; sl = row.scrollLeft; row.style.scrollSnapType = 'none'; } });
    window.addEventListener('pointerup', function(){ if (down){ down = false; row.style.scrollSnapType = ''; go(cur); } });
    window.addEventListener('pointermove', function(e){ if (down){ row.scrollLeft = sl - (e.clientX - sx); } });
    centre();
    window.setTimeout(function(){ go(0); }, 50);
  }

  /* --------------------------------------------- */
  function applyConfig(){
    psi('[data-cta]').forEach(function(a){
      a.href = CONFIG.CTA_HREF;
      if (a.classList.contains('btn')){
        a.textContent = CONFIG.CTA_LABEL;
      }
    });
    psi('[data-briefing-label]').forEach(function(el){
      el.textContent = CONFIG.BRIEFING_LABEL;
    });
    psi('[data-chapter-eyebrow]').forEach(function(el){
      el.hidden = !CONFIG.CHAPTER_EYEBROWS;
    });
    psi('[data-plan-cta]').forEach(function(a){
      a.textContent = CONFIG.PLAN_CTA_LABEL;
      a.href = CONFIG.PLAN_CTA_HREF;
    });
    psi('[data-cta-label]').forEach(function(el){
      el.textContent = CONFIG.CTA_LABEL;
    });
  }

  function applyClaims(){
    var mapping = {
      learning:'learning',
      'staff-report':'staffReport',
      'scene-4':'scene-4',
      'own-reviews':'ownReviews',
      'sia-persona':'siaPersona'
    };
    psi('[data-claim]').forEach(function(el){
      var claim = el.dataset.claim;
      var key = mapping[claim];
      if (!key) return;
      var visible = CLAIMS_CONFIRMED[key];
      if (visible){
        show(el);
      } else {
        hideEl(el);
      }
    });
  }

  /* ---------------------------------------------------
     Header wordmark: big in the hero, docked center-bar on scroll.
  ---------------------------------------------------- */
  function initHeaderBrand(){
    function onScroll(){
      document.body.classList.toggle('is-scrolled', window.scrollY > 24);
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  /* --------------------------------------- */
  function applyAll(){
    applyConfig();
    applyClaims();
    initHeaderBrand();
    initMobileNav();
    initReveals();
    initOneShots();
    initRoleCards();
    initApprovalControl();
    initLearningSteps();
    initTeamRow();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();

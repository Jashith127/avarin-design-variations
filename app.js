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
     Team: one black band, one slide per role. Tabs and arrows move
     between roles; inside a role, a guided tour steps through the
     features on its own until the visitor takes over.
  ---------------------------------------------------- */
  function initTeam(){
    var section = document.getElementById('team');
    var track = document.getElementById('tmTrack');
    if (!section || !track) return;
    var tabs = psi('.tm-tab', section);
    var slides = psi('.tm-slide', section);
    var prev = document.getElementById('tmPrev');
    var next = document.getElementById('tmNext');
    var count = document.getElementById('tmCount');
    var current = 0;
    var live = false;
    var manual = false;
    var scrollMode = false;
    var segs = psi('.tm-segs i', section);
    var groups = psi('.tm-grp', section);
    var steps = [];
    slides.forEach(function(slide, si){
      psi('.tm-chip', slide).forEach(function(_, fi){ steps.push({ slide:si, feat:fi }); });
    });
    var starts = slides.map(function(_, si){
      return steps.findIndex(function(s){ return s.slide === si; });
    });
    var lastStep = -1;

    function stopAuto(){
      manual = true;
      section.classList.add('is-manual');
    }

    function show(index, moveFocus){
      current = Math.max(0, Math.min(slides.length - 1, index));
      section.setAttribute('data-theme', slides[current].dataset.role);
      slides.forEach(function(slide, i){
        var on = i === current;
        slide.classList.toggle('is-on', on);
        slide.classList.toggle('is-before', i < current);
        if (on){
          slide.removeAttribute('inert');
          slide.removeAttribute('aria-hidden');
        } else {
          slide.setAttribute('inert', '');
          slide.setAttribute('aria-hidden', 'true');
        }
      });
      groups.forEach(function(group, i){ group.classList.toggle('is-on', i === current); });
      tabs.forEach(function(tab, i){
        tab.setAttribute('aria-selected', String(i === current));
        tab.setAttribute('tabindex', i === current ? '0' : '-1');
      });
      prev.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      count.textContent = (current + 1) + ' / ' + slides.length;
      if (moveFocus) tabs[current].focus();
    }

    function openFeature(slide, index, moveFocus){
      var chips = psi('.tm-chip', slide);
      var cards = psi('.tm-card', slide);
      index = (index + chips.length) % chips.length;
      var screen = cards[index].dataset.screen;
      chips.forEach(function(chip, i){
        chip.classList.toggle('is-on', i === index);
        chip.setAttribute('aria-selected', String(i === index));
        chip.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      cards.forEach(function(card, i){
        card.classList.toggle('is-on', i === index);
        card.classList.toggle('is-before', i < index);
      });
      psi('.tm-screen', slide).forEach(function(s, i){
        s.classList.toggle('is-on', i === index);
        s.classList.toggle('is-before', i < index);
      });
      if (moveFocus) chips[index].focus();
    }

    slides.forEach(function(slide){
      var chips = psi('.tm-chip', slide);
      chips.forEach(function(chip, i){
        chip.addEventListener('click', function(){ stopAuto(); openFeature(slide, i); });
        chip.addEventListener('keydown', function(event){
          var target = null;
          if (event.key === 'ArrowRight') target = i + 1;
          else if (event.key === 'ArrowLeft') target = i - 1;
          else if (event.key === 'Home') target = 0;
          else if (event.key === 'End') target = chips.length - 1;
          if (target === null) return;
          event.preventDefault();
          stopAuto();
          openFeature(slide, target, true);
        });
        chip.addEventListener('animationend', function(){
          if (scrollMode || manual || !live || !chip.classList.contains('is-on')) return;
          openFeature(slide, i + 1);
        });
      });
    });

    tabs.forEach(function(tab, i){
      tab.addEventListener('click', function(){ stopAuto(); if (scrollMode){ jumpTo(starts[i]); } else { show(i); } });
      tab.addEventListener('keydown', function(event){
        var target = null;
        if (event.key === 'ArrowRight') target = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') target = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = tabs.length - 1;
        if (target === null) return;
        event.preventDefault();
        stopAuto();
        show(target, true);
      });
    });
    groups.forEach(function(group, i){
      group.addEventListener('click', function(){ stopAuto(); jumpTo(starts[i]); });
    });
    prev.addEventListener('click', function(){ stopAuto(); show(current - 1); });
    next.addEventListener('click', function(){ stopAuto(); show(current + 1); });

    function span(){
      return section.offsetHeight - window.innerHeight;
    }
    function jumpTo(step){
      var top = section.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: top + (step + 0.5) / steps.length * span(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function onScroll(){
      if (!scrollMode) return;
      var p = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / span()));
      var pos = p * steps.length;
      var idx = Math.min(steps.length - 1, Math.floor(pos));
      segs.forEach(function(seg, k){
        seg.style.setProperty('--f', String(Math.max(0, Math.min(1, pos - k))));
      });
      section.classList.toggle('is-moved', p > 0.02);
      if (idx === lastStep) return;
      lastStep = idx;
      var step = steps[idx];
      if (step.slide !== current) show(step.slide);
      openFeature(slides[step.slide], step.feat);
    }
    function evalMode(){
      var on = window.innerWidth >= 900 && window.innerHeight >= 560 && !reduceMotion;
      if (on !== scrollMode){
        scrollMode = on;
        section.classList.toggle('is-scroll', on);
        lastStep = -1;
        if (!on) section.classList.remove('is-moved');
      }
      section.style.setProperty('--steps', String(steps.length));
      onScroll();
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', evalMode);

    var startX = null;
    track.addEventListener('touchstart', function(event){ startX = event.touches[0].clientX; }, { passive:true });
    track.addEventListener('touchend', function(event){
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (!scrollMode && Math.abs(dx) > 60){ stopAuto(); show(current + (dx < 0 ? 1 : -1)); }
    }, { passive:true });

    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        live = entries[0].isIntersecting;
        section.classList.toggle('is-live', live && !reduceMotion);
      }, { threshold:.35 }).observe(section);
    }

    show(0);
    evalMode();
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
    initTeam();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();

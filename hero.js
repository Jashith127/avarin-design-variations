/* Hero demo. A cursor works through Briefing, Reviews and Issues on a loop.
   The window never changes size: each view moves between whole screens.
   Markup holds the first screen of every view, so it reads fine without JS. */
(function(){
  'use strict';
  var stage = document.getElementById('apStage');
  if (!stage) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var all = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var cursor = $('cursor'), cursorTag = $('cursorTag');
  var capStep = $('capStep'), capText = $('capText'), apTitle = $('apTitle');
  var pauseButton = $('heroPause'), pauseLabel = $('pauseLabel'), announcer = $('heroAnnouncement');
  var order = ['briefing', 'reviews', 'issues'];
  var who = { briefing:'GM', reviews:'GRM', issues:'Maintenance' };
  var TITLES = ['Today\'s brief', 'Review inbox', 'Issues'];
  var CAPS = [['1 · Briefing', 'Every morning, Sia tells you what needs you.'],
              ['2 · Reviews', 'Replies are drafted for you. A person approves every one.'],
              ['3 · Issues', 'Guest feedback becomes an owned issue, tracked to Solved.']];
  var tabs = order.map(function(n){ return $('ap-tab-' + n); });
  var views = order.map(function(n){ return $('apv-' + n); });
  var CANCEL = {};
  var run = 0, current = 0, userPaused = false, onscreen = false, timer = null;

  /* ---- helpers ---- */
  function wait(ms, id){
    return new Promise(function(resolve, reject){
      window.setTimeout(function(){ id === run ? resolve() : reject(CANCEL); }, ms);
    });
  }
  function point(el, fx, fy){
    var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x:r.left - s.left + r.width * fx, y:r.top - s.top + r.height * fy };
  }
  async function fly(el, id, fx, fy){
    var p = point(el, fx == null ? .5 : fx, fy == null ? .5 : fy);
    cursor.style.transform = 'translate3d(' + p.x + 'px,0,0)';
    cursor.firstElementChild.style.transform = 'translate3d(0,' + p.y + 'px,0)';
    await wait(1000, id);
  }
  async function tap(el, id){
    cursor.classList.remove('is-click');
    void cursor.offsetWidth;
    cursor.classList.add('is-click');
    if (el){ el.classList.add('is-pressed'); window.setTimeout(function(){ el.classList.remove('is-pressed'); }, 180); }
    await wait(240, id);
  }
  async function typeInto(el, text, id, speed){
    for (var i = 1; i <= text.length; i++){
      el.textContent = text.slice(0, i);
      await wait(speed, id);
    }
  }
  function screen(view, name){
    all('.scr', view).forEach(function(s){ s.classList.toggle('is-on', s.getAttribute('data-scr') === name); });
  }
  function pick(rows, n){ rows.forEach(function(r, i){ r.classList.toggle('is-selected', i === n); }); }

  /* ---- Briefing ---- */
  var briefList = $('briefList'), input = $('apInput'), inputText = $('apInputText'), send = $('apSend');
  var bubU = $('bubU'), bubS = $('bubS'), typing = $('typing');
  var ASK = 'Which issue should I look at first?';
  function briefReset(){
    screen(views[0], 'list');
    briefList.classList.add('is-arming');
    all('li', briefList).forEach(function(li){ li.classList.remove('in'); });
    inputText.textContent = 'Ask Sia anything';
    input.classList.remove('is-focus');
    [bubU, bubS].forEach(function(b){ b.classList.add('is-hidden'); });
    typing.classList.add('is-hidden');
  }
  function briefFirst(){
    screen(views[0], 'list');
    briefList.classList.remove('is-arming');
    inputText.textContent = 'Ask Sia anything';
    input.classList.remove('is-focus');
  }
  async function playBriefing(id){
    briefReset();
    await wait(300, id);
    var items = all('li', briefList);
    for (var i = 0; i < items.length; i++){
      items[i].classList.add('in');
      await wait(420, id);
    }
    await wait(500, id);
    await fly(input, id, .3, .5);
    await tap(input, id);
    input.classList.add('is-focus');
    inputText.textContent = '';
    await typeInto(inputText, ASK, id, 30);
    await wait(350, id);
    await fly(send, id);
    await tap(send, id);
    screen(views[0], 'chat');
    inputText.textContent = 'Ask Sia anything';
    input.classList.remove('is-focus');
    await wait(350, id);
    bubU.classList.remove('is-hidden');
    await wait(500, id);
    typing.classList.remove('is-hidden');
    await wait(1100, id);
    typing.classList.add('is-hidden');
    bubS.classList.remove('is-hidden');
    await wait(3200, id);
  }

  /* ---- Reviews ---- */
  var revRows = all('.inbox-row', $('reviewList'));
  var draftText = $('draftText'), draftState = $('draftState'), approveChip = $('approveChip'), draftTag = $('draftTag');
  var DRAFT = draftText.getAttribute('data-text');
  function approved(on){
    approveChip.textContent = on ? 'Approved' : 'Approve';
    approveChip.classList.toggle('is-done', on);
    draftTag.textContent = on ? 'Approved' : 'To approve';
    draftState.textContent = on ? 'A person posts it.' : 'A person posts every reply.';
  }
  function reviewsFirst(){ screen(views[1], 'inbox'); pick(revRows, -1); draftText.textContent = DRAFT; approved(false); }
  async function playReviews(id){
    reviewsFirst();
    draftText.textContent = '';
    await wait(700, id);
    await fly(revRows[1], id, .55, .5);
    await tap(revRows[1], id);
    pick(revRows, 1);
    await wait(250, id);
    screen(views[1], 'detail');
    await wait(500, id);
    await typeInto(draftText, DRAFT, id, 12);
    await wait(500, id);
    await fly(approveChip, id);
    await tap(approveChip, id);
    approved(true);
    await wait(3000, id);
  }

  /* ---- Issues ---- */
  var issRows = all('.inbox-row', $('issueList')), newRow = issRows[0];
  var statusTag = $('statusTag'), lifeSteps = all('li', $('lifecycle')), resSlot = $('resSlot'), acceptChip = $('acceptChip');
  function life(step){
    lifeSteps.forEach(function(li, i){
      li.classList.remove('is-done', 'is-current');
      if (i < step) li.classList.add('is-done');
      if (i === step) li.classList.add('is-current');
      li.querySelector('.step-state').textContent = i < step ? 'Done' : i === step ? 'Current' : 'Pending';
    });
    statusTag.textContent = ['Open', 'In Progress', 'Solved'][step];
    statusTag.className = 'tag ' + (step === 2 ? 'tag-green' : 'tag-blue');
    resSlot.classList.toggle('is-hidden', step < 2);
    acceptChip.textContent = step === 0 ? 'Accept' : 'Accepted';
    acceptChip.classList.toggle('is-done', step > 0);
  }
  function issuesFirst(){ screen(views[2], 'list'); newRow.classList.remove('is-hidden'); pick(issRows, -1); life(0); }
  async function playIssues(id){
    issuesFirst();
    newRow.classList.add('is-hidden');
    await wait(900, id);
    newRow.classList.remove('is-hidden');
    await wait(1300, id);
    await fly(newRow, id, .5, .5);
    await tap(newRow, id);
    pick(issRows, 0);
    await wait(250, id);
    screen(views[2], 'detail');
    await wait(900, id);
    await fly(acceptChip, id);
    await tap(acceptChip, id);
    life(1);
    await wait(1700, id);
    life(2);
    await wait(3000, id);
  }

  var players = [playBriefing, playReviews, playIssues];
  var firsts = [briefFirst, reviewsFirst, issuesFirst];

  /* ---- orchestration ---- */
  function showView(i){
    views.forEach(function(v, k){
      var on = k === i;
      v.classList.toggle('is-on', on);
      v.setAttribute('aria-hidden', String(!on));
      if (on) v.removeAttribute('inert'); else v.setAttribute('inert', '');
    });
    tabs.forEach(function(t, k){
      t.setAttribute('aria-selected', String(k === i));
      t.setAttribute('tabindex', k === i ? '0' : '-1');
    });
    cursorTag.textContent = who[order[i]];
    capStep.textContent = CAPS[i][0];
    capText.textContent = CAPS[i][1];
    apTitle.textContent = TITLES[i];
    current = i;
  }
  async function loop(start, skipTab){
    var id = ++run;
    try {
      var i = start, first = skipTab;
      while (true){
        if (!first){
          await fly(tabs[i], id);
          await tap(tabs[i], id);
        }
        first = false;
        showView(i);
        await players[i](id);
        i = (i + 1) % order.length;
      }
    } catch (e){
      if (e !== CANCEL) throw e;
    }
  }
  function stop(){ run++; window.clearTimeout(timer); cursor.classList.remove('is-live'); }
  function canPlay(){ return !userPaused && onscreen && !document.hidden; }
  function begin(i, skipTab){
    stop();
    showView(i);
    firsts[i]();
    if (!canPlay()) return;
    var s = stage.getBoundingClientRect();
    cursor.style.transition = 'none';
    cursor.firstElementChild.style.transition = 'none';
    cursor.style.transform = 'translate3d(' + (s.width * .86) + 'px,0,0)';
    cursor.firstElementChild.style.transform = 'translate3d(0,' + (s.height * .1) + 'px,0)';
    void cursor.offsetWidth;
    cursor.style.transition = '';
    cursor.firstElementChild.style.transition = '';
    cursor.classList.add('is-live');
    timer = window.setTimeout(function(){ loop(i, skipTab); }, 300);
  }

  tabs.forEach(function(tab, i){
    tab.addEventListener('click', function(event){
      if (!event.isTrusted) return;
      announcer.textContent = tab.textContent;
      begin(i, true);
    });
  });
  pauseButton.addEventListener('click', function(){
    userPaused = !userPaused;
    pauseLabel.textContent = userPaused ? 'Play' : 'Pause';
    pauseButton.setAttribute('aria-label', userPaused ? 'Play automatic demo' : 'Pause automatic demo');
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    begin(current, true);
  });
  tabs[0].parentNode.addEventListener('keydown', function(event){
    var d = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    event.preventDefault();
    var n = (current + d + order.length) % order.length;
    tabs[n].focus();
    tabs[n].click();
  });

  showView(0);
  firsts.forEach(function(f){ f(); });
  if (reduce || !('IntersectionObserver' in window)){
    pauseButton.hidden = true;
    return;
  }
  new IntersectionObserver(function(entries){
    var now = entries[0].isIntersecting;
    if (now === onscreen) return;
    onscreen = now;
    if (now) begin(current, true); else stop();
  }, { threshold:.1 }).observe(stage);
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) stop(); else if (onscreen) begin(current, true);
  });
}());

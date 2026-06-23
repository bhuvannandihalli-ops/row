// voice.js — mic button on every text input, cross-page
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  let activeRec = null;
  let activeBtn = null;

  function stopActive() {
    if (activeRec) { try { activeRec.stop(); } catch (_) {} activeRec = null; }
    if (activeBtn) { activeBtn.classList.remove('vb--on'); activeBtn = null; }
  }

  const MIC = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm7 11a7 7 0 0 1-14 0H3' +
    'a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2z"/></svg>';

  function attach(input) {
    if (input._vb) return;
    const t = (input.type || 'text').toLowerCase();
    if (['password','hidden','range','checkbox','radio','submit','button','file','color'].indexOf(t) >= 0) return;
    input._vb = true;

    // Snapshot flex properties BEFORE we touch anything
    const cs = getComputedStyle(input);
    const flexGrow   = cs.flexGrow   || '0';
    const flexShrink = cs.flexShrink || '1';
    const flexBasis  = cs.flexBasis  || 'auto';
    const minW       = cs.minWidth;
    const maxW       = cs.maxWidth;

    // Build wrapper — inherits the input's place in the flex/grid layout
    const wr = document.createElement('span');
    wr.className = 'vb-wrap';
    wr.style.flexGrow   = flexGrow;
    wr.style.flexShrink = flexShrink;
    wr.style.flexBasis  = flexBasis;
    wr.style.minWidth   = (parseFloat(minW) > 0) ? minW : '0';
    if (maxW && maxW !== 'none') wr.style.maxWidth = maxW;

    input.parentNode.insertBefore(wr, input);
    wr.appendChild(input);

    // Input fills wrapper; override any conflicting size rules
    input.style.flex     = '1 1 0';
    input.style.minWidth = '0';
    input.style.width    = '100%';
    input.style.boxSizing = 'border-box';

    // Add right padding so text doesn't run under the mic button
    const curPR = parseFloat(cs.paddingRight) || 0;
    input.style.paddingRight = Math.max(curPR, 4) + 28 + 'px';

    // Mic button — absolute so it doesn't affect layout width
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vb';
    btn.title = 'Speak to type';
    btn.setAttribute('aria-label', 'Voice input');
    btn.innerHTML = MIC;
    wr.appendChild(btn);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (activeBtn === btn) { stopActive(); return; }
      stopActive();

      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = function (ev) {
        const text = ev.results[0][0].transcript;
        input.value = input.value ? input.value + ' ' + text : text;
        input.dispatchEvent(new Event('input',  { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
        stopActive();
      };
      rec.onerror = stopActive;
      rec.onend   = function () { if (activeBtn === btn) stopActive(); };

      activeRec = rec;
      activeBtn = btn;
      btn.classList.add('vb--on');
      try { rec.start(); } catch (_) { stopActive(); }
    });
  }

  function injectCSS() {
    if (document.getElementById('vb-css')) return;
    const s = document.createElement('style');
    s.id = 'vb-css';
    s.textContent =
      '.vb-wrap{position:relative;display:inline-flex;align-items:center;min-width:0}' +
      '.vb-wrap>input,.vb-wrap>textarea{flex:1 1 0;min-width:0;width:100%!important;box-sizing:border-box}' +
      '.vb{position:absolute;right:6px;top:50%;transform:translateY(-50%);' +
        'width:24px;height:24px;border-radius:50%;' +
        'border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);' +
        'color:rgba(255,255,255,.45);cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'padding:0;z-index:3;transition:background .15s,color .15s}' +
      '.vb:hover{background:rgba(255,255,255,.12);color:rgba(255,255,255,.8)}' +
      '.vb--on{background:rgba(220,55,55,.25)!important;color:#e05555!important;' +
        'border-color:rgba(220,55,55,.5)!important;' +
        'animation:vb-pulse 1s ease-in-out infinite}' +
      '@keyframes vb-pulse{' +
        '0%,100%{box-shadow:0 0 0 0 rgba(220,55,55,.55)}' +
        '50%{box-shadow:0 0 0 6px rgba(220,55,55,0)}}' +
      /* For textareas, anchor to top-right instead of center */
      '.vb-wrap>textarea~.vb{top:10px;transform:none}';
    document.head.appendChild(s);
  }

  let _tid;
  function scan() {
    clearTimeout(_tid);
    _tid = setTimeout(function () {
      document.querySelectorAll(
        'input[type=text],input[type=number],input[type=search],input:not([type]),textarea'
      ).forEach(attach);
    }, 30);
  }

  injectCSS();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();

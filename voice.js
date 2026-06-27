// voice.js — inline mic button on every text input, continuous + live transcription
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  // Only one recording session at a time
  let activeRec   = null;
  let activeBtn   = null;
  let activeInput = null;

  const MIC_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-2 4v6a2 2 0 0 0 4 0V5a2 2 0 0 0-4 0zM5.3 10a1 1 0 0 1 1 1A5.7 5.7 0 0 0 12 16.7 5.7 5.7 0 0 0 17.7 11a1 1 0 0 1 2 0A7.7 7.7 0 0 1 13 18.65V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.35A7.7 7.7 0 0 1 4.3 11a1 1 0 0 1 1-1z"/></svg>';
  const STOP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';

  function stopActive() {
    if (activeRec) { try { activeRec.stop(); } catch (_) {} activeRec = null; }
    if (activeBtn) {
      activeBtn.classList.remove('vmic--on');
      activeBtn.innerHTML = MIC_SVG;
      activeBtn = null;
    }
    activeInput = null;
  }

  function startRec(input, btn) {
    stopActive();

    // Capture existing text as the base
    let baseText    = input.value.trimEnd();
    if (baseText && !baseText.endsWith(' ')) baseText += ' ';
    let finalChunk  = '';
    let restartTid  = null;
    let alive       = true; // set false when user taps stop

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-US';

    rec.onresult = function (e) {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalChunk += e.results[i][0].transcript;
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      input.value = baseText + finalChunk + interim;
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    rec.onerror = function (e) {
      // not-allowed = mic blocked; anything other than no-speech/aborted is fatal
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        alive = false;
        stopActive();
      }
    };

    rec.onend = function () {
      if (!alive || activeRec !== rec) return;
      // Roll final text into base before restarting
      baseText    = input.value.trimEnd();
      if (baseText && !baseText.endsWith(' ')) baseText += ' ';
      finalChunk  = '';
      // Short delay required before calling start() again
      clearTimeout(restartTid);
      restartTid = setTimeout(function () {
        if (!alive || activeRec !== rec) return;
        try { rec.start(); } catch (_) { alive = false; stopActive(); }
      }, 180);
    };

    activeRec   = rec;
    activeBtn   = btn;
    activeInput = input;
    btn.classList.add('vmic--on');
    btn.innerHTML = STOP_SVG;

    try { rec.start(); } catch (_) { stopActive(); }

    // Expose stop so external callers can stop it
    rec._stop = function () { alive = false; clearTimeout(restartTid); stopActive(); };
  }

  // ── Attach mic button to a single input/textarea ──────────────────────────
  function attach(input) {
    if (input._vmic) return;
    const t = (input.type || 'text').toLowerCase();
    if (['password','hidden','range','checkbox','radio','file',
         'color','submit','button','image','time','date','datetime-local','month','week'].indexOf(t) >= 0) return;
    if (input.dataset.vmicSkip) return; // opt-out attribute
    input._vmic = true;

    const isTA = input.tagName === 'TEXTAREA';

    // Snapshot flex values BEFORE touching the DOM
    const cs = window.getComputedStyle(input);
    const fg = cs.flexGrow, fs = cs.flexShrink, fb = cs.flexBasis;
    const mw = cs.minWidth, mxw = cs.maxWidth;
    const curPR = parseFloat(cs.paddingRight) || 0;
    const curPT = parseFloat(cs.paddingTop)   || 0;

    // Wrapper carries the input's place in the parent flex/grid/block layout
    const wrap = document.createElement('span');
    wrap.className = 'vmic-wrap';
    wrap.style.flexGrow   = fg;
    wrap.style.flexShrink = fs;
    wrap.style.flexBasis  = fb;
    if (parseFloat(mw)  > 0) wrap.style.minWidth = mw;
    if (mxw && mxw !== 'none' && mxw !== '0px') wrap.style.maxWidth = mxw;

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    // Input fills wrapper
    input.style.flex      = '1 1 0';
    input.style.minWidth  = '0';
    input.style.width     = '100%';
    input.style.boxSizing = 'border-box';

    // Padding to keep text away from the button
    if (!isTA) {
      input.style.paddingRight = (Math.max(curPR, 6) + 30) + 'px';
    } else {
      input.style.paddingTop = (Math.max(curPT, 6) + (isTA ? 0 : 0)) + 'px';
    }

    // Mic button
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'vmic-btn' + (isTA ? ' vmic-btn--ta' : '');
    btn.title     = 'Tap to speak';
    btn.setAttribute('aria-label', 'Voice input');
    btn.innerHTML = MIC_SVG;
    wrap.appendChild(btn);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (activeBtn === btn) {
        if (activeRec && activeRec._stop) activeRec._stop();
        else stopActive();
      } else {
        startRec(input, btn);
      }
    });
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('vmic-css')) return;
    const s = document.createElement('style');
    s.id = 'vmic-css';
    s.textContent =
      '.vmic-wrap{position:relative;display:flex;align-items:stretch;min-width:0}' +
      '.vmic-wrap>input,.vmic-wrap>textarea{flex:1;min-width:0;width:100%!important;box-sizing:border-box}' +

      /* Button — default (single-line inputs) */
      '.vmic-btn{' +
        'position:absolute;right:6px;top:50%;transform:translateY(-50%);' +
        'width:26px;height:26px;border-radius:50%;' +
        'border:1px solid rgba(255,255,255,.1);' +
        'background:rgba(255,255,255,.05);' +
        'color:rgba(255,255,255,.45);cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'padding:0;flex-shrink:0;z-index:3;' +
        'transition:background .15s,color .15s,border-color .15s}' +

      /* Button — textarea variant (anchored top-right) */
      '.vmic-btn--ta{top:8px;transform:none}' +

      '.vmic-btn:hover{' +
        'background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);' +
        'border-color:rgba(255,255,255,.22)}' +

      /* Active / recording state */
      '.vmic-btn.vmic--on{' +
        'background:rgba(220,55,55,.22)!important;' +
        'color:#e05555!important;' +
        'border-color:rgba(220,55,55,.5)!important;' +
        'animation:vmic-pulse 1s ease-in-out infinite}' +

      '@keyframes vmic-pulse{' +
        '0%,100%{box-shadow:0 0 0 0 rgba(220,55,55,.55)}' +
        '50%{box-shadow:0 0 0 7px rgba(220,55,55,0)}}';
    document.head.appendChild(s);
  }

  // ── Scan & observe ────────────────────────────────────────────────────────
  let scanTid;
  function scan() {
    clearTimeout(scanTid);
    scanTid = setTimeout(function () {
      document.querySelectorAll(
        'input:not([data-vmic-skip]),textarea:not([data-vmic-skip])'
      ).forEach(attach);
    }, 40);
  }

  injectCSS();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();

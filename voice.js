// voice.js — floating mic button, dictates into whatever input is focused
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // --- build the button regardless (hide if SR unsupported so we can show a message) ---
  const btn = document.createElement('button');
  btn.id = 'global-mic-btn';
  btn.setAttribute('aria-label', 'Voice input');
  btn.innerHTML = '🎤';

  const toast = document.createElement('div');
  toast.id = 'mic-toast';

  const style = document.createElement('style');
  style.textContent =
    '#global-mic-btn{' +
      'position:fixed;' +
      'bottom:calc(max(76px, env(safe-area-inset-bottom, 0px)) + 14px);' +
      'right:max(18px, env(safe-area-inset-right, 0px));' +
      'z-index:9999;width:52px;height:52px;border-radius:50%;border:none;' +
      'background:rgba(40,40,50,0.92);backdrop-filter:blur(10px);' +
      '-webkit-backdrop-filter:blur(10px);' +
      'color:#fff;font-size:22px;cursor:pointer;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.08);' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:background 0.2s,transform 0.12s,box-shadow 0.2s;' +
      '-webkit-tap-highlight-color:transparent;user-select:none}' +
    '#global-mic-btn:hover{background:rgba(55,55,68,0.95);transform:scale(1.06)}' +
    '#global-mic-btn:active{transform:scale(0.94)}' +
    '#global-mic-btn.mic-listening{' +
      'background:rgba(200,40,40,0.85)!important;' +
      'box-shadow:0 4px 20px rgba(220,55,55,0.55),inset 0 1px 0 rgba(255,255,255,0.08)!important;' +
      'animation:mic-ring 1.1s ease-in-out infinite}' +
    '#global-mic-btn.mic-no-target{animation:mic-shake 0.4s ease}' +
    '@keyframes mic-ring{' +
      '0%,100%{box-shadow:0 4px 20px rgba(220,55,55,0.55),0 0 0 0 rgba(220,55,55,0.5)}' +
      '50%{box-shadow:0 4px 20px rgba(220,55,55,0.55),0 0 0 10px rgba(220,55,55,0)}}' +
    '@keyframes mic-shake{' +
      '0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}' +
    '#mic-toast{' +
      'position:fixed;bottom:calc(max(76px, env(safe-area-inset-bottom,0px)) + 76px);' +
      'right:max(18px, env(safe-area-inset-right,0px));' +
      'z-index:9998;background:rgba(30,30,38,0.95);backdrop-filter:blur(12px);' +
      '-webkit-backdrop-filter:blur(12px);' +
      'color:#E0DDD8;font-size:12px;font-weight:600;' +
      'padding:7px 13px;border-radius:10px;white-space:nowrap;' +
      'border:1px solid rgba(255,255,255,0.1);' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.45);' +
      'opacity:0;transform:translateY(6px) scale(0.96);' +
      'transition:opacity 0.18s,transform 0.18s;pointer-events:none}' +
    '#mic-toast.mic-toast-show{opacity:1;transform:translateY(0) scale(1)}';

  document.head.appendChild(style);

  function mount() {
    if (!document.body.contains(btn)) {
      document.body.appendChild(btn);
      document.body.appendChild(toast);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  // --- track last focused text input ---
  let target = null;
  document.addEventListener('focusin', function (e) {
    const el = e.target;
    if (!el) return;
    const t = (el.type || '').toLowerCase();
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
        t !== 'password' && t !== 'hidden' && t !== 'checkbox' &&
        t !== 'radio' && t !== 'range' && t !== 'file') {
      target = el;
    }
  }, true);

  function showToast(msg, dur) {
    toast.textContent = msg;
    toast.classList.add('mic-toast-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('mic-toast-show'); }, dur || 2200);
  }

  // --- speech recognition ---
  if (!SR) {
    btn.title = 'Voice input not supported in this browser (try Chrome or Safari)';
    btn.style.opacity = '0.45';
    btn.addEventListener('click', function () {
      showToast('Voice not supported — use Chrome or Safari', 3000);
    });
    return;
  }

  let rec = null;

  function stopRec() {
    if (rec) { try { rec.stop(); } catch (_) {} rec = null; }
    btn.classList.remove('mic-listening');
    btn.innerHTML = '🎤';
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault();

    if (rec) { stopRec(); return; }

    if (!target || !document.contains(target)) {
      btn.classList.add('mic-no-target');
      showToast('Tap a text field first, then tap 🎤', 2500);
      setTimeout(function () { btn.classList.remove('mic-no-target'); }, 420);
      return;
    }

    rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = function (ev) {
      const text = ev.results[0][0].transcript;
      if (target && document.contains(target)) {
        target.value = target.value ? target.value + ' ' + text : text;
        target.dispatchEvent(new Event('input',  { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.focus();
      }
      showToast('✓ ' + text, 2000);
      stopRec();
    };

    rec.onerror = function (ev) {
      if (ev.error === 'not-allowed') showToast('Microphone permission denied', 2800);
      else if (ev.error === 'no-speech') showToast('No speech detected — try again', 2200);
      stopRec();
    };

    rec.onend = function () { if (rec) stopRec(); };

    try {
      rec.start();
      btn.classList.add('mic-listening');
      btn.innerHTML = '⏹';
      showToast('Listening…', 8000);
    } catch (_) {
      stopRec();
    }
  });
})();

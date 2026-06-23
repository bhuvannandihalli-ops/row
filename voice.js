// voice.js — voice-to-text mic button for all text inputs across the dashboard
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  let activeRec = null;
  let activeBtn = null;

  function stopActive() {
    if (activeRec) { try { activeRec.stop(); } catch (e) {} activeRec = null; }
    if (activeBtn) { activeBtn.classList.remove('voice-btn--active'); activeBtn = null; }
  }

  const MIC_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm7 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2z"/></svg>';

  function attachMic(input) {
    if (input.dataset.voiceAttached) return;
    if (input.type === 'password') return;
    if (input.type === 'range' || input.type === 'checkbox' || input.type === 'radio' || input.type === 'hidden') return;
    input.dataset.voiceAttached = '1';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voice-btn';
    btn.title = 'Speak to type';
    btn.innerHTML = MIC_SVG;

    // Wrap input + button in a flex container
    const wrap = document.createElement('span');
    wrap.className = 'voice-wrap';

    const parent = input.parentNode;
    const next = input.nextSibling;
    wrap.appendChild(input);
    wrap.appendChild(btn);
    parent.insertBefore(wrap, next);

    // Copy width from input's computed style so layout stays the same
    const computedWidth = input.style.width || '';
    if (computedWidth) {
      wrap.style.width = computedWidth;
      input.style.width = '';
    }

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
        const transcript = ev.results[0][0].transcript;
        const cur = input.value;
        input.value = cur ? cur + ' ' + transcript : transcript;

        // Trigger framework listeners (React, Vue, plain oninput, etc.)
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
        stopActive();
      };

      rec.onerror = function () { stopActive(); };
      rec.onend = function () { if (activeBtn === btn) stopActive(); };

      activeRec = rec;
      activeBtn = btn;
      btn.classList.add('voice-btn--active');
      rec.start();
    });
  }

  function injectStyles() {
    if (document.getElementById('voice-styles')) return;
    const style = document.createElement('style');
    style.id = 'voice-styles';
    style.textContent = `
.voice-wrap {
  display: inline-flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
.voice-wrap > input,
.voice-wrap > textarea {
  flex: 1;
  min-width: 0;
  width: auto !important;
}
.voice-btn {
  flex-shrink: 0;
  margin-left: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  padding: 0;
  line-height: 1;
}
.voice-btn:hover {
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.70);
  border-color: rgba(255,255,255,0.18);
}
.voice-btn--active {
  background: rgba(220, 60, 60, 0.20);
  color: #E05555;
  border-color: rgba(220, 60, 60, 0.40);
  animation: voice-pulse 1.1s ease-in-out infinite;
}
@keyframes voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220,60,60,0.45); }
  50%       { box-shadow: 0 0 0 5px rgba(220,60,60,0); }
}`;
    document.head.appendChild(style);
  }

  function scan() {
    document.querySelectorAll(
      'input[type="text"], input[type="number"], input[type="search"], input:not([type]), textarea'
    ).forEach(attachMic);
  }

  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // Pick up dynamically added inputs (gym sets, finance rows, etc.)
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();

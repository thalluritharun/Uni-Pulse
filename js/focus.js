(function (root) {
  'use strict';
  const MODES = { focus: { name: 'Focus', minutes: 25 }, short: { name: 'Short break', minutes: 5 }, long: { name: 'Long break', minutes: 15 } };
  const day = timestamp => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const fresh = (mode = 'focus', minutes = MODES[mode].minutes, task = '') => ({ mode, minutes, task, remaining: minutes * 60000, deadline: null, started: false, complete: false });
  const clock = ms => {
    const seconds = Math.ceil(Math.max(0, ms) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  function create({ getUser, save, openModal, toast, esc, icon }) {
    let owner = null, state = null, ticker = null, audio = null;
    const $ = selector => document.querySelector(selector);
    function stopTick() { clearInterval(ticker); ticker = null; }
    function ensureUser() {
      const user = getUser();
      if (!user) { stopTick(); owner = null; state = null; return false; }
      if (owner === user && state) return true;
      stopTick(); owner = user;
      const stored = user.focusWorkspace;
      const session = stored?.session;
      const valid = session && MODES[session.mode] && Number.isInteger(session.minutes) && session.minutes >= 1 && session.minutes <= 120;
      state = {
        sound: stored?.sound === true,
        history: Array.isArray(stored?.history) ? stored.history.filter(h => MODES[h.mode] && Number.isFinite(h.completedAt) && Number.isFinite(h.minutes) && h.minutes > 0).slice(-100) : [],
        session: valid ? { ...fresh(session.mode, session.minutes, String(session.task || '').slice(0, 120)), remaining: Math.max(0, Math.min(session.minutes * 60000, Number(session.remaining) || 0)), deadline: Number.isFinite(session.deadline) ? session.deadline : null, started: !!session.started, complete: !!session.complete } : fresh()
      };
      if (state.session.complete) { state.session.deadline = null; state.session.remaining = 0; }
      owner.focusWorkspace = state;
      if (state.session.deadline !== null) startTick();
      return true;
    }
    function persist() { if (owner && state) { owner.focusWorkspace = state; save(); } }
    function startTick() { stopTick(); ticker = setInterval(update, 500); }
    function prepareAudio() {
      if (!state.sound) return;
      try {
        const Audio = root.AudioContext || root.webkitAudioContext;
        if (!Audio) return;
        audio ||= new Audio();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
      } catch { /* Sound is optional; timing must work without audio support. */ }
    }
    function chime() {
      if (!state.sound || !audio || audio.state !== 'running') return;
      try {
        [523.25, 659.25, 783.99].forEach((frequency, i) => {
          const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + i * .16;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(.07, at + .02);
          gain.gain.exponentialRampToValueAtTime(.001, at + .35);
          oscillator.connect(gain); gain.connect(audio.destination);
          oscillator.start(at); oscillator.stop(at + .36);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
      } catch { /* Completion stays visible when sound is unavailable. */ }
    }
    function finish() {
      const s = state.session;
      const completedAt = s.deadline;
      s.deadline = null; s.remaining = 0; s.complete = true; s.started = true;
      state.history.push({ mode: s.mode, minutes: s.minutes, task: s.task, completedAt });
      state.history = state.history.slice(-100);
      stopTick(); persist(); chime();
      toast(s.mode === 'focus' ? 'Focus complete! Take a break, then choose your next step.' : 'Break complete. Ready for another focused session?');
      renderHistory();
    }
    function update() {
      if (!ensureUser()) return;
      const s = state.session;
      if (s.deadline !== null) {
        s.remaining = Math.max(0, s.deadline - Date.now());
        if (s.remaining === 0) finish();
      }
      const running = s.deadline !== null, busy = s.started && !s.complete;
      const display = clock(s.remaining);
      const status = s.complete ? `${MODES[s.mode].name} complete. Choose what comes next.` : running ? (s.mode === 'focus' ? 'One task. A little space to make progress.' : 'Step away, stretch, and take a breath.') : s.started ? 'Paused. Continue when you are ready.' : 'Set an intention, then make a little room for it.';
      if ($('#focusx-clock')) $('#focusx-clock').textContent = display;
      if ($('#focusx-status') && $('#focusx-status').textContent !== status) $('#focusx-status').textContent = status;
      if ($('#focusx-ring')) {
        $('#focusx-ring').style.setProperty('--focus-angle', `${Math.min(360, Math.max(0, 360 * (1 - s.remaining / (s.minutes * 60000))))}deg`);
        $('#focusx-ring').classList.toggle('is-running', running);
      }
      if ($('#focusx-toggle')) { $('#focusx-toggle').textContent = s.complete ? 'Session complete' : running ? 'Pause session' : s.started ? 'Resume session' : 'Start session'; $('#focusx-toggle').disabled = s.complete; }
      if ($('#focusx-reset')) $('#focusx-reset').disabled = !s.started;
      if ($('#focusx-next')) { $('#focusx-next').hidden = !s.complete; $('#focusx-next').textContent = s.mode === 'focus' ? 'Set up a break' : 'Set up next focus'; }
      document.querySelectorAll('[data-focusx-mode]').forEach(button => { button.disabled = busy; button.setAttribute('aria-pressed', String(button.dataset.focusxMode === s.mode)); });
      document.querySelectorAll('[data-focusx-setting]').forEach(input => { input.disabled = busy; });
      document.querySelectorAll('[data-focus-label]').forEach(el => { el.textContent = s.complete ? 'Done!' : s.started ? display : 'Focus'; });
      document.querySelectorAll('[data-focus-action]').forEach(el => { el.textContent = s.complete ? 'Your focus session' : s.started ? 'Return to focus' : 'Start focus session'; });
      document.querySelectorAll('.focus-trigger').forEach(el => el.classList.toggle('is-running', running));
    }
    function statsMarkup() {
      const today = day(Date.now()), weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
      const focused = state.history.filter(h => h.mode === 'focus');
      const todaySessions = focused.filter(h => day(h.completedAt) === today);
      const weeklyMinutes = focused.filter(h => h.completedAt >= weekStart.getTime()).reduce((sum, h) => sum + h.minutes, 0);
      return `<div class="focusx-stats"><div><strong>${todaySessions.length}</strong><span>sessions today</span></div><div><strong>${todaySessions.reduce((sum, h) => sum + h.minutes, 0)}<small> min</small></strong><span>focused today</span></div><div><strong>${weeklyMinutes}<small> min</small></strong><span>last 7 days</span></div></div>`;
    }
    function historyMarkup() {
      const recent = state.history.slice(-5).reverse();
      return `<div class="focusx-history-head"><h3>Your recent rhythm</h3><span class="muted small">Last 5 sessions</span></div>${recent.length ? `<ol class="focusx-history">${recent.map(h => `<li><span class="focusx-history-icon">${icon(h.mode === 'focus' ? 'check' : 'sun')}</span><div><strong>${esc(h.task || MODES[h.mode].name)}</strong><small>${esc(MODES[h.mode].name)} · ${esc(new Date(h.completedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</small></div><b>${h.minutes}m</b></li>`).join('')}</ol>` : '<p class="focusx-history-empty">Your completed focus sessions and breaks will appear here. Start with one small task.</p>'}`;
    }
    function renderHistory() {
      if ($('#focusx-stats')) $('#focusx-stats').innerHTML = statsMarkup();
      if ($('#focusx-history')) $('#focusx-history').innerHTML = historyMarkup();
    }
    function markup() {
      const s = state.session;
      return `<section class="focusx"><p class="muted focusx-intro">Find your rhythm. Focus, recharge, repeat.</p><div class="focusx-modes" role="group" aria-label="Timer mode">${Object.entries(MODES).map(([key, value]) => `<button type="button" data-action="focusx-mode" data-focusx-mode="${key}" aria-pressed="${s.mode === key}">${esc(value.name)}<small>${value.minutes} min</small></button>`).join('')}</div><div class="focusx-ring" id="focusx-ring"><div><span class="eyebrow">${esc(MODES[s.mode].name)}</span><strong id="focusx-clock" role="timer" aria-label="Time remaining" aria-live="off">${clock(s.remaining)}</strong><span class="focusx-ring-caption">a little time for you</span></div></div><p id="focusx-status" class="focusx-status" role="status"></p><div class="focusx-controls"><button type="button" class="btn" id="focusx-toggle" data-action="focusx-toggle">Start session</button><button type="button" class="btn secondary" id="focusx-reset" data-action="focusx-reset">Reset</button><button type="button" class="btn soft" id="focusx-next" data-action="focusx-next" hidden>Set up a break</button></div><form id="focusx-settings" class="focusx-settings"><label class="focusx-task">Your intention<input name="task" data-focusx-setting maxlength="120" value="${esc(s.task)}" placeholder="e.g. Read one topic in AI interaction design"></label><div class="focusx-options"><label>Duration (minutes)<input name="minutes" data-focusx-setting type="number" min="1" max="120" step="1" value="${s.minutes}" required></label><button type="submit" class="btn secondary" data-focusx-setting>Apply</button><label class="focusx-sound"><input type="checkbox" data-action="focusx-sound" ${state.sound ? 'checked' : ''}>Completion sound</label></div><p class="small muted">Choose 1–120 minutes. Pause or reset from any page. Reset clears only the current session.</p></form><div id="focusx-stats">${statsMarkup()}</div><section id="focusx-history">${historyMarkup()}</section><p class="focusx-footnote">Timer and the latest 100 sessions are saved to this local profile. The timer continues across refreshes; sound needs this tab open. Sessions do not mark lessons complete.</p></section>`;
    }
    function open() { if (!ensureUser()) return; update(); openModal('Your focus studio', markup()); update(); }
    function redraw() {
      const section = $('.focusx');
      if (section) { section.outerHTML = markup(); update(); }
    }
    function reset() {
      if (!ensureUser()) return;
      const s = state.session;
      stopTick(); state.session = fresh(s.mode, s.minutes, s.task); persist(); redraw(); update();
    }
    function applySettings(form, announce) {
      const s = state.session;
      if (s.started && !s.complete) return false;
      if (!form.reportValidity()) return false;
      const minutes = Number(form.elements.minutes.value), task = form.elements.task.value.trim().slice(0, 120);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) return false;
      state.session = fresh(s.mode, minutes, task); persist(); update();
      if (announce) toast('Focus settings saved. Start when you are ready.');
      return true;
    }
    function onClick(event) {
      const button = event.target.closest('[data-action^="focusx-"]');
      if (!button || button.disabled || !ensureUser() || button.dataset.action === 'focusx-sound') return;
      event.preventDefault(); update();
      const s = state.session, action = button.dataset.action;
      if (action === 'focusx-toggle') {
        if (s.complete) return;
        if (s.deadline !== null) { s.deadline = null; stopTick(); }
        else {
          const form = $('#focusx-settings');
          if (!s.started && form && !applySettings(form, false)) return;
          state.session.started = true; state.session.deadline = Date.now() + state.session.remaining;
          prepareAudio(); startTick();
        }
        persist(); update();
      } else if (action === 'focusx-reset') reset();
      else if (action === 'focusx-mode' || action === 'focusx-next') {
        if (s.started && !s.complete) return;
        const count = state.history.filter(h => h.mode === 'focus').length;
        const mode = action === 'focusx-mode' ? button.dataset.focusxMode : s.mode === 'focus' ? (count > 0 && count % 4 === 0 ? 'long' : 'short') : 'focus';
        if (!MODES[mode]) return;
        state.session = fresh(mode, MODES[mode].minutes, s.task); persist(); redraw(); update();
        document.querySelector(`[data-focusx-mode="${mode}"]`)?.focus();
      }
    }
    document.addEventListener('click', onClick);
    document.addEventListener('submit', event => {
      if (event.target.getAttribute('id') !== 'focusx-settings') return;
      event.preventDefault(); if (ensureUser()) applySettings(event.target, true);
    });
    document.addEventListener('change', event => {
      if (event.target.dataset.action !== 'focusx-sound' || !ensureUser()) return;
      state.sound = event.target.checked; persist(); prepareAudio();
    });
    // Logout stops this tab's updates. The user's absolute deadline remains saved
    // so signing back in resumes the same session, including completion while away.
    function dispose() {
      stopTick(); owner = null; state = null;
      if (audio) { audio.close().catch(() => {}); audio = null; }
    }
    return { open, update, reset, dispose };
  }
  root.UniPulseFocus = { create };
})(typeof window !== 'undefined' ? window : globalThis);

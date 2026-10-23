/* Run with node tests/focus.test.cjs. No browser packages required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/focus.js'), 'utf8');
function harness(initialUser = { id: 'student-1' }) {
  let user = initialUser, now = new Date('2026-10-23T10:00:00').getTime(), saved = null, interval = null, notifications = [];
  const listeners = {}, elements = {};
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const context = vm.createContext({ Date: Clock, document: { querySelector: key => elements[key] || null, querySelectorAll: () => [], addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); } }, setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; } });
  context.window = context; vm.runInContext(source, context);
  const api = context.UniPulseFocus.create({ getUser: () => user, save: () => { saved = JSON.parse(JSON.stringify(user)); }, openModal: () => {}, toast: text => notifications.push(text), esc: String, icon: () => '' });
  const click = (action, mode) => listeners.click.forEach(fn => fn({ preventDefault() {}, target: { closest: () => ({ dataset: { action: `focusx-${action}`, focusxMode: mode } }) } }));
  return { api, click, advance(ms) { now += ms; }, tick() { interval?.(); }, setUser(value) { user = value; }, get user() { return user; }, get saved() { return saved; }, get notifications() { return notifications; }, get ticking() { return !!interval; }, settings(minutes, task = '') { const form = { getAttribute: () => 'focusx-settings', reportValidity: () => true, elements: { minutes: { value: String(minutes) }, task: { value: task } } }; listeners.submit.forEach(fn => fn({ target: form, preventDefault() {} })); } };
}
let count = 0;
function test(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
test('timer uses elapsed wall time and records each expiry only once', () => {
  const h = harness(); h.api.update(); h.click('toggle');
  h.advance(26 * 60000); h.tick(); h.api.update(); h.api.update();
  assert.equal(h.user.focusWorkspace.history.length, 1);
  assert.equal(h.user.focusWorkspace.history[0].minutes, 25);
  assert.equal(h.user.focusWorkspace.session.complete, true);
  assert.equal(h.ticking, false); assert.equal(h.notifications.length, 1);
  assert.equal(h.user.progress, undefined);
});
test('pause freezes remaining time and resume keeps the same session', () => {
  const h = harness(); h.api.update(); h.click('toggle'); h.advance(60000); h.click('toggle');
  assert.equal(h.user.focusWorkspace.session.remaining, 24 * 60000);
  h.advance(10 * 60000); h.api.update(); assert.equal(h.user.focusWorkspace.session.remaining, 24 * 60000);
  h.click('toggle'); h.advance(24 * 60000); h.tick();
  assert.equal(h.user.focusWorkspace.history.length, 1);
});
test('refresh recovers saved absolute deadline including completion while away', () => {
  const h = harness(); h.api.update(); h.click('toggle');
  const next = harness(h.saved); next.advance(30 * 60000); next.api.update();
  assert.equal(next.user.focusWorkspace.session.complete, true);
  assert.equal(next.user.focusWorkspace.history.length, 1);
  const again = harness(next.saved); again.api.update();
  assert.equal(again.user.focusWorkspace.history.length, 1); assert.equal(again.notifications.length, 0);
});
test('custom duration validates limits and preserves intention in history', () => {
  const h = harness(); h.api.update(); h.settings(0); h.settings(121); h.settings(1.5);
  assert.equal(h.user.focusWorkspace.session.minutes, 25);
  h.settings(7, 'Read AI interaction design'); h.click('toggle'); h.advance(7 * 60000); h.tick();
  assert.equal(h.user.focusWorkspace.history[0].minutes, 7);
  assert.equal(h.user.focusWorkspace.history[0].task, 'Read AI interaction design');
});
test('mode cannot discard an active session and reset retains completed history', () => {
  const h = harness(); h.api.update(); h.click('toggle'); h.click('mode', 'long');
  assert.equal(h.user.focusWorkspace.session.mode, 'focus');
  h.advance(25 * 60000); h.tick(); h.click('next');
  assert.equal(h.user.focusWorkspace.session.mode, 'short');
  assert.equal(h.user.focusWorkspace.session.started, false);
  h.click('toggle'); h.api.reset();
  assert.equal(h.user.focusWorkspace.session.remaining, 5 * 60000);
  assert.equal(h.user.focusWorkspace.history.length, 1);
});
test('logout releases ticker while preserving deadline and another profile stays isolated', () => {
  const h = harness(); h.api.update(); h.click('toggle');
  const first = h.user, deadline = first.focusWorkspace.session.deadline;
  h.api.dispose(); assert.equal(h.ticking, false); assert.equal(first.focusWorkspace.session.deadline, deadline);
  h.setUser({ id: 'student-2' }); h.api.update();
  assert.equal(h.user.focusWorkspace.session.started, false); assert.equal(h.user.focusWorkspace.history.length, 0);
  h.setUser(first); h.advance(25 * 60000); h.api.update();
  assert.equal(first.focusWorkspace.history.length, 1);
});
console.log(`${count} focus checks passed.`);

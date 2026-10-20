import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../assets/js/contact.js', import.meta.url), 'utf8');
function setup(fetchImpl, endpoint = 'https://formspree.io/f/testform') {
  const fields = Object.fromEntries(['name', 'email', 'message'].map((name) => [name, {
    value: name === 'email' ? 'recruiter@example.com' : 'Hello',
    error: '', setCustomValidity(value) { this.error = value; }, addEventListener() {},
  }]));
  const button = { disabled: false, textContent: 'Send Message' };
  const status = { textContent: '', dataset: {} };
  let submit;
  let resets = 0;
  let requests = 0;
  const form = {
    elements: { namedItem: (name) => fields[name] },
    querySelector: () => button,
    addEventListener: (_, handler) => { submit = handler; },
    reportValidity: () => Object.values(fields).every((field) => !field.error) && /.+@.+\..+/.test(fields.email.value),
    setAttribute() {}, removeAttribute() {},
    reset() { resets++; Object.values(fields).forEach((field) => { field.value = ''; }); },
  };
  vm.runInNewContext(source, {
    document: { getElementById: (id) => id === 'contact-form' ? form : status },
    window: { PORTFOLIO_CONFIG: { formspreeEndpoint: endpoint }, setTimeout, clearTimeout },
    fetch: async (...args) => { requests++; return fetchImpl(...args); },
    FormData: class { constructor() { this.values = Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, field.value])); } },
    AbortController,
  });
  return { fields, button, status, submit: () => submit({ preventDefault() {} }), get resets() { return resets; }, get requests() { return requests; } };
}

test('success posts JSON-accepting FormData and clears only after confirmation', async () => {
  const state = setup(async (url, options) => {
    assert.equal(url, 'https://formspree.io/f/testform');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.body.values.email, 'recruiter@example.com');
    return { ok: true };
  });
  await state.submit();
  assert.equal(state.resets, 1);
  assert.equal(state.status.textContent, 'Your message has been sent successfully!');
  assert.equal(state.button.disabled, false);
});

test('loading disables the button and prevents duplicate requests', async () => {
  let finish;
  const state = setup(() => new Promise((resolve) => { finish = resolve; }));
  const pending = state.submit();
  assert.equal(state.button.textContent, 'Sending...');
  assert.equal(state.button.disabled, true);
  await state.submit();
  assert.equal(state.requests, 1);
  finish({ ok: true });
  await pending;
});

for (const [label, fetchImpl] of [
  ['server rejection', async () => ({ ok: false, status: 422 })],
  ['rate limit', async () => ({ ok: false, status: 429 })],
  ['network failure', async () => { throw new Error('offline'); }],
  ['timeout', async () => { throw Object.assign(new Error(), { name: 'AbortError' }); }],
]) {
  test(`${label} preserves message and restores button`, async () => {
    const state = setup(fetchImpl);
    await state.submit();
    assert.equal(state.resets, 0);
    assert.equal(state.fields.message.value, 'Hello');
    assert.equal(state.status.dataset.state, 'error');
    assert.equal(state.button.disabled, false);
    assert.equal(state.button.textContent, 'Send Message');
  });
}

test('missing configuration does not submit or clear fields', async () => {
  const state = setup(async () => ({ ok: true }), '');
  await state.submit();
  assert.equal(state.requests, 0);
  assert.equal(state.resets, 0);
  assert.equal(state.status.dataset.state, 'error');
});

test('blank fields and malformed email do not submit', async () => {
  const state = setup(async () => ({ ok: true }));
  state.fields.name.value = '   ';
  await state.submit();
  state.fields.name.value = 'Recruiter';
  state.fields.email.value = 'invalid';
  await state.submit();
  assert.equal(state.requests, 0);
});

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../assets/js/project-story.js', import.meta.url), 'utf8');
const state = runInNewContext(`${source}; getProjectStoryState;`, { document: { querySelector: () => null } });

test('three steps hold at their stops and clamp at the track ends', () => {
  for (const p of [-1, 0, .1, .15]) assert.equal(state(p).step, 0);
  for (const p of [.4, .49, .58]) assert.equal(state(p).step, 1);
  for (const p of [.83, .9, 1, 2]) assert.equal(state(p).step, 2);
});

test('transitions use easeInOutCubic rather than a timer', () => {
  assert.ok(Math.abs(state(.2125).step - .0625) < 1e-10);
  assert.ok(Math.abs(state(.275).step - .5) < 1e-10);
  assert.ok(Math.abs(state(.3375).step - .9375) < 1e-10);
  assert.ok(Math.abs(state(.705).step - 1.5) < 1e-10);
});

test('progress is monotonic forward and fully reversible on scroll up', () => {
  const forward = Array.from({ length: 101 }, (_, i) => state(i / 100).step);
  forward.slice(1).forEach((value, i) => assert.ok(value >= forward[i]));
  const backward = Array.from({ length: 101 }, (_, i) => state((100 - i) / 100).step);
  assert.deepEqual(backward, [...forward].reverse());
});

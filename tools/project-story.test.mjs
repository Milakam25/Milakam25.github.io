import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../assets/js/project-story.js', import.meta.url), 'utf8');
const state = runInNewContext(`${source}; getProjectStoryState;`, { document: { querySelector: () => null } });

test('four projects hold at their stops and clamp at the track ends', () => {
  for (const p of [-1, 0, .05, .1]) assert.equal(state(p).step, 0);
  for (const p of [.3, .32, .36]) assert.equal(state(p).step, 1);
  for (const p of [.57, .6, .63]) assert.equal(state(p).step, 2);
  for (const p of [.84, .95, 1, 2]) assert.equal(state(p).step, 3);
});

test('transitions use easeInOutCubic rather than a timer', () => {
  assert.ok(Math.abs(state(.1 + .8 / 3 * .7 * .25).step - .0625) < 1e-10);
  assert.ok(Math.abs(state(.1 + .8 / 3 * .7 * .5).step - .5) < 1e-10);
  assert.ok(Math.abs(state(.1 + .8 / 3 * .7 * .75).step - .9375) < 1e-10);
  assert.ok(Math.abs(state(.46).step - 1.5) < 1e-10);
});

test('timeline adapts to the actual number of project cards', () => {
  for (const count of [1, 2, 3, 4, 5]) {
    assert.equal(state(0, count).active, 0);
    assert.equal(state(1, count).active, count - 1);
  }
});

test('progress is monotonic forward and fully reversible on scroll up', () => {
  const forward = Array.from({ length: 101 }, (_, i) => state(i / 100).step);
  forward.slice(1).forEach((value, i) => assert.ok(value >= forward[i]));
  const backward = Array.from({ length: 101 }, (_, i) => state((100 - i) / 100).step);
  assert.deepEqual(backward, [...forward].reverse());
});

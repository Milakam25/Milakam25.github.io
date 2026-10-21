import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const code = readFileSync(new URL('../assets/js/skills-coverflow.js', import.meta.url), 'utf8');
const api = runInNewContext(`${code}; ({ spring: skillsSpringResponse, pose: skillsCoverFlowPose, flick: skillsFlickTarget, velocity: skillsSpringVelocityResponse, config: SKILLS_COVERFLOW });`, { document: { querySelector: () => null } });

test('reference spring begins at zero, overshoots slightly, and settles', () => {
  assert.equal(api.spring(0), 0);
  assert.ok(api.spring(.36) > 1);
  assert.ok(Math.abs(api.spring(1.6) - 1) < 1e-6);
});
test('desktop pose matches reference units, rotations, depth, opacity, and ordering', () => {
  const center = api.pose(2, 2, 960);
  const right = api.pose(3, 2, 960);
  const left = api.pose(1, 2, 960);
  assert.equal(center.x, 0);
  assert.equal(center.rotation, 0);
  assert.equal(right.x, 270);
  assert.equal(right.z, -240);
  assert.equal(right.rotation, 60);
  assert.equal(left.rotation, -60);
  assert.equal(left.x, -270);
  assert.equal(right.opacity, .7);
  assert.ok(center.order > right.order);
});
test('opacity is bounded and mobile rotation is reduced', () => {
  assert.equal(api.pose(6, 0, 390).opacity, .4);
  assert.equal(api.pose(1, 0, 390, true).rotation, 35);
});
test('adding a spring term midway preserves current position', () => {
  const before = api.spring(.14);
  const after = api.spring(.14) + api.spring(0);
  assert.equal(before, after);
});

test('a flick can advance several cards, stays bounded, and has no momentum in reduced mode', () => {
  assert.equal(api.flick(1, -1.6, 7), 5);
  assert.equal(api.flick(5, -5, 7), 6);
  assert.equal(api.flick(1, 5, 7), 0);
  assert.equal(api.flick(2.4, -5, 7, true), 2);
  assert.equal(api.config.dragPixelsPerCard, 80);
});

test('release velocity response preserves initial position and velocity', () => {
  assert.equal(api.velocity(0), 0);
  assert.ok(Math.abs(api.velocity(.000001) / .000001 - 1) < .001);
  assert.ok(Math.abs(api.velocity(1.6)) < 1e-6);
});

test('body and heading text exceed 4.5:1 contrast on all seven selected pastels', () => {
  const luminance = (hex) => {
    const rgb = hex.match(/[a-f0-9]{2}/gi).map((part) => parseInt(part, 16) / 255)
      .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const color of api.config.colors) {
    for (const text of ['#172b2b', '#245f4e']) {
      const contrast = (luminance(color) + .05) / (luminance(text) + .05);
      assert.ok(contrast >= 4.5, `${text} on ${color}: ${contrast}`);
    }
  }
});

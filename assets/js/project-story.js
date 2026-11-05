function getProjectStoryState(progress, count = 4) {
  const p = Math.max(0, Math.min(1, progress));
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // Holds alternate with scroll-distance-based transitions, never a timer.
  const last = Math.max(0, count - 1);
  const scaled = Math.max(0, Math.min(last, (p - .1) / .8 * last));
  const index = Math.floor(scaled);
  const step = Math.min(last, index + ease(Math.min(1, (scaled - index) / .7)));
  return { progress: p, step, active: Math.round(step) };
}

(() => {
  const track = document.querySelector('.project-story');
  if (!track) return;
  const stage = track.querySelector('.story-stage');
  const card = track.querySelector('.story-card');
  card.addEventListener('pointerdown', () => card.classList.add('is-lit'));
  card.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') card.classList.remove('is-lit');
  });
  document.addEventListener('pointerdown', (event) => {
    if (!card.contains(event.target)) card.classList.remove('is-lit');
  }, { passive: true });
  const steps = [...track.querySelectorAll('.story-step')];
  const panels = [...track.querySelectorAll('.story-panel')];
  const count = steps.length;
  const dots = [...track.querySelectorAll('[data-go]')];
  const progressbar = track.querySelector('.story-track-progress');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let active = -1;
  let top = 0;
  let distance = 1;

  const measure = () => {
    top = track.getBoundingClientRect().top + window.scrollY;
    distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
  };
  const update = () => {
    frame = 0;
    const state = getProjectStoryState((window.scrollY - top) / distance, count);
    if (reduced.matches) state.step = state.active;
    track.dataset.storyStep = String(state.active);
    steps.forEach((element, i) => {
      const weight = 1 - Math.min(1, Math.abs(i - state.step));
      element.style.opacity = String(.28 + .72 * weight);
      element.style.transform = reduced.matches ? 'none' : `translateY(${(i - state.step) * 8}px)`;
    });
    progressbar.querySelector('span').style.transform = `scaleX(${state.progress})`;
    progressbar.setAttribute('aria-valuenow', String(Math.round(state.progress * 100)));
    if (active !== state.active) {
      active = state.active;
      track.dataset.project = panels[active].dataset.project;
      panels.forEach((panel, i) => { panel.hidden = i !== active; });
      dots.forEach((dot, i) => {
        if (i === active) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      track.querySelector('.story-count').textContent = `${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    }
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  const configure = () => {
    track.classList.add('story-enhanced');
    track.style.setProperty('--story-track-height', `${(count + 1) * 100}svh`);
    active = -1;
    measure();
    queue();
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    measure();
    const stop = i === 0 ? .05 : i === count - 1 ? .95 : .1 + .8 * i / (count - 1);
    window.scrollTo({ top: top + distance * stop, behavior: reduced.matches ? 'auto' : 'smooth' });
  }));
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { measure(); queue(); }, { passive: true });
  window.addEventListener('load', () => { measure(); queue(); }, { once: true });
  reduced.addEventListener('change', configure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
  configure();
})();

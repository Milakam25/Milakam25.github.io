function getProjectStoryState(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // Holds alternate with scroll-distance-based transitions, never a timer.
  let step = 0;
  if (p >= .83) step = 2;
  else if (p >= .58) step = 1 + ease((p - .58) / .25);
  else if (p >= .4) step = 1;
  else if (p > .15) step = ease((p - .15) / .25);
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
    const state = getProjectStoryState((window.scrollY - top) / distance);
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
      panels.forEach((panel, i) => { panel.hidden = i !== active; });
      dots.forEach((dot, i) => {
        if (i === active) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      track.querySelector('.story-count').textContent = `0${active + 1} / 03`;
    }
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  const configure = () => {
    track.classList.add('story-enhanced');
    active = -1;
    measure();
    queue();
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    measure();
    window.scrollTo({ top: top + distance * [.08, .49, .92][i], behavior: reduced.matches ? 'auto' : 'smooth' });
  }));
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { measure(); queue(); }, { passive: true });
  window.addEventListener('load', () => { measure(); queue(); }, { once: true });
  reduced.addEventListener('change', configure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
  configure();
})();

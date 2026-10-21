const SKILLS_COVERFLOW = {
  dragPixelsPerCard: 80,
  dragThreshold: 6,
  momentumMs: 180,
  maxFlickCards: 4,
  maxTiltDegrees: 8,
  colors: ['#FFD6E0', '#CDE7FF', '#CFF5E3', '#E3D9FF', '#FFF1BF', '#FFDDC7', '#D3F3F5'],
};

function skillsSpringResponse(t) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(200);
  const z = 22 / (2 * w0);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t));
}

function skillsSpringVelocityResponse(t) {
  const wd = Math.sqrt(200 - 121);
  return t <= 0 ? 0 : Math.exp(-11 * t) * Math.sin(wd * t) / wd;
}

function skillsFlickTarget(value, velocity, count, reduced = false) {
  const travel = reduced ? 0 : Math.max(-SKILLS_COVERFLOW.maxFlickCards, Math.min(SKILLS_COVERFLOW.maxFlickCards,
    -velocity * SKILLS_COVERFLOW.momentumMs / SKILLS_COVERFLOW.dragPixelsPerCard));
  return Math.max(0, Math.min(count - 1, Math.round(value + travel)));
}

function skillsCoverFlowPose(index, selected, width, mobile = false) {
  const d = index - selected;
  const dc = Math.max(-1, Math.min(1, d));
  const u = width / 320;
  return {
    x: (d * 70 + Math.sign(d) * 20 * Math.min(1, Math.abs(d))) * u,
    z: -Math.abs(dc) * 80 * u,
    rotation: dc * (mobile ? 35 : 60),
    opacity: 1 - Math.min(.6, Math.abs(d) * .3),
    order: 100 - Math.round(Math.abs(d) * 10),
  };
}

(() => {
  const grid = document.querySelector('#skills .skills-grid');
  if (!grid || grid.closest('.skills-coverflow')) return;
  const cards = [...grid.querySelectorAll('.sk-card')];
  if (!cards.length) return;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const root = document.createElement('div');
  root.className = 'skills-coverflow';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Technical skill categories');
  const menu = document.createElement('nav');
  menu.className = 'flow-menu';
  menu.setAttribute('aria-label', 'Skill categories');
  const body = document.createElement('div');
  body.className = 'flow-body';
  const viewport = document.createElement('div');
  viewport.className = 'flow-viewport';
  grid.before(root);
  root.append(menu, body);
  body.append(viewport);
  viewport.append(grid);
  grid.classList.remove('rv', 'd2');

  const jumps = cards.map((card, i) => {
    const title = card.querySelector('.sk-lbl').textContent;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = title;
    menu.append(button);
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', title + ', ' + (i + 1) + ' of ' + cards.length);
    card.style.setProperty('--card-color', SKILLS_COVERFLOW.colors[i]);
    const number = document.createElement('span');
    number.className = 'flow-card-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
    card.prepend(number);
    return button;
  });
  const controls = document.createElement('div');
  controls.className = 'flow-controls';
  const previous = document.createElement('button');
  const next = document.createElement('button');
  const counter = document.createElement('span');
  previous.type = next.type = 'button';
  previous.textContent = '\u2190';
  next.textContent = '\u2192';
  previous.setAttribute('aria-label', 'Previous skill category');
  next.setAttribute('aria-label', 'Next skill category');
  previous.title = 'Previous skill category';
  next.title = 'Next skill category';
  counter.className = 'flow-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');
  controls.append(previous, counter, next);
  body.append(controls);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let target = 0, base = 0, value = 0, active = -1, frame = 0;
  let terms = [], carry = null, drag = null;
  let width = 1, mobile = false, suppressClickUntil = 0;
  let pointer = null, tiltX = 0, tiltY = 0, lastTick = 0;
  let pendingPop = null, pop = null;
  let wheelTotal = 0, wheelTimer = 0, lastWheel = 0;

  const position = (now) => base
    + terms.reduce((sum, term) => sum + term.delta * skillsSpringResponse((now - term.start) / 1000), 0)
    + (carry ? carry.velocity * skillsSpringVelocityResponse((now - carry.start) / 1000) : 0);

  const syncActive = (index) => {
    if (index === active) return;
    active = index;
    cards.forEach((card, i) => {
      card.tabIndex = i === active ? 0 : -1;
      if (i === active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      if (i === active) jumps[i].setAttribute('aria-current', 'true');
      else jumps[i].removeAttribute('aria-current');
    });
    counter.textContent = (active + 1) + ' / ' + cards.length;
    if (window.innerWidth <= 900) {
      const button = jumps[active];
      menu.scrollTo({
        left: button.offsetLeft - menu.offsetLeft - (menu.clientWidth - button.offsetWidth) / 2,
        behavior: reduced.matches ? 'auto' : 'smooth',
      });
    }
  };

  const render = (selected, now = performance.now()) => {
    value = selected;
    syncActive(clamp(Math.round(selected), 0, cards.length - 1));
    if (pendingPop === active && !drag && !reduced.matches) {
      pop = { index: active, start: now };
      pendingPop = null;
    }
    let aimX = 0, aimY = 0;
    if (pointer && !reduced.matches) {
      const rect = cards[active].getBoundingClientRect();
      const x = clamp((pointer.x - rect.left) / rect.width * 2 - 1, -1, 1);
      const y = clamp((pointer.y - rect.top) / rect.height * 2 - 1, -1, 1);
      aimX = -y * SKILLS_COVERFLOW.maxTiltDegrees;
      aimY = x * SKILLS_COVERFLOW.maxTiltDegrees;
    }
    const smoothing = reduced.matches ? 1 : 1 - Math.exp(-Math.min(32, now - lastTick || 16) / 65);
    tiltX += (aimX - tiltX) * smoothing;
    tiltY += (aimY - tiltY) * smoothing;
    if (Math.abs(tiltX - aimX) < .02) tiltX = aimX;
    if (Math.abs(tiltY - aimY) < .02) tiltY = aimY;
    lastTick = now;
    cards.forEach((card, i) => {
      const pose = skillsCoverFlowPose(i, selected, width, mobile);
      const isActive = i === active;
      const phase = pop?.index === i && !reduced.matches ? clamp(skillsSpringResponse((now - pop.start) / 1500), 0, 1) : 0;
      const scale = 1 + .04 * 4 * phase * (1 - phase);
      const tx = isActive ? tiltX : 0;
      const ty = isActive ? tiltY : 0;
      card.style.transform = 'translate(-50%, -50%) translateX(' + pose.x + 'px) translateZ(' + (pose.z + (isActive ? 20 : 0))
        + 'px) rotateY(' + pose.rotation + 'deg) rotateX(' + tx + 'deg) rotateY(' + ty + 'deg) scale(' + scale + ')';
      card.style.setProperty('--shine-x', (ty * 4) + 'px');
      card.style.setProperty('--shine-y', (-tx * 4) + 'px');
      card.style.opacity = String(pose.opacity);
      card.style.zIndex = String(pose.order);
      const offscreen = Math.abs(i - selected) > 2.6 && i !== target && !card.contains(document.activeElement);
      card.style.visibility = offscreen ? 'hidden' : 'visible';
      card.inert = offscreen;
      card.setAttribute('aria-hidden', String(offscreen));
    });
    previous.disabled = target <= 0;
    next.disabled = target >= cards.length - 1;
  };

  const tick = (now) => {
    frame = 0;
    terms = terms.filter((term) => {
      if (now - term.start <= 1600) return true;
      base += term.delta;
      return false;
    });
    if (carry && now - carry.start > 1600) carry = null;
    const selected = drag?.moved ? drag.value : reduced.matches ? target : position(now);
    render(selected, now);
    if (pop && now - pop.start > 800) pop = null;
    const tiltMoving = Math.abs(tiltX - (pointer ? tiltX : 0)) > .02 || Math.abs(tiltY - (pointer ? tiltY : 0)) > .02;
    // Pointer movement schedules frames; keep a few extra frames for tilt settling.
    if (terms.length || carry || pop || tiltMoving || (pointer && now - pointer.time < 180)) queue();
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(tick); };

  const select = (index, focusCard = false) => {
    const destination = clamp(Math.round(index), 0, cards.length - 1);
    if (reduced.matches) {
      base = target = destination;
      terms = [];
      carry = pop = null;
      pendingPop = null;
      render(target);
    } else {
      if (destination !== target) terms.push({ delta: destination - target, start: performance.now() });
      target = destination;
      pendingPop = destination;
      queue();
    }
    if (focusCard) {
      cards[destination].inert = false;
      cards[destination].style.visibility = 'visible';
      cards[destination].setAttribute('aria-hidden', 'false');
      cards[destination].focus({ preventScroll: true });
    }
  };
  const measure = () => {
    width = viewport.getBoundingClientRect().width;
    mobile = window.innerWidth <= 640;
    viewport.style.setProperty('--flow-perspective', (360 * width / 320) + 'px');
    viewport.style.setProperty('--flow-card-width', (mobile ? width * .8 : Math.min(340, width * .46)) + 'px');
    queue();
  };

  jumps.forEach((button, i) => button.addEventListener('click', () => select(i)));
  cards.forEach((card, i) => card.addEventListener('click', () => {
    if (performance.now() < suppressClickUntil || window.getSelection()?.toString()) return;
    select(i);
  }));
  previous.addEventListener('click', () => select(target - 1));
  next.addEventListener('click', () => select(target + 1));
  root.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = { ArrowLeft: target - 1, ArrowRight: target + 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key], true);
  });

  const stopDrag = (event, canceled = false) => {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const completed = drag;
    drag = null;
    pointer = null;
    root.removeAttribute('data-dragging');
    if (completed.moved) {
      suppressClickUntil = performance.now() + 400;
      base = value = completed.value;
      terms = [];
      carry = null;
      target = base;
      const velocity = performance.now() - completed.lastTime < 100 ? completed.velocity : 0;
      if (!canceled && !reduced.matches) {
        carry = { velocity: clamp(-velocity * 1000 / SKILLS_COVERFLOW.dragPixelsPerCard, -22, 22), start: performance.now() };
      }
      select(skillsFlickTarget(base, canceled ? 0 : velocity, cards.length, reduced.matches));
    } else select(Math.round(value));
    queue();
  };
  viewport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || event.detail > 1) return;
    if (event.target.closest('a, button, input, textarea')) return;
    const now = performance.now();
    const current = reduced.matches ? target : position(now);
    cancelAnimationFrame(frame);
    frame = 0;
    base = value = current;
    terms = [];
    carry = pop = null;
    pendingPop = null;
    target = current;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: current, value: current,
      lastX: event.clientX, lastTime: now, velocity: 0, moved: false };
    pointer = { x: event.clientX, y: event.clientY, time: now };
    queue();
  }, { passive: true });
  viewport.addEventListener('pointermove', (event) => {
    const now = performance.now();
    if (drag && event.pointerId === drag.id) {
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SKILLS_COVERFLOW.dragThreshold) {
        stopDrag(event, true);
        return;
      }
      if (!drag.moved && Math.abs(dx) >= SKILLS_COVERFLOW.dragThreshold) {
        drag.moved = true;
        root.dataset.dragging = 'true';
        window.getSelection()?.removeAllRanges();
        try { viewport.setPointerCapture(event.pointerId); } catch {}
      }
      if (drag.moved) {
        if (event.cancelable) event.preventDefault();
        const dt = Math.max(1, now - drag.lastTime);
        drag.velocity = drag.velocity * .25 + ((event.clientX - drag.lastX) / dt) * .75;
        drag.value = clamp(drag.origin - dx / SKILLS_COVERFLOW.dragPixelsPerCard, -.18, cards.length - .82);
        if (reduced.matches) drag.value = Math.round(clamp(drag.value, 0, cards.length - 1));
        drag.lastX = event.clientX;
        drag.lastTime = now;
        pointer = { x: event.clientX, y: event.clientY, time: now };
        queue();
      }
    } else if (event.pointerType === 'mouse') {
      pointer = event.target.closest('.sk-card') === cards[active] ? { x: event.clientX, y: event.clientY, time: now } : null;
      queue();
    }
  });
  viewport.addEventListener('pointerup', (event) => stopDrag(event));
  viewport.addEventListener('pointercancel', (event) => stopDrag(event, true));
  viewport.addEventListener('lostpointercapture', (event) => stopDrag(event, true));
  viewport.addEventListener('pointerleave', () => { if (!drag) { pointer = null; queue(); } });
  window.addEventListener('blur', () => stopDrag(null, true));

  const flushWheel = () => {
    if (Math.abs(wheelTotal) >= 20) {
      const steps = Math.sign(wheelTotal) * Math.max(1, Math.round(Math.abs(wheelTotal) / SKILLS_COVERFLOW.dragPixelsPerCard));
      select(target + clamp(steps, -2, 2));
    }
    wheelTotal = 0;
    lastWheel = performance.now();
  };
  viewport.addEventListener('wheel', (event) => {
    const horizontal = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
    if (!horizontal || (!event.shiftKey && Math.abs(horizontal) < Math.abs(event.deltaY))) return;
    if (event.cancelable) event.preventDefault();
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
    wheelTotal = clamp(wheelTotal + horizontal * multiplier, -320, 320);
    clearTimeout(wheelTimer);
    if (Math.abs(wheelTotal) >= SKILLS_COVERFLOW.dragPixelsPerCard && performance.now() - lastWheel >= 100) flushWheel();
    else wheelTimer = setTimeout(flushWheel, 110);
  }, { passive: false });

  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    drag = carry = pointer = pop = null;
    root.removeAttribute('data-dragging');
    terms = [];
    pendingPop = null;
    target = clamp(Math.round(value), 0, cards.length - 1);
    base = value = target;
    tiltX = tiltY = 0;
    render(target);
  });
  new ResizeObserver(measure).observe(viewport);
  measure();
})();

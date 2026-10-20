// reveal on scroll
const rv = document.querySelectorAll('.rv');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('on');
  });
}, { threshold: 0.1 });
rv.forEach((el) => obs.observe(el));

const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:mila425250@gmail.com?subject=${subject}&body=${body}`;
  });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const wavePhotos = document.querySelectorAll('.hero-photo-bg, .about-img-bg, .place-photo, .pbg, .exp-bg');
  const placeCrossfade = document.querySelector('.place-crossfade');
  let waveFrame = 0;
  const updateWave = () => {
    const height = window.innerHeight;
    wavePhotos.forEach((photo) => {
      const rect = photo.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) return;
      const progress = (height - rect.top) / (height + rect.height);
      photo.style.setProperty('--wave-shift', `${Math.sin(progress * Math.PI * 2) * 24}px`);
    });
    if (placeCrossfade) {
      const rect = placeCrossfade.getBoundingClientRect();
      const raw = (height * 0.72 - rect.top) / Math.max(1, rect.height * 0.82);
      const fade = Math.min(1, Math.max(0, raw));
      placeCrossfade.style.setProperty('--place-fade', fade.toFixed(3));
    }
    waveFrame = 0;
  };
  const queueWave = () => {
    if (!waveFrame) waveFrame = requestAnimationFrame(updateWave);
  };
  window.addEventListener('scroll', queueWave, { passive: true });
  window.addEventListener('resize', queueWave);
  queueWave();
}

// experience drag scroll
const scr = document.getElementById('expScroll');
const prog = document.getElementById('dragProg');
const arrL = document.getElementById('arrL');
const arrR = document.getElementById('arrR');
const CARD_W = 360;

if (scr && prog && arrL && arrR) {
  const updateProg = () => {
    const max = scr.scrollWidth - scr.clientWidth;
    const pct = max > 0 ? (scr.scrollLeft / max) * 100 : 0;
    prog.style.width = `${pct}%`;
  };

  scr.addEventListener('scroll', updateProg);
  arrR.addEventListener('click', () => scr.scrollBy({ left: CARD_W, behavior: 'smooth' }));
  arrL.addEventListener('click', () => scr.scrollBy({ left: -CARD_W, behavior: 'smooth' }));

  let isDown = false;
  let startX = 0;
  let scrollStart = 0;

  scr.addEventListener('mousedown', (event) => {
    isDown = true;
    startX = event.pageX;
    scrollStart = scr.scrollLeft;
    scr.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (event) => {
    if (!isDown) return;
    scr.scrollLeft = scrollStart - (event.pageX - startX);
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
    scr.style.userSelect = '';
  });

  updateProg();
}

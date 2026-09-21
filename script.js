// reveal on scroll
const rv = document.querySelectorAll('.rv');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('on');
  });
}, { threshold: 0.1 });
rv.forEach((el) => obs.observe(el));

const profileInput = document.getElementById('profile-photo');
const profilePreview = document.getElementById('profile-preview');
const profileFeedback = document.getElementById('profile-feedback');
const profileKey = 'mila-portfolio-profile-photo';

if (profileInput && profilePreview && profileFeedback) {
  try {
    const savedPhoto = localStorage.getItem(profileKey);
    if (savedPhoto) {
      profilePreview.src = savedPhoto;
      profileFeedback.textContent = 'Change photo';
    }
  } catch (_) {
    // Local files can have storage disabled in some browsers.
  }

  profileInput.addEventListener('change', () => {
    const file = profileInput.files && profileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      profileFeedback.textContent = 'Please choose an image';
      return;
    }

    const photo = new Image();
    const photoUrl = URL.createObjectURL(file);
    photo.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(photoUrl);
        profileFeedback.textContent = 'Could not load photo';
        return;
      }
      const size = Math.min(photo.naturalWidth, photo.naturalHeight);
      context.drawImage(photo,
        (photo.naturalWidth - size) / 2, (photo.naturalHeight - size) / 2,
        size, size, 0, 0, 320, 320);
      const result = canvas.toDataURL('image/jpeg', 0.82);
      profilePreview.src = result;
      profileFeedback.textContent = 'Change photo';
      try { localStorage.setItem(profileKey, result); } catch (_) {}
      URL.revokeObjectURL(photoUrl);
    };
    photo.onerror = () => {
      URL.revokeObjectURL(photoUrl);
      profileFeedback.textContent = 'Could not load photo';
    };
    photo.src = photoUrl;
  });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const wavePhotos = document.querySelectorAll('.hero-photo-bg, .about-img-bg, .pbg, .exp-bg');
  const waveDividers = document.querySelectorAll('.shoreline-divider');
  let waveFrame = 0;
  const updateWave = () => {
    const height = window.innerHeight;
    wavePhotos.forEach((photo) => {
      const rect = photo.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) return;
      const progress = (height - rect.top) / (height + rect.height);
      photo.style.setProperty('--wave-shift', `${Math.sin(progress * Math.PI * 2) * 24}px`);
    });
    waveDividers.forEach((divider) => {
      const rect = divider.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) return;
      const progress = (height - rect.top) / (height + rect.height);
      const phase = progress * Math.PI * 2;
      divider.style.setProperty('--wave-x', `${Math.sin(phase) * 18}px`);
      divider.style.setProperty('--wave-x-reverse', `${Math.sin(phase) * -11}px`);
      divider.style.setProperty('--wave-top', `${Math.cos(phase) * 7}px`);
      divider.style.setProperty('--wave-bottom', `${Math.sin(phase) * 9}px`);
    });
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

// reveal on scroll
const rv = document.querySelectorAll('.rv');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('on');
  });
}, { threshold: 0.1 });
rv.forEach((el) => obs.observe(el));

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

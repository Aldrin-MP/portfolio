// ============ LOADER ============
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct = document.getElementById('loaderPct');

let pct = 0;
const loadTimer = setInterval(() => {
  pct = Math.min(pct + Math.random() * 14, 100);
  loaderFill.style.width = pct + '%';
  loaderPct.textContent = Math.floor(pct) + '%';
  if (pct >= 100) {
    clearInterval(loadTimer);
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('loaded');
      revealVisible();
    }, 400);
  }
}, 150);

// ============ CUSTOM CURSOR ============
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
const label = document.getElementById('cursorLabel');

let mx = -100, my = -100, rx = -100, ry = -100;

window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
});

(function cursorLoop() {
  rx += (mx - rx) * .14;
  ry += (my - ry) * .14;
  dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(cursorLoop);
})();

document.querySelectorAll('[data-cursor]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    label.textContent = el.dataset.cursor;
    ring.classList.add('has-label');
  });
  el.addEventListener('mouseleave', () => {
    ring.classList.remove('has-label');
  });
});

// ============ PARTICLE FIELD ============
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
const MOUSE_R = 160;

function sizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

for (let i = 0; i < 90; i++) {
  particles.push({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .3,
    r: Math.random() * 1.6 + .5,
    hue: Math.random() > .8 ? '255,61,46' : '242,237,228'
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    // gentle mouse repulsion
    const dx = p.x - mx, dy = p.y - my;
    const d = Math.hypot(dx, dy);
    if (d < MOUSE_R && d > 0.01) {
      const f = (MOUSE_R - d) / MOUSE_R;
      p.vx += (dx / d) * f * .35;
      p.vy += (dy / d) * f * .35;
    }
    p.vx *= .96; p.vy *= .96;
    p.x += p.vx; p.y += p.vy;

    if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.hue},${p.r > 1.4 ? .5 : .28})`;
    ctx.fill();
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ============ DRAGGABLE MARQUEE ============
const track = document.getElementById('marqueeTrack');
// duplicate content for seamless loop
track.innerHTML += track.innerHTML;

let mScroll = 0, mVel = 0, mDragging = false, mStartX = 0, mStartScroll = 0;

const marquee = document.getElementById('marquee');

marquee.addEventListener('pointerdown', e => {
  mDragging = true; mStartX = e.clientX; mStartScroll = mScroll;
  marquee.setPointerCapture(e.pointerId);
});
marquee.addEventListener('pointermove', e => {
  if (mDragging) mScroll = mStartScroll - (e.clientX - mStartX) * 1.2;
});
marquee.addEventListener('pointerup', () => { mDragging = false; });

(function marqueeLoop() {
  const half = track.scrollWidth / 2;
  if (!mDragging) mScroll -= 1.2;
  if (mScroll <= -half) mScroll += half;
  if (mScroll > 0) mScroll -= half;
  track.style.transform = `translateX(${mScroll}px)`;
  requestAnimationFrame(marqueeLoop);
})();

// ============ DRAGGABLE SKILL CHIPS ============
document.querySelectorAll('.skill').forEach(chip => {
  let offsetX = 0, offsetY = 0, dragging = false;
  let lastX = 0, lastY = 0, lastT = 0;
  let vx = 0, vy = 0, px = 0, py = 0, animating = null;

  chip.addEventListener('pointerdown', e => {
    dragging = true;
    chip.classList.add('dragging');
    chip.setPointerCapture(e.pointerId);
    const rect = chip.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    chip.style.position = 'fixed';
    chip.style.left = rect.left + 'px';
    chip.style.top = rect.top + 'px';
    chip.style.width = rect.width + 'px';
    chip.style.zIndex = 99;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    cancelAnimationFrame(animating);
  });

  chip.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    vx = (e.clientX - lastX) / dt;
    vy = (e.clientY - lastY) / dt;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    chip.style.left = (e.clientX - offsetX) + 'px';
    chip.style.top = (e.clientY - offsetY) + 'px';
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    chip.classList.remove('dragging');
    inertia();
  };
  chip.addEventListener('pointerup', release);
  chip.addEventListener('pointercancel', release);

  function inertia() {
    const rect = chip.getBoundingClientRect();
    // keep it roughly on screen
    let nx = rect.left + vx * 14;
    let ny = rect.top + vy * 14;
    nx = Math.max(6, Math.min(innerWidth - rect.width - 6, nx));
    ny = Math.max(6, Math.min(innerHeight - rect.height - 6, ny));
    chip.style.left = nx + 'px';
    chip.style.top = ny + 'px';
    px = Math.abs((chip.style.left === nx + 'px') ? 1 : 0);
    if (Math.abs(vx) > .02 || Math.abs(vy) > .02) {
      vx *= .9; vy *= .9;
      animating = requestAnimationFrame(inertia);
    }
  }
});

// ============ SCROLL REVEALS + COUNTERS ============
const revealEls = document.querySelectorAll('.reveal-text');
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      io.unobserve(en.target);
    }
  });
}, { threshold: .15 });
revealEls.forEach(el => io.observe(el));

function revealVisible() {
  // stagger re-check on load
  revealEls.forEach(el => io.observe(el));
}

const numEls = document.querySelectorAll('.stat-num[data-count]');
const numIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const target = el.dataset.count;
    if (isNaN(parseInt(target))) { numIO.unobserve(el); return; }
    let cur = 0;
    const step = Math.max(1, Math.round(parseInt(target) / 40));
    const timer = setInterval(() => {
      cur += step;
      if (cur >= parseInt(target)) {
        cur = parseInt(target);
        clearInterval(timer);
      }
      el.textContent = cur;
    }, 40);
    numIO.unobserve(el);
  });
}, { threshold: .5 });
numEls.forEach(el => numIO.observe(el));

// ============ PLAY PROJECT VIDEOS ONLY WHEN VISIBLE ============
const projectVideos = document.querySelectorAll('.proj-media video');
const videoIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    const video = en.target;
    if (en.isIntersecting) {
      const p = video.play();
      if (p) p.catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: .25 });
projectVideos.forEach(video => videoIO.observe(video));

// ============ ACTIVE NAV ============
const navLinks = document.querySelectorAll('[data-nav]');
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href')));
window.addEventListener('scroll', () => {
  const y = scrollY + innerHeight * .4;
  let active = 0;
  sections.forEach((s, i) => { if (s && s.offsetTop <= y) active = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === active));
});

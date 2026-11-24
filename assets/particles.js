/* 速喜科技 — 首頁粒子背景（純裝飾，內容不靠它）
   隨捲動變形：0 速喜 S 標誌 → 1 舊系統接線格 → 2 導視箭頭
   不用外部套件；尊重「減少動態」設定；分頁隱藏時暫停。 */
(() => {
  'use strict';
  const canvas = document.querySelector('.particles');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INK = [58, 52, 45];      /* --ink */
  const SHU = [169, 70, 50];     /* --shu */
  const SIZE = 320;              /* 取樣畫布邊長 */

  /* 把一個形狀畫在離屏畫布上，回傳實心像素座標（-0.5～0.5）與顏色 */
  function sample(draw) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const g = c.getContext('2d', { willReadFrequently: true });
    draw(g);
    const d = g.getImageData(0, 0, SIZE, SIZE).data;
    const pts = [];
    for (let y = 0; y < SIZE; y += 2) {
      for (let x = 0; x < SIZE; x += 2) {
        const i = (y * SIZE + x) * 4;
        if (d[i + 3] > 128) pts.push([x / SIZE - 0.5, y / SIZE - 0.5, d[i] > 120 ? 1 : 0]);
      }
    }
    return pts;
  }

  /* 0：速喜 S（取自 assets/suxi-symbol.svg，上半褐墨、下半褪朱） */
  const logo = sample(g => {
    g.scale(SIZE / 256, SIZE / 256);
    g.translate(0, 128); g.transform(1, 0, Math.tan(-15 * Math.PI / 180), 1, 0, 0); g.translate(0, -128);
    g.translate(60, 0);
    g.fillStyle = '#2E2B28';
    g.fill(new Path2D('M116 28 L60 28 A60 60 0 0 0 55.71 147.85 A4 4 0 0 0 60 143.86 L60 111.66 A4 4 0 0 0 56.67 107.72 A20 20 0 0 1 60 68 L116 68 A4 4 0 0 0 120 64 L120 32 A4 4 0 0 0 116 28 Z'));
    g.fillStyle = '#A94632';
    g.fill(new Path2D('M20 228 L76 228 A60 60 0 0 0 80.29 108.15 A4 4 0 0 0 76 112.14 L76 144.34 A4 4 0 0 0 79.33 148.28 A20 20 0 0 1 76 188 L20 188 A4 4 0 0 0 16 192 L16 224 A4 4 0 0 0 20 228 Z'));
  });

  /* 1：舊系統接線格（細線網格＋方塊節點，像平面導視圖） */
  const grid = sample(g => {
    g.strokeStyle = g.fillStyle = '#2E2B28';
    g.lineWidth = 3;
    const n = 5, a = 40, b = SIZE - 40, step = (b - a) / (n - 1);
    for (let i = 0; i < n; i++) {
      const p = a + i * step;
      g.beginPath(); g.moveTo(a, p); g.lineTo(b, p); g.stroke();
      g.beginPath(); g.moveTo(p, a); g.lineTo(p, b); g.stroke();
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i * 7 + j * 3) % 4 === 0) g.fillRect(a + i * step - 12, a + j * step - 12, 24, 24);
    }
    g.fillStyle = '#A94632';                       /* 一個朱色節點：痛點 */
    g.fillRect(a + 2 * step - 14, a + 2 * step - 14, 28, 28);
  });

  /* 2：導視箭頭（與頁面上的 a-right 同形） */
  const arrow = sample(g => {
    g.scale(SIZE / 44, SIZE / 44);
    g.strokeStyle = '#2E2B28';
    g.lineWidth = 4.2; g.lineCap = 'square'; g.lineJoin = 'miter';
    g.stroke(new Path2D('M5 22H38M24 8L38 22L24 36'));
  });

  const shapes = [logo, grid, arrow];
  let N = 0, P = [];
  let w = 0, h = 0, dpr = 1, mobile = false;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function build() {
    N = mobile ? 650 : 1300;
    const lists = shapes.map(s => shuffle(s.slice()));
    P = [];
    for (let i = 0; i < N; i++) {
      P.push({
        t: lists.map(l => l[i % l.length]),
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.6,
        jx: (Math.random() - 0.5) * 2,
        jy: (Math.random() - 0.5) * 2
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const wasMobile = mobile;
    mobile = w <= 860;
    if (!P.length || wasMobile !== mobile) build();
  }

  /* 變形只發生在首屏：捲過首屏時 S → 網格 → 箭頭，之後跟著首屏一起捲走 */
  const hero = document.querySelector('.hero');
  const heroBottom = () => hero ? hero.getBoundingClientRect().bottom : h;

  /* 形狀放在畫面哪裡：桌機靠右，手機置中；首屏底部上來時跟著往上 */
  function frame() {
    const s = mobile ? Math.min(w * 0.86, h * 0.5) : Math.min(h * 0.62, w * 0.36);
    const cy = Math.min(h * (mobile ? 0.56 : 0.52), heroBottom() - s * 0.62);
    return { cx: mobile ? w * 0.5 : w * 0.76, cy, s };
  }

  /* 捲動進度 → 階段 0～2（首屏底部升到畫面 55% 高時到箭頭） */
  function target() {
    const range = Math.max(240, heroBottom() + scrollY - h * 0.55);
    return Math.min(2, Math.max(0, (scrollY / range) * 2));
  }

  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  let stage = target(), time = 0, last = 0, raf = 0;

  function draw() {
    const { cx, cy, s } = frame();
    const k = Math.min(1, Math.floor(stage)), f = ease(stage - k);
    const burst = Math.sin(Math.PI * f) * s * 0.1;    /* 變形途中稍微散開 */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (cy + s < 0) return;                           /* 首屏已捲走：不畫 */
    const size = mobile ? 1.6 : 1.8;
    const buckets = [[], []];
    for (const p of P) {
      const a = p.t[k], b = p.t[Math.min(2, k + 1)];
      const wob = reduce ? 0 : 1.4;
      const x = cx + (a[0] + (b[0] - a[0]) * f) * s + p.jx * burst + Math.sin(time * p.sp + p.ph) * wob;
      const y = cy + (a[1] + (b[1] - a[1]) * f) * s + p.jy * burst + Math.cos(time * p.sp * 0.8 + p.ph) * wob;
      buckets[(f < 0.5 ? a : b)[2]].push(x, y);
    }
    [[INK, 0], [SHU, 1]].forEach(([c, i]) => {
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${i ? 0.75 : 0.55})`;
      const q = buckets[i];
      for (let j = 0; j < q.length; j += 2) ctx.fillRect(q[j], q[j + 1], size, size);
    });
  }

  function loop(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; time += dt;
    stage += (target() - stage) * Math.min(1, dt * 4);
    draw();
    if (!document.hidden) raf = requestAnimationFrame(loop);
  }

  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(); });
  if (reduce) {
    /* 不播動畫：捲動時直接換到對應形狀 */
    draw();
    addEventListener('scroll', () => { stage = target(); draw(); }, { passive: true });
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    });
  }
})();

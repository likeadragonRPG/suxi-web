/* 速喜科技 — 首頁首屏的點陣 S（純裝飾，內容不靠它）
   2026-11-27 unslop 修改：不再隨捲動變形、不再晃動。
   載入時從散開聚合成 S 一次（約 1.2 秒）後靜止；「減少動態」時直接畫好。
   畫布在 .hero 右側，寬度 ≤1100px 由 CSS 隱藏。不用外部套件。 */
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

  const N = 1300;
  const pts = logo.slice().sort(() => Math.random() - 0.5);
  const P = [];
  for (let i = 0; i < N; i++) {
    const t = pts[i % pts.length];
    P.push({ t, a: Math.random() * Math.PI * 2, r: 0.25 + Math.random() * 0.35, d: Math.random() * 0.35 });
  }

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }

  const ease = x => 1 - Math.pow(1 - x, 3);
  function draw(prog) {
    const s = Math.min(w * 0.8, h * 0.62);
    const cx = w * 0.5, cy = h * 0.52;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const buckets = [[], []];
    for (const p of P) {
      const f = ease(Math.min(1, Math.max(0, (prog - p.d) / (1 - p.d))));
      const sx = Math.cos(p.a) * p.r, sy = Math.sin(p.a) * p.r;
      buckets[p.t[2]].push(cx + (sx + (p.t[0] - sx) * f) * s, cy + (sy + (p.t[1] - sy) * f) * s, f);
    }
    [[INK, 0, 0.55], [SHU, 1, 0.75]].forEach(([c, i, al]) => {
      const q = buckets[i];
      for (let j = 0; j < q.length; j += 3) {
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${al * (0.3 + 0.7 * q[j + 2])})`;
        ctx.fillRect(q[j], q[j + 1], 1.8, 1.8);
      }
    });
  }

  if (!canvas.clientWidth) return;               /* 被 CSS 隱藏（窄螢幕）：不畫 */
  resize();
  let done = reduce;
  addEventListener('resize', () => { if (!canvas.clientWidth) return; resize(); if (done) draw(1); });
  if (reduce) { draw(1); return; }
  const DUR = 1200;
  let t0 = 0;
  function loop(now) {
    if (!t0) t0 = now;
    const prog = Math.min(1, (now - t0) / DUR);
    draw(prog);
    if (prog < 1) requestAnimationFrame(loop); else done = true;
  }
  requestAnimationFrame(loop);
})();

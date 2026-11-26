/* 速喜科技 — 首頁捲動淡入（只播一次）
   在 <head> 同步載入：先在 <html> 加上 js，CSS 才會先藏起 .head 和 .plate。
   沒有 JS、瀏覽器太舊、或設定「減少動態」時，什麼都不做，內容照常顯示。 */
(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  root.classList.add('js');

  function start() {
    const items = document.querySelectorAll('main section .head, main section .plate');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

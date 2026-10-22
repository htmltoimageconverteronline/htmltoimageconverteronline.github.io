(() => {
const $ = id => document.getElementById(id);
const H = $('html'), C = $('css'), F = $('pv'), S = $('scale'), W = $('w'), Hh = $('h'), B = $('bg'), T = $('tr'), M = $('msg');
const TPL = {
quote: `<div class="w-[560px] p-10 bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
  <p class="text-3xl font-bold leading-snug">Ship small. Learn fast. Repeat.</p>
  <p class="mt-6 text-lg opacity-80">@yourname</p>
</div>`,
price: `<div class="w-80 bg-white border-2 border-slate-900 p-6 text-slate-900">
  <h3 class="text-xl font-bold">Starter Plan</h3>
  <p class="mt-2 text-5xl font-extrabold">₹499<span class="text-base font-medium text-slate-500">/month</span></p>
  <ul class="mt-4 space-y-1 text-sm"><li>✔ 10 projects</li><li>✔ Email support</li><li>✔ Free updates</li></ul>
</div>`,
badge: `<div class="w-72 rounded-xl bg-slate-900 text-white p-5 flex items-center gap-4">
  <div class="h-14 w-14 rounded-full bg-amber-400 grid place-items-center text-2xl font-bold text-slate-900">R</div>
  <div><p class="font-bold text-lg">Your Name</p><p class="text-sm text-slate-300">Web Developer</p></div>
</div>`
};
let ready = false, timer;
const wait = ms => new Promise(r => setTimeout(r, ms));

const rd = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
const inRange = (rng, txt) => !rng || rng.split(',').some(p => {
  const [a, b] = p.trim().replace(/U\+/i, '').split('-');
  const lo = parseInt(a.replace(/\?/g, '0'), 16), hi = parseInt((b || a).replace(/\?/g, 'F'), 16);
  return [...txt].some(ch => { const c = ch.codePointAt(0); return c >= lo && c <= hi; });
});
// Builds one CSS string with every web font the page uses, embedded as data URLs
async function fontCSS(d) {
  const txt = d.body.textContent, srcs = [];
  d.querySelectorAll('link[rel=stylesheet]').forEach(l => srcs.push({ u: l.href }));
  d.querySelectorAll('style').forEach(s => {
    srcs.push({ t: s.textContent, u: location.href });
    for (const m of s.textContent.matchAll(/@import\s+(?:url\()?["']?([^"')\s;]+)/g)) srcs.push({ u: m[1] });
  });
  const parts = await Promise.all(srcs.map(async s => {
    let t = s.t;
    try { if (t == null) t = await (await fetch(s.u)).text(); } catch (e) { return ''; }
    const blocks = t.match(/@font-face\s*{[^}]*}/g) || [];
    return (await Promise.all(blocks.map(async b => {
      if (!inRange((b.match(/unicode-range:\s*([^;}]+)/) || [])[1], txt)) return '';
      for (const m of [...b.matchAll(/url\(["']?([^"')]+)["']?\)/g)]) {
        if (m[1].startsWith('data:')) continue;
        try { const x = await rd(await (await fetch(new URL(m[1], s.u).href)).blob()); b = b.replace(m[1], () => x); } catch (e) {}
      }
      return b;
    }))).join('\n');
  }));
  return parts.join('\n');
}
let shrink = false, auto = 0;
function build(src) {
  const d = new DOMParser().parseFromString(src, 'text/html');
  d.querySelectorAll('script,iframe,object,embed').forEach(e => e.remove());
  d.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
    if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name);
  }));
  shrink = !/<html|<body/i.test(src) && !W.value;
  const s = d.createElement('style');
  s.textContent = (/<html|<body/i.test(src) ? '' : 'body{margin:0;' + (shrink ? 'width:fit-content' : '') + '}') + C.value;
  d.head.append(s);
  const t = d.createElement('script'); t.src = 'https://cdn.tailwindcss.com/3.4.17';
  const l = d.createElement('script'); l.src = 'vendor/html-to-image.js';
  d.head.prepend(t, l);
  return '<!doctype html>' + d.documentElement.outerHTML;
}
function fit() {
  const box = $('box'), vw = +W.value || auto || 1280;
  const k = Math.min(1, (box.parentElement.clientWidth - 44) / vw);
  F.style.width = vw + 'px'; F.style.transform = 'scale(' + k + ')';
  box.style.width = vw * k + 'px'; box.style.height = F.offsetHeight * k + 'px';
}
function render() { ready = false; auto = 0; F.style.height = '1px'; F.srcdoc = build(H.value); fit(); }
F.onload = async () => {
  const d = F.contentDocument;
  try { await d.fonts.ready; } catch (e) {}
  await wait(450);
  if (shrink) { auto = Math.ceil(d.body.scrollWidth) + 1; fit(); }
  F.style.height = '1px';
  F.style.height = (+Hh.value || Math.ceil(d.documentElement.scrollHeight)) + 'px';
  fit(); ready = true;
};
async function capture(fmt) {
  M.textContent = 'Rendering…';
  while (!ready) await wait(80);
  const win = F.contentWindow, d = F.contentDocument, h = win.htmlToImage, body = d.body;
  const cs = x => win.getComputedStyle(x);
  const hasBg = x => cs(x).backgroundImage !== 'none' || !/^(transparent|rgba\([^)]*,\s*0\))$/.test(cs(x).backgroundColor);
  const crop = $('cm').value === 'c';
  const o = { pixelRatio: +S.value, cacheBust: true, style: { margin: '0' }, fontEmbedCSS: await fontCSS(d) };
  if (crop) o.style.background = 'none';
  if (+Hh.value) o.height = +Hh.value;
  const kids = [...body.children].filter(e => !/^(SCRIPT|STYLE|LINK|META|TITLE|NOSCRIPT|TEMPLATE)$/.test(e.tagName) && cs(e).display !== 'none');
  const rects = kids.map(e => e.getBoundingClientRect()).filter(q => q.width && q.height);
  if (fmt === 'svg') {
    const el = crop && kids.length === 1 ? kids[0] : body;
    if (!T.checked && !hasBg(el)) o.backgroundColor = B.value;
    return h.toSvg(el, o);
  }
  const cv = await h.toCanvas(body, o), r = o.pixelRatio, b = body.getBoundingClientRect();
  let sx = 0, sy = 0, sw = cv.width, sh = cv.height;
  if (crop && rects.length) {
    sx = Math.max(0, Math.floor((Math.min(...rects.map(q => q.left)) - b.left) * r));
    sy = Math.max(0, Math.floor((Math.min(...rects.map(q => q.top)) - b.top) * r));
    sw = Math.min(cv.width, Math.ceil((Math.max(...rects.map(q => q.right)) - b.left) * r)) - sx;
    sh = Math.min(cv.height, Math.ceil((Math.max(...rects.map(q => q.bottom)) - b.top) * r)) - sy;
  }
  const out = document.createElement('canvas'); out.width = sw; out.height = sh;
  const x = out.getContext('2d');
  const page = !crop && !hasBg(body) && hasBg(d.documentElement) ? cs(d.documentElement).backgroundColor : B.value;
  if (!(T.checked && fmt !== 'jpg')) { x.fillStyle = page; x.fillRect(0, 0, sw, sh); }
  x.drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL(fmt === 'jpg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png', 1);
}

document.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => {
  try {
    const url = await capture(b.dataset.f);
    const a = document.createElement('a');
    a.href = url; a.download = 'markupshot.' + b.dataset.f; a.click();
    M.textContent = 'Downloaded ' + b.dataset.f.toUpperCase();
  } catch (e) { M.textContent = 'Export failed. Check that your HTML is valid and any images allow cross-site use.'; }
});
$('copy').onclick = async () => {
  try {
    const blob = await (await fetch(await capture('png'))).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    M.textContent = 'Image copied';
  } catch (e) { M.textContent = 'Copy is not supported in this browser. Use Download PNG.'; }
};
$('tpl').onchange = e => { if (TPL[e.target.value]) { H.value = TPL[e.target.value]; C.value = ''; render(); } };
$('file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { (/\.css$/i.test(f.name) ? C : H).value = t; render(); });
};
S.oninput = () => $('sv').textContent = S.value + 'x';
[H, C, W, Hh].forEach(x => x.oninput = () => { clearTimeout(timer); timer = setTimeout(render, 400); });
window.addEventListener('resize', fit);
H.value = TPL.quote; render();
})();

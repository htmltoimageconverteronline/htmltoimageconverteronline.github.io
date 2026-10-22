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

function clean(src) {
  const d = new DOMParser().parseFromString(src, 'text/html');
  d.querySelectorAll('script,iframe,object,embed').forEach(e => e.remove());
  d.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
    if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name);
  }));
  return d.head.innerHTML + d.body.innerHTML;
}
function render() {
  ready = false;
  const w = +W.value, h = +Hh.value;
  const size = (w ? `width:${w}px;` : 'width:fit-content;') + (h ? `height:${h}px;overflow:hidden;` : '');
  F.srcdoc = `<!doctype html><meta charset="utf-8"><script src="https://cdn.tailwindcss.com/3.4.17"><\/script><style>body{margin:0}${C.value}</style><div id="cap" style="${size}">${clean(H.value)}</div>`;
}
F.onload = () => setTimeout(() => {
  const c = F.contentDocument.getElementById('cap');
  F.style.height = (c.scrollHeight + 4) + 'px';
  ready = true;
}, 400);

function run(el, fmt, o) {
  const h = window.htmlToImage;
  if (fmt === 'png') return h.toPng(el, o);
  if (fmt === 'jpg') return h.toJpeg(el, { ...o, quality: .95 });
  if (fmt === 'svg') return h.toSvg(el, o);
  return h.toCanvas(el, o).then(c => c.toDataURL('image/webp', .92));
}
async function capture(fmt) {
  M.textContent = 'Rendering…';
  while (!ready) await wait(80);
  const el = F.contentDocument.getElementById('cap');
  const o = { pixelRatio: +S.value, cacheBust: true };
  if (!(T.checked && fmt !== 'jpg')) o.backgroundColor = B.value;
  try { return await run(el, fmt, o); }
  catch (e) { return await run(el, fmt, { ...o, skipFonts: true }); }
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
H.value = TPL.quote; render();
})();

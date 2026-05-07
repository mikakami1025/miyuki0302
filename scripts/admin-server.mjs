import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {
  ASSET_FOLDERS,
  DATA_FILES,
  listAssets,
  readArticles,
  readCssVariables,
  readJson,
  resolveProjectPath,
  saveDataUrlAsset,
  writeArticle,
  writeCssVariables,
  writeJson
} from './admin-utils.mjs';

const PORT = Number(process.env.ADMIN_PORT || 8787);

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function contentPayload() {
  const [site, home, classrooms, contact, articles, cssVars, assets] = await Promise.all([
    readJson(DATA_FILES.site),
    readJson(DATA_FILES.home),
    readJson(DATA_FILES.classrooms),
    readJson(DATA_FILES.contact),
    readArticles(),
    readCssVariables(),
    listAssets()
  ]);
  return { site, home, classrooms, contact, articles, cssVars, assets, assetFolders: ASSET_FOLDERS };
}

async function serveAsset(res, pathname) {
  const relative = pathname.replace(/^\/assets\//, 'public/assets/');
  const file = resolveProjectPath(relative);
  const data = await fs.readFile(file);
  const ext = path.extname(file).toLowerCase();
  const type = ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : ext === '.svg' ? 'image/svg+xml'
    : 'image/jpeg';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && (pathname === '/' || pathname === '/admin')) {
      send(res, 200, html(), 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/assets/')) {
      await serveAsset(res, pathname);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/content') {
      send(res, 200, await contentPayload());
      return;
    }

    if (req.method === 'POST' && pathname === '/api/save') {
      const body = await readBody(req);
      const { section, value } = body;
      if (section === 'site') await writeJson(DATA_FILES.site, value);
      else if (section === 'home') await writeJson(DATA_FILES.home, value);
      else if (section === 'classrooms') await writeJson(DATA_FILES.classrooms, value);
      else if (section === 'contact') await writeJson(DATA_FILES.contact, value);
      else if (section === 'styles') await writeCssVariables(value);
      else throw new Error('Unknown section');
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/article') {
      const body = await readBody(req);
      const file = await writeArticle(body.article, body.oldSlug);
      send(res, 200, { ok: true, file });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/upload') {
      const body = await readBody(req);
      const assetPath = await saveDataUrlAsset(body.folder, body.filename, body.dataUrl);
      send(res, 200, { ok: true, path: assetPath });
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: error.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local content admin: http://127.0.0.1:${PORT}/admin`);
});

function html() {
  return `<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Miyuki Site Admin</title>
  <style>
    :root { color-scheme: light; --ink:#302724; --muted:#75625d; --line:#eadbd4; --paper:#fffaf6; --panel:#fff; --primary:#8f3f4c; --green:#41685c; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); font-family: "Microsoft JhengHei", system-ui, sans-serif; background: #f7eee9; }
    header { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px; background: rgba(255,250,246,.94); border-bottom: 1px solid var(--line); backdrop-filter: blur(14px); }
    header h1 { margin: 0; font-size: 18px; }
    header p { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
    main { display: grid; grid-template-columns: 230px minmax(0, 1fr); min-height: calc(100vh - 70px); }
    nav { position: sticky; top: 70px; height: calc(100vh - 70px); padding: 16px; border-right: 1px solid var(--line); background: rgba(255,255,255,.55); }
    nav button, .button { width: 100%; min-height: 42px; margin-bottom: 8px; padding: 9px 12px; color: var(--ink); text-align: left; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 8px; }
    nav button.active, .button, .primary { color: #fff; background: var(--primary); border-color: var(--primary); }
    .content { padding: 22px; }
    .panel { display: none; max-width: 1180px; }
    .panel.active { display: block; }
    .card { margin-bottom: 16px; padding: 18px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 12px 32px rgba(80,45,34,.08); }
    .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .row.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    label { display: grid; gap: 5px; margin-bottom: 10px; color: var(--muted); font-size: 13px; }
    input, textarea, select { width: 100%; padding: 10px 11px; color: var(--ink); font: inherit; background: #fff; border: 1px solid var(--line); border-radius: 8px; }
    textarea { min-height: 120px; resize: vertical; }
    .body-editor { min-height: 360px; font-family: Consolas, "Microsoft JhengHei", monospace; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .actions button, header button { min-height: 38px; padding: 8px 12px; cursor: pointer; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    .actions .primary, header .primary { color: #fff; background: var(--primary); border-color: var(--primary); }
    .danger { color: #9d2637; }
    .list { display: grid; gap: 12px; }
    .item { padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: #fffdfb; }
    .item-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
    .item-header h3 { margin: 0; font-size: 17px; }
    img.preview { width: 100%; max-height: 170px; object-fit: cover; border: 1px solid var(--line); border-radius: 8px; background: #f8f1ed; }
    .asset-line { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end; }
    .contact-admin-grid { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: 14px; align-items: start; }
    .toast { position: fixed; right: 18px; bottom: 18px; z-index: 10; display: none; max-width: 360px; padding: 12px 14px; color: #fff; background: var(--green); border-radius: 8px; box-shadow: 0 14px 34px rgba(0,0,0,.18); }
    .toast.show { display: block; }
    .help { color: var(--muted); font-size: 13px; }
    @media (max-width: 860px) { main { grid-template-columns: 1fr; } nav { position: static; height: auto; display: grid; grid-template-columns: repeat(2, 1fr); } .row, .row.three, .contact-admin-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Miyuki 網站本機管理介面</h1>
    </div>
    <button class="primary" onclick="reloadAll()">重新讀取</button>
  </header>
  <main>
    <nav id="tabs"></nav>
    <section class="content" id="app"></section>
  </main>
  <div class="toast" id="toast"></div>
  <script>
    const tabDefs = [
      ['site','網站設定'], ['style','樣式'], ['hero','首頁輪播'], ['about','關於我們'],
      ['works','作品輪播'], ['classrooms','教室資訊'], ['contact','聯絡我們'], ['blog','文章']
    ];
    let state = {};
    let active = 'site';
    const assetUrl = (p) => '/' + p.replace(/^assets\\//, 'assets/');
    const el = (id) => document.getElementById(id);
    const toast = (msg, error=false) => { const t=el('toast'); t.textContent=msg; t.style.background=error?'#9d2637':'#41685c'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2600); };
    const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    async function api(path, options={}) {
      const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    }

    async function reloadAll() {
      state = await api('/api/content');
      renderTabs();
      render();
      toast('已重新讀取網站資料');
    }

    function renderTabs() {
      el('tabs').innerHTML = tabDefs.map(([key,label]) => '<button class="'+(active===key?'active':'')+'" onclick="active=\\''+key+'\\';renderTabs();render()">'+label+'</button>').join('');
    }

    function field(path, label, type='text') {
      const value = get(path) ?? '';
      return '<label>'+label+'<input data-path="'+path+'" type="'+type+'" value="'+esc(value)+'" oninput="setByInput(this)"></label>';
    }

    function area(path, label, rows=5) {
      return '<label>'+label+'<textarea rows="'+rows+'" data-path="'+path+'" oninput="setByInput(this)">'+esc(get(path) ?? '')+'</textarea></label>';
    }

    function get(path) {
      return path.split('.').reduce((obj, key) => obj?.[key], state);
    }

    function set(path, value) {
      const keys = path.split('.');
      let obj = state;
      for (const key of keys.slice(0,-1)) obj = obj[key];
      obj[keys.at(-1)] = value;
    }

    function setByInput(input) {
      if (input.type === 'checkbox') set(input.dataset.path, input.checked);
      else set(input.dataset.path, input.value);
    }

    async function saveSection(section, value) {
      await api('/api/save', { method:'POST', body: JSON.stringify({ section, value }) });
      toast('已儲存');
    }

    async function upload(folder, targetPath) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
        const result = await api('/api/upload', { method:'POST', body: JSON.stringify({ folder, filename: file.name, dataUrl }) });
        set(targetPath, result.path);
        state.assets = await api('/api/content').then(d => d.assets);
        render();
        toast('圖片已上傳並套用');
      };
      input.click();
    }

    function imageField(path, label, folder) {
      const value = get(path) ?? '';
      return '<div class="asset-line"><label>'+label+'<input data-path="'+path+'" value="'+esc(value)+'" oninput="setByInput(this)"></label><button onclick="upload(\\''+folder+'\\',\\''+path+'\\')">上傳</button></div>' +
        (value ? '<img class="preview" src="'+assetUrl(value)+'" alt="preview">' : '');
    }

    function render() {
      if (active === 'site') renderSite();
      if (active === 'style') renderStyle();
      if (active === 'hero') renderHero();
      if (active === 'about') renderAbout();
      if (active === 'works') renderWorks();
      if (active === 'classrooms') renderClassrooms();
      if (active === 'contact') renderContact();
      if (active === 'blog') renderBlog();
    }

    function renderSite() {
      el('app').innerHTML = '<div class="panel active card"><h2>網站設定</h2>' +
        '<div class="row">'+field('site.name','完整網站名稱')+field('site.shortName','導覽短名稱')+'</div>' +
        area('site.description','SEO 描述',3) +
        '<div class="row">'+imageField('site.logo','Logo','brand')+imageField('site.background.image','全站背景','backgrounds')+'</div>' +
        field('site.background.overlay','背景遮罩，例如 rgba(255, 250, 246, 0.84)') +
        '<div class="actions"><button class="primary" onclick="saveSection(\\'site\\', state.site)">儲存網站設定</button></div></div>';
    }

    function renderStyle() {
      const keys = ['--color-primary','--color-primary-dark','--color-secondary','--color-accent','--color-ink','--color-muted','--font-body','--font-heading','--text-sm','--text-body','--text-md','--text-lg','--text-xl','--space-section','--radius-card','--shadow-card'];
      el('app').innerHTML = '<div class="panel active card"><h2>樣式</h2><div class="row">' +
        keys.map(k => '<label>'+k+'<input value="'+esc(state.cssVars[k] || '')+'" oninput="state.cssVars[\\''+k+'\\']=this.value"></label>').join('') +
        '</div><div class="actions"><button class="primary" onclick="saveSection(\\'styles\\', state.cssVars)">儲存樣式</button></div></div>';
    }

    function renderHero() {
      const slides = state.home.heroSlides;
      el('app').innerHTML = '<div class="card"><h2>首頁輪播</h2></div><div class="list">' +
        slides.map((_, i) => slideEditor('home.heroSlides.'+i, 'heroSlides', i, 'hero')).join('') +
        '</div><div class="actions"><button onclick="state.home.heroSlides.push({title:\\'新輪播\\',eyebrow:\\'Hero\\',description:\\'請輸入描述\\',image:\\'assets/hero/hero-01.jpg\\',link:\\'#works\\',linkLabel:\\'了解更多\\'});render()">新增輪播</button><button class="primary" onclick="saveSection(\\'home\\', state.home)">儲存首頁輪播</button></div>';
    }

    function slideEditor(base, listName, i, folder) {
      return '<div class="item"><div class="item-header"><h3>項目 '+(i+1)+'</h3><div><button onclick="moveArrayItem(get(\\''+base.replace(/\\.\\d+$/,'')+'\\'),'+i+',-1);render()">上移</button> <button onclick="moveArrayItem(get(\\''+base.replace(/\\.\\d+$/,'')+'\\'),'+i+',1);render()">下移</button> <button class="danger" onclick="get(\\''+base.replace(/\\.\\d+$/,'')+'\\').splice('+i+',1);render()">刪除</button></div></div>' +
        '<div class="row">'+field(base+'.title','標題')+field(base+'.eyebrow','小標 / eyebrow')+'</div>' +
        area(base+'.description','描述',3) +
        '<div class="row">'+field(base+'.link','連結')+field(base+'.linkLabel','按鈕文字')+'</div>' +
        imageField(base+'.image','圖片',folder) + '</div>';
    }

    function moveArrayItem(arr, index, direction) {
      const next = index + direction;
      if (!arr || next < 0 || next >= arr.length) return;
      const [item] = arr.splice(index, 1);
      arr.splice(next, 0, item);
    }

    function renderAbout() {
      el('app').innerHTML = '<div class="card"><h2>關於我們</h2>' +
        '<div class="row">'+field('home.aboutContent.eyebrow','小標')+field('home.aboutContent.title','大標')+'</div>' +
        '<label>內文，每行一段<textarea rows="9" oninput="state.home.aboutContent.body=this.value.split(/\\\\n+/).filter(Boolean)">'+esc(state.home.aboutContent.body.join('\\n'))+'</textarea></label>' +
        '<div class="actions"><button class="primary" onclick="saveSection(\\'home\\', state.home)">儲存關於我們</button></div></div>';
    }

    function renderWorks() {
      el('app').innerHTML = '<div class="card"><h2>作品輪播</h2></div>' +
        state.home.workCollections.map((collection, ci) => '<div class="card"><div class="row">'+field('home.workCollections.'+ci+'.title','分類標題')+field('home.workCollections.'+ci+'.key','分類代碼')+'</div>'+area('home.workCollections.'+ci+'.description','分類描述',3)+'<div class="list">'+collection.slides.map((_, si) => workSlide(ci, si)).join('')+'</div><div class="actions"><button onclick="state.home.workCollections['+ci+'].slides.push({image:\\'assets/works/crystal-flowers/crystal-01.jpg\\',title:\\'新作品\\',link:\\'/blog/\\'});render()">新增作品</button></div></div>').join('') +
        '<div class="actions"><button class="primary" onclick="saveSection(\\'home\\', state.home)">儲存作品輪播</button></div>';
    }

    function workSlide(ci, si) {
      const folder = state.home.workCollections[ci].key === 'craft-bonsai' ? 'works/craft-bonsai' : 'works/crystal-flowers';
      const base = 'home.workCollections.'+ci+'.slides.'+si;
      return '<div class="item"><div class="item-header"><h3>作品 '+(si+1)+'</h3><button class="danger" onclick="state.home.workCollections['+ci+'].slides.splice('+si+',1);render()">刪除</button></div><div class="row">'+field(base+'.title','作品標題')+field(base+'.link','連結')+'</div>'+imageField(base+'.image','作品圖片',folder)+'</div>';
    }

    function renderClassrooms() {
      el('app').innerHTML = '<div class="card"><h2>教室資訊</h2></div>' +
        state.classrooms.map((group, gi) => '<div class="card"><div class="item-header"><h3>'+esc(group.city || '新城市')+'</h3><button class="danger" onclick="state.classrooms.splice('+gi+',1);render()">刪除城市</button></div><div class="row">'+field('classrooms.'+gi+'.city','城市')+field('classrooms.'+gi+'.summary','摘要')+'</div><div class="list">'+group.schools.map((_, si) => schoolEditor(gi, si)).join('')+'</div><div class="actions"><button onclick="state.classrooms['+gi+'].schools.push({name:\\'新教室\\',teacher:\\'\\',address:\\'\\',phone:\\'\\',note:\\'\\'});render()">新增教室</button></div></div>').join('') +
        '<div class="actions"><button onclick="state.classrooms.push({city:\\'新城市\\',summary:\\'\\',schools:[]});render()">新增城市</button><button class="primary" onclick="saveSection(\\'classrooms\\', state.classrooms)">儲存教室資訊</button></div>';
    }

    function schoolEditor(gi, si) {
      const base = 'classrooms.'+gi+'.schools.'+si;
      return '<div class="item"><div class="item-header"><h3>教室 '+(si+1)+'</h3><button class="danger" onclick="state.classrooms['+gi+'].schools.splice('+si+',1);render()">刪除</button></div><div class="row">'+field(base+'.name','教室名稱')+field(base+'.teacher','老師')+field(base+'.address','地址')+field(base+'.phone','電話')+'</div>'+area(base+'.note','備註',3)+'</div>';
    }

    function renderContact() {
      ensureContactSocialLinks();
      el('app').innerHTML = '<div class="card"><h2>聯絡我們</h2><div class="contact-admin-grid"><div class="item"><h3>左側聯絡資訊</h3>'+
        field('contact.address','地址') + field('contact.phone','電話') + field('contact.email','Email') +
        '</div><div class="item"><h3>右側社群 icon 連結</h3><div class="list">' +
        state.contact.socialLinks.map((_, i) => socialLinkEditor(i)).join('') +
        '</div><div class="actions"><button onclick="state.contact.socialLinks.push({label:\\'新社群連結\\',type:\\'facebook\\',url:\\'\\'});render()">新增社群連結</button></div></div></div><div class="actions"><button class="primary" onclick="saveContact()">儲存聯絡資訊</button></div></div>';
    }

    function ensureContactSocialLinks() {
      if (Array.isArray(state.contact.socialLinks) && state.contact.socialLinks.length) return;
      state.contact.socialLinks = [
        { label:'水晶花藝 Facebook', type:'facebook', url: state.contact.facebook || '' },
        { label:'工藝盆栽 Facebook', type:'facebook', url: state.contact.facebook || '' },
        { label:'水晶花藝 Instagram', type:'instagram', url: state.contact.instagram || '' },
        { label:'工藝盆栽 Instagram', type:'instagram', url: state.contact.instagram || '' },
        { label:'蝦皮賣場', type:'shopee', url: state.contact.shopee || '' }
      ];
    }

    function socialLinkEditor(i) {
      const base = 'contact.socialLinks.'+i;
      const currentType = get(base+'.type') || 'facebook';
      return '<div class="item"><div class="item-header"><h3>icon '+(i+1)+'</h3><button class="danger" onclick="state.contact.socialLinks.splice('+i+',1);render()">刪除</button></div>' +
        field(base+'.label','顯示名稱') +
        '<label>icon 類型<select data-path="'+base+'.type" onchange="setByInput(this)"><option value="facebook" '+(currentType==='facebook'?'selected':'')+'>Facebook</option><option value="instagram" '+(currentType==='instagram'?'selected':'')+'>Instagram</option><option value="shopee" '+(currentType==='shopee'?'selected':'')+'>蝦皮</option></select></label>' +
        field(base+'.url','網址') + '</div>';
    }

    async function saveContact() {
      ensureContactSocialLinks();
      state.contact.facebook = state.contact.socialLinks.find((link) => link.type === 'facebook')?.url || state.contact.facebook || '';
      state.contact.instagram = state.contact.socialLinks.find((link) => link.type === 'instagram')?.url || state.contact.instagram || '';
      state.contact.shopee = state.contact.socialLinks.find((link) => link.type === 'shopee')?.url || state.contact.shopee || '';
      await saveSection('contact', state.contact);
    }

    function renderBlog() {
      const list = state.articles || [];
      const current = state.currentArticle || list[0] || blankArticle();
      state.currentArticle = current;
      el('app').innerHTML = '<div class="card"><h2>文章</h2><div class="row"><label>選擇文章<select onchange="state.currentArticle = state.articles.find(a=>a.slug===this.value); render()">'+list.map(a => '<option value="'+esc(a.slug)+'" '+(a.slug===current.slug?'selected':'')+'>'+esc(a.title)+'</option>').join('')+'</select></label><label>發布狀態<select onchange="state.currentArticle.draft=this.value===\\'true\\'"><option value="false" '+(!current.draft?'selected':'')+'>發布</option><option value="true" '+(current.draft?'selected':'')+'>草稿</option></select></label></div><div class="actions"><button onclick="state.currentArticle=blankArticle();render()">新增文章</button></div></div>' +
        '<div class="card">'+articleField('title','大標')+articleField('slug','網址 slug')+articleField('description','摘要')+'<div class="row">'+articleField('date','日期','date')+articleField('category','分類')+'</div>'+articleTags()+imageFieldArticle('cover','封面圖','blog')+'<label>文章內容 Markdown / MDX<textarea class="body-editor" oninput="state.currentArticle.body=this.value">'+esc(current.body || '')+'</textarea></label><div class="actions"><button class="primary" onclick="saveArticle()">儲存文章</button></div></div>';
    }

    function blankArticle() {
      return { title:'新文章', slug:'new-post', description:'文章摘要', date:new Date().toISOString().slice(0,10), cover:'assets/blog/sample-cover.jpg', category:'水晶花藝', tags:[], draft:false, body:'請輸入文章內容。' };
    }

    function articleField(key, label, type='text') {
      return '<label>'+label+'<input type="'+type+'" value="'+esc(state.currentArticle[key] || '')+'" oninput="state.currentArticle[\\''+key+'\\']=this.value"></label>';
    }

    function articleTags() {
      return '<label>標籤，用逗號分隔<input value="'+esc((state.currentArticle.tags || []).join(', '))+'" oninput="state.currentArticle.tags=this.value.split(\\',\\').map(s=>s.trim()).filter(Boolean)"></label>';
    }

    function imageFieldArticle(key, label, folder) {
      const value = state.currentArticle[key] || '';
      return '<div class="asset-line"><label>'+label+'<input value="'+esc(value)+'" oninput="state.currentArticle[\\''+key+'\\']=this.value"></label><button onclick="uploadArticle(\\''+folder+'\\',\\''+key+'\\')">上傳</button></div>' + (value ? '<img class="preview" src="'+assetUrl(value)+'">' : '');
    }

    async function uploadArticle(folder, key) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
        const result = await api('/api/upload', { method:'POST', body: JSON.stringify({ folder, filename: file.name, dataUrl }) });
        state.currentArticle[key] = result.path;
        render();
        toast('封面圖已上傳');
      };
      input.click();
    }

    async function saveArticle() {
      const oldSlug = (state.articles.find(a => a.file === state.currentArticle.file) || {}).slug || state.currentArticle.slug;
      const result = await api('/api/article', { method:'POST', body: JSON.stringify({ article: state.currentArticle, oldSlug }) });
      state = await api('/api/content');
      state.currentArticle = state.articles.find(a => a.file === result.file) || state.articles[0];
      render();
      toast('文章已儲存');
    }

    reloadAll().catch(err => toast(err.message, true));
  </script>
</body>
</html>`;
}

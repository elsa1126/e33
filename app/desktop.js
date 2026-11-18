// 電腦軟體版專用：存檔清單面板＋另存新檔。網頁版不會載入這個檔案。
(function () {
  const T = window.__TAURI__;
  if (!T) return;
  const invoke = T.core.invoke;
  const dialog = T.dialog;
  let currentPath = '';
  const KEY = 'e33.extraDir';
  const getExtra = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const setExtra = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  // 另存新檔：預設存回剛才開啟的位置
  window.E33_SAVE = async (name, bytes) => {
    const path = await dialog.save({ defaultPath: currentPath || name, filters: [{ name: 'E33 存檔', extensions: ['sav'] }] });
    if (!path) return false;
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    await invoke('write_file', { path, data: btoa(bin) });
    currentPath = path;
    return true;
  };

  const css = document.createElement('style');
  css.textContent = `
  #savesOv { position: fixed; inset: 0; z-index: 20; background: rgba(0,0,0,.65); display: none; align-items: flex-end; justify-content: center; }
  #savesOv.on { display: flex; }
  #savesPanel { width: min(640px, 100%); max-height: 86vh; overflow: auto; background: var(--card); border-radius: 24px 24px 0 0; padding: 24px 20px 96px; position: relative; }
  #savesPanel h2 { margin: 0 0 6px; }
  #savesPanel .hint { color: var(--gray); font-size: 13px; font-weight: 400; margin: 0 0 14px; line-height: 1.6; }
  #savesPanel .grp { color: var(--dim); font-size: 12px; margin: 16px 2px 6px; overflow-wrap: anywhere; }
  #savesPanel .item { width: 100%; text-align: left; border: 0; background: var(--float); color: var(--text); font: inherit; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; gap: 12px; align-items: center; }
  #savesPanel .item:hover { background: var(--hi); }
  #savesPanel .item .sub { color: var(--gray); font-size: 12px; margin-top: 3px; }
  #savesPanel .item .when { color: var(--dim); font-size: 12px; flex: none; }
  #savesClose { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); width: 52px; height: 52px; border-radius: 9999px; border: 0; background: var(--float); color: var(--text); font-size: 22px; cursor: pointer; }
  @media (min-width: 1024px) { body .bar { flex-wrap: wrap; row-gap: 10px; } body .bar #dl { flex: 0 0 100%; order: -1; } body .wrap header { padding-bottom: 170px; } }
  #savesBtn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }`;
  document.head.append(css);

  const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } for (const c of kids) if (c != null) e.append(c); return e; };
  const fmtTime = (s) => { const d = new Date(s * 1000); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const fmtHours = (h) => { if (h == null) return ''; const m = Math.floor(h * 60); return `${Math.floor(m / 60)} 小時 ${m % 60} 分`; };

  const list = el('div');
  const panel = el('div', { id: 'savesPanel' },
    el('h2', {}, '遊戲存檔'),
    el('p', { class: 'hint' }, '點一下就開啟。改完按「下載存檔」會跳出另存新檔，預設存回原本的位置；覆寫前請先備份，並讓遊戲停在標題畫面或關掉。'),
    el('div', { class: 'bulk' },
      el('button', { class: 'pill ghost', onclick: () => load() }, '重新整理'),
      el('button', { class: 'pill ghost', onclick: async () => { const d = await dialog.open({ directory: true, title: '選擇 SaveGames 資料夾' }); if (d) { setExtra(d); load(); } } }, '選擇資料夾')),
    list);
  const ov = el('div', { id: 'savesOv', onclick: (e) => { if (e.target === ov) hide(); } }, panel, el('button', { id: 'savesClose', title: '關閉', onclick: () => hide() }, '×'));
  const show = () => { ov.classList.add('on'); load(); };
  const hide = () => ov.classList.remove('on');

  async function load() {
    list.replaceChildren(el('div', { class: 'hint' }, '尋找存檔中…'));
    let saves = [];
    try { saves = await invoke('list_saves', { extra: getExtra() }); } catch (e) { list.replaceChildren(el('div', { class: 'hint' }, '讀取失敗：' + e)); return; }
    list.replaceChildren();
    if (!saves.length) { list.append(el('div', { class: 'hint' }, '找不到 EXPEDITION_x.sav。請按「選擇資料夾」指定 SaveGames 資料夾（Mac 版在遊戲包裝 .app 裡的 drive_c/users/…/AppData/Local/Sandfall/Saved/SaveGames）。')); return; }
    let lastDir = '';
    for (const s of saves) {
      const dir = s.path.slice(0, s.path.length - s.name.length - 1);
      if (dir !== lastDir) { list.append(el('div', { class: 'grp' }, dir)); lastDir = dir; }
      const sub = el('div', { class: 'sub' }, '讀取中…');
      const btn = el('button', { class: 'item', onclick: () => open(s) }, el('div', {}, el('div', {}, s.name.replace(/\.sav$/i, '')), sub), el('div', { class: 'when' }, fmtTime(s.modified)));
      list.append(btn);
      invoke('read_save', { path: s.path }).then((buf) => {
        try { const m = window.E33_APP.summary(new Uint8Array(buf)); sub.textContent = [fmtHours(m.hours), m.place, m.ngp ? `新遊戲+ ${m.ngp}` : ''].filter(Boolean).join(' · ') || '—'; }
        catch (e) { sub.textContent = '無法解析：' + e.message; }
      }).catch((e) => { sub.textContent = '讀取失敗：' + e; });
    }
  }

  async function open(s) {
    if (window.E33_APP.dirty && !confirmArmed(s.path)) return;
    try {
      const buf = await invoke('read_save', { path: s.path });
      window.E33_APP.openBytes(new Uint8Array(buf), s.name);
      currentPath = s.path; hide();
    } catch (e) { alert('開啟失敗：' + (e.message || e)); }
  }
  // 有未儲存的修改時，同一個存檔要點兩次才會切換
  let armed = '';
  function confirmArmed(p) { if (armed === p) { armed = ''; return true; } armed = p; const t = document.getElementById('toast'); if (t) { t.textContent = '目前有未儲存的修改，再點一次才會切換'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2600); } return false; }

  window.addEventListener('DOMContentLoaded', () => {
    document.body.append(ov);
    const bar = document.querySelector('.bar');
    const b = el('button', { class: 'round', id: 'savesBtn', title: '遊戲存檔清單', onclick: show });
    b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
    if (bar) bar.prepend(b);
    show();
  });
})();

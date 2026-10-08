/* ============================================================
   工具箱统一前端增强 (toolbox.js)
   与 guide.js 同目录，在其之后加载。只做"加法"，不改业务逻辑：
     1. 统一状态提示图标（✅ 完成 / ❌ 失败 / ⏳ 处理中）
     2. 页面底部统一品牌页脚
     3. 各工具的输出目录输入框旁新增「📁 默认」按钮（统一默认输出目录）
   ============================================================ */
(function () {
  var ICON = { ok: '\u2705', err: '\u274C', busy: '\u23F3' };

  /* ---------- 1. 状态提示图标 ---------- */
  function decorate(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.children && el.children.length) return;      /* 含子元素则不动，避免破坏结构 */
    var cls = el.className || '';
    var m = (String(cls).match(/(?:^|\s)(ok|err|busy)(?:\s|$)/) || [])[1] || '';
    var icon = ICON[m] || '';
    if ((el.getAttribute('data-tb-icon') || '') === icon) return;
    el.setAttribute('data-tb-icon', icon);
    var txt = (el.textContent || '').replace(/^[\u2705\u274C\u23F3]\s*/, '');
    el.textContent = icon ? (icon + ' ' + txt) : txt;
  }
  function sweep(root) {
    var list = (root || document).querySelectorAll('[class*="status"]');
    for (var i = 0; i < list.length; i++) decorate(list[i]);
  }
  function observe() {
    sweep(document);
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (!t) continue;
        if (t.nodeType === 1) decorate(t);
        else if (t.nodeType === 3 && t.parentNode) decorate(t.parentNode);
      }
    });
    obs.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['class']
    });
  }

  /* ---------- 2. 品牌页脚 ---------- */
  function toolName() {
    var t = (document.title || '').replace(/^\s*Bgu\s*[\u00b7:：\-\u2014]*\s*/i, '').trim();
    return t || '\u5de5\u5177\u7bb1\u5de5\u5177';
  }
  function addFooter() {
    if (!document.body || document.getElementById('bguFooter')) return;
    var f = document.createElement('div');
    f.id = 'bguFooter';
    f.className = 'tb-footer';
    f.innerHTML = '<b>Bgu \u5de5\u5177\u7bb1</b>'
      + '<span class="tb-sep">\u00b7</span>' + toolName()
      + '<span class="tb-sep">\u00b7</span>'
      + '<span class="tb-tip">\u4f7f\u7528\u4e2d\u9047\u5230\u95ee\u9898\uff1a'
      + '\u6253\u5f00\u6839\u76ee\u5f55\u300c\u5de5\u5177\u7bb1\u5408\u96c6\u300d'
      + ' \u2192 \u7cfb\u7edf\u5de5\u5177 \u2192\u300c\u95ee\u9898\u53cd\u9988\u6536\u96c6\u300d</span>';
    document.body.appendChild(f);
  }

  /* ---------- 3. 「📁 默认」输出目录按钮（统一默认输出目录约定） ---------- */
  var OUT_RE = /(输出|目的地|目标)(目录|文件夹)/;
  var SKIP_RE = /留空|不用|无需|目标(筛选列|列)/;

  function labelBlob(inp) {
    var lab = '';
    var row = inp.closest ? inp.closest('.row') : null;
    if (row) { var l = row.querySelector('label'); if (l) lab = l.textContent || ''; }
    return (lab + ' ' + (inp.getAttribute('placeholder') || '')).trim();
  }
  function isOutField(inp) {
    if (inp.type && inp.type !== 'text') return false;
    var blob = labelBlob(inp);
    if (!OUT_RE.test(blob)) return false;
    if (SKIP_RE.test(blob)) return false;
    return true;
  }
  function pickSourceDir(inp) {
    var sel = 'input[type=text], input:not([type])';
    var card = inp.closest ? inp.closest('.card') : null;
    var groups = [], i, v;
    if (card) groups.push(card.querySelectorAll(sel));
    groups.push(document.querySelectorAll(sel));
    for (var g = 0; g < groups.length; g++) {
      for (i = 0; i < groups[g].length; i++) {
        var el = groups[g][i];
        if (el === inp) continue;
        v = (el.value || '').trim();
        if (v && /[\\\/]/.test(v)) return v;
      }
    }
    return '';
  }
  async function fillDefault(inp) {
    var api = window.pywebview && window.pywebview.api;
    if (!api || !api.suggest_out_dir) { alert('默认目录接口未就绪，请稍候再点（或重开本工具）'); return; }
    var d = '';
    try { d = await api.suggest_out_dir(pickSourceDir(inp) || null); } catch (e) { d = ''; }
    if (d && typeof d === 'object') d = d.result || d.path || '';
    if (!d) { alert('未能获取建议目录'); return; }
    inp.value = d;
    try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
  }
  function addOutButtons() {
    var sel = 'input[type=text], input:not([type])';
    var list = document.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) {
      var inp = list[i];
      if (inp.getAttribute('data-tb-out') === '1' || !isOutField(inp)) continue;
      inp.setAttribute('data-tb-out', '1');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tb-outbtn';
      btn.textContent = '\u{1F4C1} 默认';
      btn.title = '按「源文件夹\\工具箱输出\\时间戳」自动填一个输出目录（填完仍可修改）';
      btn.style.cssText = 'padding:7px 12px;margin-left:6px;font-size:12px;white-space:nowrap;'
        + 'border:1px solid #cfd8dc;background:#eceff1;color:#37474f;border-radius:6px;'
        + 'cursor:pointer;font-family:"Microsoft YaHei",inherit;';
      btn.__tbInput = inp;
      btn.addEventListener('click', function (e) { fillDefault(e.currentTarget.__tbInput); });
      if (inp.parentNode) inp.parentNode.insertBefore(btn, inp.nextSibling);
    }
  }

  function boot() {
    try { addFooter(); } catch (e) {}
    try { observe(); } catch (e) {}
    try { addOutButtons(); } catch (e) {}
    /* 部分工具的动态字段稍后生成，补扫两次 */
    setTimeout(function () { try { addOutButtons(); } catch (e) {} }, 800);
    setTimeout(function () { try { addOutButtons(); } catch (e) {} }, 2200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

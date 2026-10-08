/* 工具箱统一：右下角「操作指引」悬浮按钮（open_guide API 由 _webui.py 注入） */
(function () {
  function add() {
    if (document.getElementById('bguGuideBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'bguGuideBtn';
    btn.type = 'button';
    btn.textContent = '\u{1F4D6} 操作指引';
    btn.title = '打开本工具的操作指引 PDF';
    btn.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;padding:8px 14px;' +
      'border:1px solid #0D47A1;background:#1565C0;color:#fff;border-radius:18px;font-size:12px;' +
      'font-family:"Microsoft YaHei",inherit;cursor:pointer;opacity:.88;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.25);';
    btn.onmouseenter = function () { btn.style.opacity = '1'; };
    btn.onmouseleave = function () { btn.style.opacity = '.88'; };
    btn.addEventListener('click', async function () {
      var api = window.pywebview && window.pywebview.api;
      if (!api || !api.open_guide) { alert('操作指引接口未就绪，请稍候再点（或重开本工具）'); return; }
      try {
        var r = await api.open_guide();
        var bad = (r !== 'ok') && !(r && r.result === 'ok');
        if (bad) alert((typeof r === 'string') ? r : ((r && r.error) || '打开失败'));
      } catch (e) { alert('打开失败：' + e); }
    });
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();

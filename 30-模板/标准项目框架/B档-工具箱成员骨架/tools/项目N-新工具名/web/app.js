// 多Excel合并汇总 — 网页逻辑
// 惯例（出处：项目27 app.js）：$() 简写、setStatus 统一出口、async/await 调 api、
// 运行期间禁用按钮防连点、完成后显示「📂 打开结果文件夹」
function $(id) { return document.getElementById(id); }
function setStatus(msg, cls) {
  var s = $('status'); s.textContent = msg;
  s.className = 'status' + (cls ? ' ' + cls : '');   // ✅❌⏳ 图标由母版自动缀，不许写进文字
}

// ── Python 引擎的回调通道（webui_main.py 用 evaluate_js 调到这里）──
window.__onProgress = function (done, total, msg) {
  if (total > 0) {
    $('progressCard').style.display = 'block';
    $('progressBar').style.width = Math.round(done / total * 100) + '%';
    $('progressText').textContent = msg || '';
  }
  if (msg) setStatus(msg, 'busy');
};
window.__onDone = function (r) {
  if (r.success) {
    $('resultCard').style.display = 'block';
    $('resultInfo').innerHTML =
      '✅ 合并完成：' + r.files + ' 个文件 → ' + r.rows + ' 行<br>输出：<code>' + r.output + '</code>';
    $('btnOpen').style.display = 'inline-block';
    $('btnOpen').dataset.path = r.output;
    setStatus('完成', 'ok');
  } else {
    // 错误展示三要素：发生什么 + 建议怎么办（后端一定带 suggestion）
    $('resultInfo').innerHTML = '<span style="color:#C62828">❌ ' + r.error + '</span>' +
      (r.suggestion ? '<br><span style="color:#6b7280">建议：' + r.suggestion + '</span>' : '');
    $('resultCard').style.display = 'block';
    setStatus('失败', 'err');
  }
  $('btnRun').disabled = false;
};

$('btnBrowse').addEventListener('click', async function () {
  if (!window.pywebview || !window.pywebview.api) { setStatus('环境未就绪，请稍候再点', 'err'); return; }
  try {
    var r = await window.pywebview.api.choose_folder();
    if (!r.success) { setStatus(r.error, 'err'); return; }
    $('folderPath').value = r.path;
    $('btnRun').disabled = false;
    setStatus('已选择文件夹，可以开始', 'ok');
  } catch (e) { setStatus('选择失败：' + e, 'err'); }
});

$('btnRun').addEventListener('click', async function () {
  var folder = $('folderPath').value.trim();
  if (!folder) { setStatus('请先选择源文件夹', 'err'); return; }
  this.disabled = true;                      // 防连点
  $('resultCard').style.display = 'none';
  setStatus('启动中…', 'busy');
  try {
    var r = await window.pywebview.api.run_merge(folder, $('outDir').value.trim());
    if (!r.success) { setStatus('启动失败：' + r.error, 'err'); this.disabled = false; }
    // 成功后等 __onDone 回调
  } catch (e) { setStatus('异常：' + e, 'err'); this.disabled = false; }
});

$('btnOpen').addEventListener('click', async function () {
  if (this.dataset.path) await window.pywebview.api.open_folder(this.dataset.path);
});

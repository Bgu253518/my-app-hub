/**
 * My App Hub — 私有应用中心
 * 主密码保护 + API密钥加密存储
 */
const App = (() => {
  const STORAGE_KEY = {
    PASS_HASH: '_apphub_phash',
    PASSPORT: '_apphub_pp',   // encrypted passport (contains all keys)
    LOCK_TIMER: '_apphub_lock'
  };

  // Key names for the passport
  const KEY_NAMES = ['anthropic', 'openai', 'custom'];

  // ========== DOM ==========
  const $lockScreen = document.getElementById('lockScreen');
  const $lockForm    = document.getElementById('lockForm');
  const $setupForm   = document.getElementById('setupForm');
  const $unlockBtn   = document.getElementById('unlockBtn');
  const $setupBtn    = document.getElementById('setupBtn');
  const $masterPw    = document.getElementById('masterPassword');
  const $newPw       = document.getElementById('newPassword');
  const $confirmPw   = document.getElementById('confirmPassword');
  const $lockMsg     = document.getElementById('lockMsg');
  const $mainApp     = document.getElementById('mainApp');
  const $lockBtn     = document.getElementById('lockBtn');
  const $logoutBtn   = document.getElementById('logoutBtn');

  // ========== State ==========
  let masterPassword = '';
  let passport = {};  // { anthropic: 'sk-...', openai: 'sk-...', custom: '...' }
  let autoLockTimer = null;
  const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes idle auto-lock

  // ========== Init ==========
  async function init() {
    const storedHash = localStorage.getItem(STORAGE_KEY.PASS_HASH);
    if (storedHash) {
      $lockForm.classList.remove('hidden');
      $setupForm.classList.add('hidden');
    } else {
      $lockForm.classList.add('hidden');
      $setupForm.classList.remove('hidden');
    }
    // Enter key to submit
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (!$setupForm.classList.contains('hidden')) doSetup();
        else if (!$lockForm.classList.contains('hidden')) doUnlock();
      }
    });
    $unlockBtn.addEventListener('click', doUnlock);
    $setupBtn.addEventListener('click', doSetup);
    $lockBtn.addEventListener('click', lock);
    $logoutBtn.addEventListener('click', logout);
    setupApiKeyUI();
    setupAppLauncher();
    document.getElementById('appRunnerClose').addEventListener('click', closeApp);
    resetAutoLock();
  }

  // ========== Setup (first time) ==========
  async function doSetup() {
    const pw = $newPw.value;
    const confirm = $confirmPw.value;
    $lockMsg.className = 'msg';
    if (pw.length < 6) {
      $lockMsg.textContent = '密码至少需要6位';
      $lockMsg.className = 'msg error';
      return;
    }
    if (pw !== confirm) {
      $lockMsg.textContent = '两次输入密码不一致';
      $lockMsg.className = 'msg error';
      return;
    }
    const hash = await CryptoHelper.sha256(pw);
    localStorage.setItem(STORAGE_KEY.PASS_HASH, hash);
    $lockMsg.textContent = '主密码创建成功！正在进入...';
    $lockMsg.className = 'msg success';
    masterPassword = pw;
    await savePassport();
    unlockUI();
  }

  // ========== Unlock ==========
  async function doUnlock() {
    const pw = $masterPw.value;
    if (!pw) return;
    const storedHash = localStorage.getItem(STORAGE_KEY.PASS_HASH);
    const hash = await CryptoHelper.sha256(pw);
    if (hash !== storedHash) {
      $lockMsg.textContent = '密码错误，请重试';
      $lockMsg.className = 'msg error';
      return;
    }
    masterPassword = pw;
    await loadPassport();
    unlockUI();
    $lockMsg.className = 'msg';
  }

  function unlockUI() {
    $lockScreen.classList.add('hidden');
    $mainApp.classList.remove('hidden');
    loadKeysIntoInputs();
    updateKeyStatuses();
    $masterPw.value = '';
    $newPw.value = '';
    $confirmPw.value = '';
    resetAutoLock();
  }

  function lock() {
    masterPassword = '';
    passport = {};
    $mainApp.classList.add('hidden');
    $lockScreen.classList.remove('hidden');
    $lockMsg.textContent = '';
    $lockMsg.className = 'msg';
  }

  function logout() {
    if (confirm('确定要清除所有数据吗？这将删除保存的API密钥和主密码。')) {
      Object.values(STORAGE_KEY).forEach(k => localStorage.removeItem(k));
      masterPassword = '';
      passport = {};
      $mainApp.classList.add('hidden');
      $lockScreen.classList.remove('hidden');
      $lockForm.classList.add('hidden');
      $setupForm.classList.remove('hidden');
      $lockMsg.textContent = '';
      $lockMsg.className = 'msg';
      document.querySelectorAll('.key-input-group input').forEach(el => el.value = '');
    }
  }

  // ========== Passport (encrypted key store) ==========
  async function savePassport() {
    const json = JSON.stringify(passport);
    const enc = await CryptoHelper.encrypt(json, masterPassword);
    localStorage.setItem(STORAGE_KEY.PASSPORT, enc);
  }

  async function loadPassport() {
    const enc = localStorage.getItem(STORAGE_KEY.PASSPORT);
    if (!enc) { passport = {}; return; }
    const json = await CryptoHelper.decrypt(enc, masterPassword);
    if (json === null) { passport = {}; return; }
    try { passport = JSON.parse(json); } catch { passport = {}; }
  }

  // ========== Auto Lock ==========
  function resetAutoLock() {
    clearTimeout(autoLockTimer);
    autoLockTimer = setTimeout(() => {
      if (masterPassword) {
        lock();
        localStorage.setItem(STORAGE_KEY.LOCK_TIMER, Date.now().toString());
      }
    }, AUTO_LOCK_MS);
    // Reset on any user activity
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev =>
      document.addEventListener(ev, resetAutoLock, { once: true, passive: true })
    );
  }

  // ========== API Key UI ==========
  function setupApiKeyUI() {
    document.getElementById('apiKeys').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const saveKey = btn.dataset.save;
      const toggleKey = btn.dataset.toggle;
      if (saveKey) saveApiKey(saveKey);
      if (toggleKey) toggleKeyVisibility(toggleKey);
    });
  }

  async function saveApiKey(name) {
    const input = document.getElementById(name + 'Key');
    const val = input.value.trim();
    if (val) {
      passport[name] = val;
    } else {
      delete passport[name];
    }
    await savePassport();
    updateKeyStatuses();
    showToast('✅ API Key 已加密保存');
  }

  function toggleKeyVisibility(name) {
    const input = document.getElementById(name + 'Key');
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  function loadKeysIntoInputs() {
    KEY_NAMES.forEach(name => {
      const input = document.getElementById(name + 'Key');
      if (input && passport[name]) input.value = passport[name];
    });
  }

  function updateKeyStatuses() {
    KEY_NAMES.forEach(name => {
      const el = document.querySelector(`[data-key="${name}"]`);
      if (el) el.textContent = passport[name] ? '已配置 ✅' : '未配置';
    });
  }

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      Object.assign(toast.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        background: '#2a2a3a', color: '#fff', padding: '12px 24px',
        borderRadius: '10px', fontSize: '14px', zIndex: '999',
        transition: 'opacity 0.3s', opacity: '0'
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => toast.style.opacity = '0', 2000);
  }

  // ========== App Launcher ==========
  function setupAppLauncher() {
    document.querySelector('.apps-grid').addEventListener('click', e => {
      const card = e.target.closest('.app-card');
      if (!card) return;
      const action = card.dataset.action;
      const src = card.dataset.src;
      const appName = card.dataset.app;
      if (action === 'launch' && src) {
        launchApp(appName, src, card.querySelector('h3')?.textContent || appName);
      } else if (!action) {
        showToast('📢 ' + (card.querySelector('h3')?.textContent || '此应用') + ' 即将推出');
      }
    });
  }

  function launchApp(appId, src, title) {
    const runner = document.getElementById('appRunner');
    const frame = document.getElementById('appFrame');
    const titleEl = document.getElementById('appRunnerTitle');
    document.getElementById('apiPanel').classList.add('hidden');
    document.getElementById('appRunner').previousElementSibling?.classList.add('hidden');
    // Hide the apps panel
    document.querySelector('.apps-grid').parentElement.classList.add('hidden');
    titleEl.textContent = title;
    frame.src = src;
    runner.classList.remove('hidden');
    runner.scrollIntoView({ behavior: 'smooth' });
  }

  function closeApp() {
    const runner = document.getElementById('appRunner');
    const frame = document.getElementById('appFrame');
    frame.src = '';
    runner.classList.add('hidden');
    document.getElementById('apiPanel').classList.remove('hidden');
    document.querySelector('.apps-grid').parentElement.classList.remove('hidden');
  }

  // ========== Public API ==========
  return {
    init,
    getKey(name) { return passport[name] || null; },
    getMasterPassword() { return masterPassword; },
    isUnlocked() { return !!masterPassword; }
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());

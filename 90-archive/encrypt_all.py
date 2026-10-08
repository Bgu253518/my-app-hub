# -*- coding: utf-8 -*-
import os, hashlib

PASSWORD_HASH = "5f6f2138aac618ff50a0751b76144e91468d5139ee38db42b0947ba123e37aaf"
TARGET_DIR = r"C:\Users\86152\my-app-hub"

PWD_SCRIPT = f"""<script>
(function() {{
  if (sessionStorage.getItem('myapp_unlocked')) return;
  var overlay = document.createElement('div');
  overlay.id = 'pwd-overlay';
  overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0a0a1a;z-index:999999;display:flex;align-items:center;justify-content:center;"><div style="background:#16213e;padding:40px;border-radius:16px;border:1px solid #D2691E;max-width:360px;width:90%%;text-align:center;"><div style="font-size:40px;margin-bottom:10px;">🔒</div><h2 style="color:#D2691E;margin-bottom:12px;font-size:18px;">请输入密码</h2><input type="password" id="pwd-input" style="width:100%%;padding:12px;border-radius:8px;border:1px solid #3a3a5a;background:#0f3460;color:#e0e0e0;font-size:16px;text-align:center;box-sizing:border-box;" placeholder="输入密码" autofocus><button id="pwd-btn" style="margin-top:12px;width:100%%;padding:10px;border:none;border-radius:8px;background:#D2691E;color:#fff;font-size:15px;cursor:pointer;">解锁</button><p id="pwd-error" style="color:#c62828;font-size:13px;margin-top:8px;display:none;">密码错误，请重试</p></div></div>';
  document.documentElement.appendChild(overlay);
  
  async function checkPwd() {{
    var pwd = document.getElementById('pwd-input').value;
    var buf = new TextEncoder().encode(pwd);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    var hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
    if (hex === '{PASSWORD_HASH}') {{
      sessionStorage.setItem('myapp_unlocked', '1');
      overlay.style.display = 'none';
    }} else {{
      document.getElementById('pwd-error').style.display = 'block';
    }}
  }}
  
  document.getElementById('pwd-btn').onclick = checkPwd;
  document.getElementById('pwd-input').onkeydown = function(e) {{
    if (e.key === 'Enter') checkPwd();
  }};
}})();
</script>"""

def inject_password(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'pwd-overlay' in content:
        return False
    if '</head>' in content:
        content = content.replace('</head>', PWD_SCRIPT + '\n</head>')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    if '<body' in content:
        content = content.replace('<body', PWD_SCRIPT + '\n<body')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for fname in sorted(os.listdir(TARGET_DIR)):
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(TARGET_DIR, fname)
    if inject_password(fpath):
        print(f"  🔒 {fname}")
        count += 1
    else:
        print(f"  ⏭️ {fname}")

print(f"\n✅ 共加密 {count} 个 HTML 文件")
print(f"🔑 密码：Asd#522128")

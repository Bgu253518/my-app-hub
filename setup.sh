#!/bin/bash
# My App Hub - 一键部署脚本 (Mac/Linux)
set -e

echo ""
echo "   ╔══════════════════════════════════════════╗"
echo "   ║     My App Hub - 一键部署脚本           ║"
echo "   ║     私有应用中心 · 跨电脑自动部署       ║"
echo "   ╚══════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$HOME/my-app-hub"

# ---- 检测 Node.js ----
if command -v node &>/dev/null; then
    echo "   ✓ Node.js 已安装: $(node -v)"
else
    echo "   ✗ Node.js 未安装, 正在安装..."
    if command -v brew &>/dev/null; then
        brew install node
    elif command -v apt-get &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "   请手动安装 Node.js: https://nodejs.org"
        exit 1
    fi
    echo "   ✓ Node.js 安装完成"
fi

# ---- 检测 Git ----
if command -v git &>/dev/null; then
    echo "   ✓ Git 已安装: $(git --version)"
else
    echo "   ✗ Git 未安装, 正在安装..."
    if command -v brew &>/dev/null; then
        brew install git
    elif command -v apt-get &>/dev/null; then
        sudo apt-get install -y git
    else
        echo "   请手动安装 Git: https://git-scm.com"
        exit 1
    fi
    echo "   ✓ Git 安装完成"
fi

# ---- 克隆/更新项目 ----
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "   → 项目已存在，正在更新..."
    cd "$PROJECT_DIR"
    git pull origin main --rebase 2>/dev/null || git pull origin master --rebase 2>/dev/null || echo "   无法更新"
else
    echo "   → 正在克隆项目..."
    git clone https://github.com/bgu253518/my-app-hub.git "$PROJECT_DIR" 2>/dev/null || {
        echo "   ✗ 克隆失败，请检查网络"
        exit 1
    }
fi

cd "$PROJECT_DIR"

# ---- 安装依赖 ----
if [ -f "package.json" ]; then
    echo "   → 安装 npm 依赖..."
    npm install 2>/dev/null || true
fi

# ---- 创建桌面快捷方式 (Mac) ----
if [[ "$OSTYPE" == "darwin"* ]]; then
    cat > ~/Desktop/启动应用中心.command << 'MACEOF'
#!/bin/bash
cd "$HOME/my-app-hub"
open http://localhost:3456
npx http-server . -p 3456 -c-1 -s 2>/dev/null || open index.html
MACEOF
    chmod +x ~/Desktop/启动应用中心.command
fi

echo ""
echo "   ╔══════════════════════════════════════════╗"
echo "   ║        部署完成！正在启动应用...       ║"
echo "   ╚══════════════════════════════════════════╝"
echo ""
echo "   运行: cd $PROJECT_DIR && npx http-server . -p 3456"
echo "   然后浏览器打开: http://localhost:3456"

# 启动
if command -v npx &>/dev/null; then
    npx http-server "$PROJECT_DIR" -p 3456 -c-1 -s &
    sleep 2
    if command -v open &>/dev/null; then
        open "http://localhost:3456"
    elif command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:3456"
    fi
fi

echo ""
echo "   按 Enter 退出..."
read

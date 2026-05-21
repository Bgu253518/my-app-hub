# My App Hub — 顾力菡的应用工坊

## 概述
个人工具应用集，部署在 GitHub Pages：`https://bgu253518.github.io/my-app-hub/`
GitHub 仓库：`https://github.com/Bgu253518/my-app-hub`
本地路径：`C:\Users\86152\my-app-hub`

## 用户偏好
- **语言**：始终用中文回复
- **推送方式**：SSH（git@github.com:Bgu253518/my-app-hub.git），SSH Key 已配置在 GitHub 账户
- **GitHub Token**：用户的 Personal Access Token（用于 API 操作，每次对话需重新提供）
- **服务器**：Python Flask 后端（server.py + start-server.bat），数据库 gdc_data.db
- **浏览器**：360浏览器（可能存在兼容性问题，建议用 Chrome）

## 架构
- **主站**: `index.html` — 单页应用，通过 `apps.json` 加载工具列表
- **数据源**: `apps.json?v=10`（缓存版本持续递增）
- **部署方式**：git push origin main → GitHub Pages 自动发布
- **文件结构**：每个工具独立文件夹（中文命名），对应 HTML 文件在文件夹内

## 技术栈
- 纯前端（HTML + CSS + JS），无框架
- Chart.js CDN 做图表 (`cdn.jsdelivr.net/npm/chart.js@4.4.0`)
- SheetJS CDN 做 Excel 读写 (`cdn.sheetjs.com/xlsx-0.20.1`)
- 后端：Flask + SQLite（团队模式）

## 📁 文件结构（按工具分文件夹）

```
my-app-hub/
├── index.html                    # 主入口
├── apps.json                     # 工具配置清单
├── CLAUDE.md / README.md         # 文档
├── 使用说明与操作指引/             → help.html
├── 审计抽凭助手/                   → audit-sampling.html
├── TB自动上数器/                   → tb-autofill.html
├── BKD底稿滚存与上数助手/          → bkd-rollforward.html
├── Word报告上数与校验工作台/        → word-checkbench.html
├── GDC审计任务工时管理系统/         → gdc-task-system.html
├── 智能待办/                       → smart-todo.html
├── 批量文件重命名工具/              → file-renamer.html
├── CSV数据清洗器/                  → data-cleaner.html
├── 图片批量压缩工具/               → image-toolbox.html
├── 日志分析器/                     → log-analyzer.html
├── PDF多功能工具箱                 （内联在 index.html）
├── ROU租赁测算器/                  → rou-calculator.html
├── 应收账款账龄分析                 （内联在 index.html）
├── Excel多文件合并工具/            → excel-merger.html
├── 文件批量提取工具/               → file-collector.html
├── 智能筛选汇总工具/               → smart-filter.html
├── 批量解压工具/                   → batch-unzip.html
├── 五虾流水线/                     → 五虾流水线.html
├── 信用评级查询/                   → rating_tool.html + rating_server.py
├── Claude Code个人配置/            → claude-setup-tool.html
```

### ❌ 已删除
- 审计项目工时任务协同系统（audit-hub.html）
- weather-cli（命令行天气预报）
- todo-web（简易待办事项Web应用）
- ai-todo（智能待办解析器 — 功能已合并到 smart-todo.html）

## 待处理
- PDF多功能工具箱 → 增加 PDF转Excel 功能（文本型表格PDF，非扫描件）
- server-guide.html 需要添加内容

## 注意事项
- GitHub HTTPS 经常连不上，用 SSH push
- 所有工具均为纯浏览器端处理，数据不离开用户电脑
- 每个工具独立文件夹（中文命名），新工具上线时：创建文件夹 → 放入 HTML → 更新 apps.json → 更新 index.html externalPages 路径 → 缓存版本号+1
- index.html 中 externalPages 路径已更新为中文文件夹路径

# 🦞 我的工具库 - My App Hub

个人工具库网站（GitHub Pages）：https://bgu253518.github.io/my-app-hub/

> 根目录按 `01-` ~ `90-` 编号排序：01-19 是工具文件夹，20-23 是网站页面，50-59 是基础设施，90 是归档。

## 🗺️ 网站结构

| 页面 | 作用 |
|------|------|
| `index.html` | 入口首页（卡片 + 分类分区 + 内联工具） |
| `20-dww-tools.html` | DWW 工具合集下钻页（26 工具介绍 + **下载按钮**） |
| `21-app-slide.html` | 工具板块交付演示页 |
| `22-help.html` / `19-使用说明与操作指引/help.html` | 使用说明手册 |
| `23-feedback.html` | 问题反馈收集页 |

首页卡片数据来自 `apps.json`（顺序即展示顺序）：

1. 🧰 DWW 常用工具合集（v1.1，Release 下载）
2. 📊 ROU 租赁管理系统（Release 下载）
3. 🧭 Levvia 指引执行助手（Release 下载）
4. 🧠 TB 智能上数器（在线使用，wip）
5. 💬 问题反馈收集器（Release 下载）

## 📂 仓库目录（编号排序）

```
my-app-hub/
├── 01-审计抽凭助手/          ← MUS 随机抽样 / 单家批量双模式
├── 02-TB自动上数器/          ← TB 智能上数（密码保护）
├── 03-BKD底稿滚存与上数助手/   ← BKD 滚存（密码保护）
├── 04-Word报告上数与校验工作台/ ← Word 上数校验（密码保护）
├── 05-GDC审计任务工时管理系统/
├── 06-ROU租赁测算器/
├── 07-CSV数据清洗器/
├── 08-Excel多文件合并工具/
├── 09-智能筛选汇总工具/
├── 10-批量文件重命名工具/
├── 11-批量解压工具/
├── 12-文件批量提取工具/
├── 13-图片批量压缩工具/
├── 14-五虾流水线/            ← 自媒体视频流水线
├── 15-信用评级查询/           ← 需本地启动服务
├── 16-Claude Code个人配置/
├── 17-智能待办/
├── 18-视频拆解工具/           ← 含 server.py
├── 19-使用说明与操作指引/
├── 20-dww-tools.html         ← DWW 合集页（含下载按钮）
├── 21-app-slide.html
├── 22-help.html
├── 23-feedback.html
├── 50-screenshots/           ← 首页截图（被 index.html 引用）
├── 51-public/ 52-render_output/ 53-workflow/ 54-projects/
├── 55-remotion-render/ 56-ai-video-template/   ← AI 视频工程
├── 57-tools/ 58-scripts/ 59-src/              ← 辅助脚本
├── 90-archive/               ← 归档（散装脚本、AI 视频残留、本地批处理）
├── index.html / apps.json    ← 首页与卡片数据
├── CLAUDE.md / README.md / .nojekyll
```

## 📦 Release 分发（大文件不进仓库）

| Release | 内容 |
|---------|------|
| [DWW-toolkit-v1.1](https://github.com/Bgu253518/my-app-hub/releases/tag/DWW-toolkit-v1.1) | DWW 工具合集 v1.1（约 139MB，网页下载按钮指向这里） |
| [extras-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/extras-v1.0) | 工具箱外独立工具合集（11 项，仅 Release 提供下载） |
| [ROU-lease-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/ROU-lease-v1.0) | ROU 租赁管理系统独立包 |
| [Levvia-guide-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/Levvia-guide-v1.0) | Levvia 指引执行助手独立包 |
| [Feedback-collector-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/Feedback-collector-v1.0) | 问题反馈收集器独立包 |

## 🚀 信用评级查询工具启动

```
cd 15-信用评级查询/
python rating_server.py
浏览器打开 http://localhost:5000
```

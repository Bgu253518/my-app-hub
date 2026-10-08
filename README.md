# 🦞 我的工具库 - My App Hub

个人工具库网站（GitHub Pages）：https://bgu253518.github.io/my-app-hub/

## 🗺️ 网站结构

| 页面 | 作用 |
|------|------|
| `index.html` | 入口首页（卡片 + 分类分区 + 内联工具） |
| `dww-tools.html` | DWW 工具合集下钻页（26 工具介绍 + **下载按钮**） |
| `app-slide.html` | 工具板块交付演示页 |
| `help.html` / `使用说明与操作指引/help.html` | 使用说明手册 |
| `feedback.html` | 问题反馈收集页 |

首页卡片数据来自 `apps.json`（顺序即展示顺序）：

1. 🧰 DWW 常用工具合集（v1.1，Release 下载）
2. 📊 ROU 租赁管理系统（Release 下载）
3. 🧭 Levvia 指引执行助手（Release 下载）
4. 🧠 TB 智能上数器（在线使用，wip）
5. 💬 问题反馈收集器（Release 下载）

## 📂 仓库目录

```
my-app-hub/
├── index.html / apps.json        ← 首页与卡片数据
├── dww-tools.html                ← DWW 合集下钻页（含下载按钮）
├── app-slide.html / help.html / feedback.html
├── <18 个工具文件夹>/             ← 每个文件夹一个独立工具页面
│   （审计抽凭助手、TB自动上数器、ROU租赁测算器、智能待办、批量解压工具……）
├── screenshots/                  ← 首页截图（被 index.html 引用）
├── archive/                      ← 归档：散装脚本、AI 视频工作流残留、本地批处理
├── tools/  scripts/  src/        ← 辅助脚本（Remotion 视频工程代码）
├── public/  render_output/  workflow/  projects/  remotion-render/  ai-video-template/
├── CLAUDE.md / README.md         ← 文档
└── .nojekyll
```

## 📦 Release 分发（大文件不进仓库）

| Release | 内容 |
|---------|------|
| [DWW-toolkit-v1.1](https://github.com/Bgu253518/my-app-hub/releases/tag/DWW-toolkit-v1.1) | DWW 工具合集 v1.1（约 139MB，网页下载按钮指向这里） |
| [extras-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/extras-v1.0) | 工具箱外独立工具合集（11 项，仅 Release 提供下载） |
| [ROU-lease-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/ROU-lease-v1.0) | ROU 租赁管理系统独立包 |
| [Levvia-guide-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/Levvia-guide-v1.0) | Levvia 指引执行助手独立包 |
| [Feedback-collector-v1.0](https://github.com/Bgu253518/my-app-hub/releases/tag/Feedback-collector-v1.0) | 问题反馈收集器独立包 |

## 🛠️ 工具文件夹清单

### 审计类
审计抽凭助手、TB 自动上数器、BKD 底稿滚存与上数助手、Word 报告上数与校验工作台、GDC 审计任务工时管理系统、ROU 租赁测算器

### 数据 / Excel 类
CSV 数据清洗器、Excel 多文件合并工具、智能筛选汇总工具

### 文件管理类
批量文件重命名工具、批量解压工具、文件批量提取工具、图片批量压缩工具

### AI / 创作类
五虾流水线、信用评级查询（需本地启动服务）、Claude Code 个人配置

### 其他
智能待办、视频拆解工具（含 server.py）、使用说明与操作指引

### 内联工具（在 index.html 中，无独立文件）
PDF 多功能工具箱、应收账款账龄分析

## 🚀 信用评级查询工具启动

```
cd 信用评级查询/
python rating_server.py
浏览器打开 http://localhost:5000
```

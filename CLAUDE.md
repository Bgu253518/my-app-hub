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
- **数据源**: `apps.json?v=6`（缓存版本持续递增）
- **部署方式**：git push origin main → GitHub Pages 自动发布

## 技术栈
- 纯前端（HTML + CSS + JS），无框架
- Chart.js CDN 做图表 (`cdn.jsdelivr.net/npm/chart.js@4.4.0`)
- SheetJS CDN 做 Excel 读写 (`cdn.sheetjs.com/xlsx-0.20.1`)
- 后端：Flask + SQLite（团队模式）

## 当前已上线工具（共14个）
### ✅ 已完成 & 完整上线
1. **📄 PDF多功能工具箱** — pdf-lib + pdf.js（合并/拆分/提取/加密/解密）
2. **🖼️ 图片批量压缩工具** — 压缩/转PDF/HEIC转换（image-toolbox.html）
3. **🧹 CSV数据清洗器** — 去空格/去重/标准化日期数字/填充空值（data-cleaner.html）
4. **📝 批量文件重命名工具** — 查找替换/序号/模板（file-renamer.html）
5. **📊 ROU租赁测算器** — CAS 21/IFRS 16（rou-calculator.html）
6. **🎯 审计抽凭助手** — MUS/随机抽样双模式（audit-sampling.html）
7. **📊 TB自动上数器** — 科目映射/自动填入/借贷校验（tb-autofill.html）
8. **📋 BKD底稿滚存与上数助手** — 期末→期初（bkd-rollforward.html）
9. **📊 Word报告上数与校验工作台** — 附注表格上数/加计校验（word-checkbench.html）
10. **📋 GDC审计任务工时管理系统** — 4步闭环+团队模式（gdc-task-system.html）
11. **📋 审计项目工时任务协同系统** — 多角色/复核/归档（audit-hub.html）
12. **⚙️ Claude Code个人配置** — 一键配置第三方API（claude-setup-tool.html）
13. **🤖 离线AI助手** — 纯本地润色/翻译/总结（offline-ai.html）
14. **📋 智能待办** — AI解析/桌面提醒/邮件识别（smart-todo.html）
15. **📋 日志分析器** — Nginx/Apache/JSON日志可视化（log-analyzer.html）
16. **📖 使用说明与操作指引** — 完整操作手册/可导出PDF（help.html）

### ❌ 已删除
- weather-cli（命令行天气预报）
- todo-web（简易待办事项Web应用）
- ai-todo（智能待办解析器 — 功能已合并到 smart-todo.html）

## 待处理
- PDF多功能工具箱 → 增加 PDF转Excel 功能（文本型表格PDF，非扫描件）
- server-guide.html 需要添加内容

## 注意事项
- GitHub HTTPS 经常连不上，用 SSH push
- 所有工具均为纯浏览器端处理，数据不离开用户电脑
- index.html 约 2800+ 行，修改时注意函数名冲突和缓存版本号递增
- 新工具上线需同步更新：apps.json → index.html externalPages → 缓存版本号+1

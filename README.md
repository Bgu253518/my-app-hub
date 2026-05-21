# 🦞 我的工具库 - My App Hub

个人自助工具合集，全部双击即用。

## 📂 文件结构

```
my-app-hub/
├── index.html                    ← 入口首页
├── apps.json                     ← 工具配置清单
├── CLAUDE.md / README.md         ← 文档
│
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
├── ROU租赁测算器/                  → rou-calculator.html
├── Excel多文件合并工具/            → excel-merger.html
├── 文件批量提取工具/               → file-collector.html
├── 智能筛选汇总工具/               → smart-filter.html
├── 批量解压工具/                   → batch-unzip.html
├── 五虾流水线/                     → 五虾流水线.html
├── 信用评级查询/                   → rating_tool.html + rating_server.py
├── Claude Code个人配置/            → claude-setup-tool.html
│
├── tools/                        ← 辅助 Python 脚本
├── archive/                      ← 归档
└── *.py / *.bat                  ← 其他脚本
```

## 🛠️ 工具清单

### 审计类
| 工具 | 文件夹 |
|------|--------|
| 审计抽凭助手 | `审计抽凭助手/` |
| TB 自动上数器 | `TB自动上数器/` |
| BKD 底稿滚存 | `BKD底稿滚存与上数助手/` |
| Word 校验工作台 | `Word报告上数与校验工作台/` |
| GDC 工时管理系统 | `GDC审计任务工时管理系统/` |
| ROU 租赁测算 | `ROU租赁测算器/` |

### AI / 创作类
| 工具 | 文件夹 |
|------|--------|
| 五虾流水线（自媒体） | `五虾流水线/` |
| 信用评级查询 | `信用评级查询/` |
| Claude Code 配置 | `Claude Code个人配置/` |
| CSV 数据清洗器 | `CSV数据清洗器/` |

### 实用工具
| 工具 | 文件夹 |
|------|--------|
| 批量文件重命名 | `批量文件重命名工具/` |
| 图片工具箱 | `图片批量压缩工具/` |
| 智能待办 | `智能待办/` |
| 日志分析器 | `日志分析器/` |
| 使用帮助 | `使用说明与操作指引/` |

### 内联工具（在 index.html 中）
- PDF 多功能工具箱
- 应收账款账龄分析

### ❌ 已删除
- 审计项目工时任务协同系统（audit-hub.html）

## 🚀 信用评级查询工具启动
```
cd 信用评级查询/
双击 start_server.bat
浏览器打开 http://localhost:5000
```

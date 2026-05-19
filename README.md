# 🦞 我的工具库 - My App Hub

个人自助工具合集，全部双击即用。

## 📂 文件结构

```
my-app-hub/
├── index.html              ← 入口首页（从这里导航到所有工具）
├── apps.json               ← 工具配置清单
├── CLAUDE.md               ← 项目文档
│
├── *.html                  ← 各工具网页（双击即用，密码：Asd#522128）
├── *.py                    ← Python 工具脚本
├── *.bat                   ← 一键启动脚本
│
├── tools/                  ← 辅助 Python 脚本
├── data/                   ← 数据配置
└── archive/                ← 归档（不常用的旧文件）
```

## 🛠️ 工具清单

### 审计类
| 工具 | 文件 |
|------|------|
| 审计抽凭助手 | `audit-sampling.html` |
| TB 自动上数器 | `tb-autofill.html` |
| BKD 底稿滚存 | `bkd-rollforward.html` |
| Word 校验工作台 | `word-checkbench.html` |
| GDC 工时管理系统 | `gdc-task-system.html` |
| 审计项目协同 | `audit-hub.html` |
| ROU 租赁测算 | `rou-calculator.html` |

### AI / 创作类
| 工具 | 文件 |
|------|------|
| 五虾流水线（自媒体） | `五虾流水线.html` |
| 信用评级查询 | `rating_tool.html` + `rating_server.py` |
| 离线 AI 助手 | `offline-ai.html` |
| Claude Code 配置 | `claude-config.html` |
| CSV 数据清洗器 | `data-cleaner.html` |

### 实用工具
| 工具 | 文件 |
|------|------|
| 批量文件重命名 | `file-renamer.html` |
| 图片工具箱 | `image-toolbox.html` |
| 智能待办 | `smart-todo.html` |
| 日志分析器 | `log-analyzer.html` |
| 服务器指南 | `server-guide.html` |
| 使用帮助 | `help.html` |

## 🔒 密码
所有 HTML 文件统一密码：**Asd#522128**
（输入一次后同浏览器其他页面自动解锁）

## 🚀 信用评级查询工具启动
```
双击 start_server.bat
浏览器打开 http://localhost:5000
```

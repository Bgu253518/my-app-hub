# Claude Code 模块安装工具

Windows 下一键安装 Claude Code 及 MCP 插件的图形化工具。

## 使用方式

双击 `ClaudeCodeSetup.exe`（需要管理员权限），自动检测本地环境后按需安装。

## 功能模块

| 模块 | 说明 |
|------|------|
| Node.js v22.14.0 | JavaScript 运行时环境 |
| npm 镜像源 | 设置为 npmmirror 国内镜像加速 |
| Git v2.48.1 | 版本控制工具 |
| Claude Code CLI | AI 编程助手命令行工具 |
| MCP 插件全家桶 | Filesystem/GitHub/SQLite/Puppeteer 四个插件 |
| API Key | Anthropic 密钥环境变量设置 |

## 特性

- 启动自动检测已安装组件
- 模块化独立安装，互不影响
- 后台异步安装，界面不卡死
- 全部使用国内镜像（npmmirror.com）加速下载
- 删除本文件夹即可完全卸载

## 源码

`ClaudeCodeSetup.ps1` 为 PowerShell WinForms 源码，可用 ps2exe 编译。

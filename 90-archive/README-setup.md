# Claude Code 一键配置工具

快速配置 Claude Code 使用第三方 API 服务商的 Web 工具。

## 工具地址

访问 **[claude-setup-tool.html](https://bgu253518.github.io/my-app-hub/claude-setup-tool.html)** 即可使用。

## 支持的服务商

| 服务商 | 默认模型 | 说明 |
|--------|----------|------|
| **DeepSeek** | deepseek-chat | 国产高性价比大模型 |
| **OpenRouter** | anthropic/claude-sonnet-4-6 | 多模型聚合网关，支持 Claude / GPT / Gemini |
| **阿里云百炼** | qwen-plus | 阿里云 DashScope 平台，支持通义千问系列 |

## 使用步骤

1. 打开 [配置工具页面](https://bgu253518.github.io/my-app-hub/claude-setup-tool.html)
2. 选择你的 API 服务商
3. 输入 API Key（从服务商后台获取）
4. 可选：选择偏好的模型
5. 点击「生成配置脚本」，预览确认后点击「下载 setup.ps1」
6. 在下载目录打开 PowerShell，执行：
   ```powershell
   .\setup.ps1
   ```
7. 关闭当前终端，打开新终端，运行 `claude` 即可

## 环境变量说明

脚本会设置以下用户级环境变量：

| 变量名 | 说明 |
|--------|------|
| `ANTHROPIC_BASE_URL` | API 接口地址 |
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 小型快速模型（可选） |

## 注意事项

- 执行脚本后需要**重新打开终端**，环境变量才会生效
- 如需更换服务商或 API Key，重新生成并运行脚本即可覆盖旧配置
- API Key 请妥善保管，不要分享给他人

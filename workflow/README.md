# AI 视频生成工作流 v2.1

## 备份文件

| 文件 | 内容 |
|------|------|
| `ai-video-generator-v2-full.json` | 完整工作流（含所有节点+连接+Prompt） |
| `ai-video-generator-v2.json` | 工作流描述摘要 |

## 恢复方法

如果画布上的工作流丢失：

1. 打开 Claude Code → 输入 `/cc-workflow-ai-editor`
2. 说："从 ai-video-generator-v2-full.json 恢复工作流"
3. AI 会自动调用 `apply_workflow` 恢复到画布

## 项目目录

```
AI-视频制作/
├── src/Root.tsx              ← Remotion 视频主组件
├── generate_audio.py         ← Edge-TTS 配音
├── analyze_video.py          ← 视频风格分析
├── render.bat                ← 一键渲染
├── setup.bat                 ← 首次环境安装
├── workflow/                 ← 工作流备份
└── out/                      ← 渲染输出
```

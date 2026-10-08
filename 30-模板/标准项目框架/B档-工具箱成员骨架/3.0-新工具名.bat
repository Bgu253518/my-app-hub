@echo off
chcp 936 >nul
rem 3 行启动壳模板：start 内必须是 pythonw（无控制台窗口），路径全部用 %~dp0 相对
start "" "%~dp0_runtime\pythonw.exe" "%~dp0tools\项目N-新工具名\run.py"

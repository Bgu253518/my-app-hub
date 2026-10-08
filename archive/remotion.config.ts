import { Config } from "@remotion/cli/config";
import os from "os";
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// 自动检测 Chrome Headless Shell 路径
const chromePath =
  process.env.REMOTION_BROWSER_EXECUTABLE ||
  (process.platform === "win32"
    ? path.join(
        os.homedir(),
        ".remotion",
        "chrome-headless-shell",
        "chrome-headless-shell-win64",
        "chrome-headless-shell.exe"
      )
    : undefined);

if (chromePath) {
  Config.setBrowserExecutable(chromePath);
}

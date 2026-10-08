const { bundle } = require("@remotion/bundler");
const {
  renderMedia,
  getCompositions,
  openBrowser,
} = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

class RenderEngine {
  constructor({
    fps = 30,
    outputDir = "./render_output",
    audioFile = null,
    remotionProjectDir = ".",
  } = {}) {
    this.fps = fps;
    this.outputDir = path.resolve(outputDir);
    this.audioFile = audioFile;
    this.remotionProjectDir = path.resolve(remotionProjectDir);
  }

  async renderFromStoryboard(storyboard) {
    const meta = storyboard.video_meta || {};
    const totalDuration = parseFloat(meta.total_duration) || 30;
    const frameCount = Math.round(totalDuration * this.fps);
    const sceneCount = storyboard.scenes?.length || 0;

    console.log(`[RenderEngine] 开始渲染: ${totalDuration}s, ${sceneCount}场景, ${frameCount}帧`);

    fs.mkdirSync(this.outputDir, { recursive: true });

    // Persist storyboard for verification
    const sbPath = path.join(this.outputDir, "storyboard.json");
    fs.writeFileSync(sbPath, JSON.stringify(storyboard, null, 2));
    console.log(`[RenderEngine] 分镜JSON已保存: ${sbPath}`);

    // Copy audio file to public/ for Remotion access
    if (this.audioFile && fs.existsSync(this.audioFile)) {
      const publicDir = path.join(this.remotionProjectDir, "public", "audio");
      fs.mkdirSync(publicDir, { recursive: true });
      const destAudio = path.join(publicDir, "narration.mp3");
      fs.copyFileSync(this.audioFile, destAudio);
      console.log(`[RenderEngine] 音频已复制: ${destAudio}`);
    }

    // Bundle Remotion project
    const entryPoint = path.join(this.remotionProjectDir, "src", "index.ts");
    console.log(`[RenderEngine] 打包入口: ${entryPoint}`);
    const serveUrl = await bundle({ entryPoint });

    // Get registered compositions
    const compositions = await getCompositions(serveUrl);
    const comp = compositions.find((c) => c.id === "VisualDirectorVideo");
    if (!comp) {
      throw new Error(
        `未找到 VisualDirectorVideo 组合。可用: ${compositions.map((c) => c.id).join(", ")}`
      );
    }

    // Set correct duration from storyboard
    comp.durationInFrames = frameCount;

    // Render
    const outputLocation = path.join(this.outputDir, "final_output.mp4");
    console.log(`[RenderEngine] 输出路径: ${outputLocation}`);

    await renderMedia({
      composition: comp,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps: {
        storyboard,
        audioFile: this.audioFile,
      },
      frameRange: [0, frameCount - 1],
    });

    // Verify output
    let fileSize = 0;
    try {
      fileSize = fs.statSync(outputLocation).size;
    } catch {
      throw new Error("渲染失败：输出文件未生成");
    }

    console.log(
      `[RenderEngine] 渲染完成: ${(fileSize / 1024 / 1024).toFixed(1)}MB`
    );

    return {
      outputPath: outputLocation,
      durationInFrames: frameCount,
      durationSeconds: totalDuration,
      fileSizeBytes: fileSize,
      sceneCount,
      style: meta.style || "unknown",
      visualMetaphor: meta.visual_metaphor || "none",
    };
  }
}

module.exports = RenderEngine;

// CLI entry point
if (require.main === module) {
  const sbPath = process.argv[2] || "./render_output/storyboard.json";
  const storyboard = JSON.parse(fs.readFileSync(sbPath, "utf-8"));
  const engine = new RenderEngine({
    audioFile: "./temp_audio.mp3",
  });
  engine
    .renderFromStoryboard(storyboard)
    .then((r) => console.log("DONE:", JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error("FAILED:", e);
      process.exit(1);
    });
}

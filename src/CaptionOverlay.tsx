import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

interface CaptionOverlayProps {
  scenes: Array<{
    scene_id: number;
    duration: string | number;
    narration: string;
  }>;
  fps?: number;
  language?: "english" | "chinese" | "auto";
}

/**
 * Detect if text is primarily Chinese.
 */
function isChinese(text: string): boolean {
  const cjk = text.match(/[一-鿿]/g);
  if (!cjk) return false;
  return cjk.length / text.length > 0.3;
}

/**
 * Detect if text is primarily English.
 */
function isEnglish(text: string): boolean {
  const lat = text.match(/[a-zA-Z]/g);
  if (!lat) return false;
  return lat.length / text.length > 0.4;
}

/**
 * Global caption overlay — reads current frame,
 * looks up which scene is active, renders subtitle.
 */
const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  scenes,
  fps = 30,
  language = "auto",
}) => {
  const frame = useCurrentFrame();

  // Build frame-to-scene lookup
  const activeScene = useMemo(() => {
    let cursor = 0;
    for (const s of scenes) {
      const dur = Math.max(1, Math.round(parseFloat(String(s.duration)) * fps));
      if (frame >= cursor && frame < cursor + dur) {
        return { scene: s, localFrame: frame - cursor, totalFrames: dur };
      }
      cursor += dur;
    }
    return null;
  }, [scenes, frame, fps]);

  if (!activeScene) return null;

  const { narration } = activeScene.scene;
  if (!narration) return null;

  // Parse bilingual format: lines separated by \n where first = Chinese, second = English
  const lines = narration.split("\n").filter(Boolean);
  const isBilingual = lines.length >= 2 && isChinese(lines[0]) && isEnglish(lines[1]);
  const isSpecialChar = narration.startsWith("【");

  // Fade in/out at scene boundaries
  const { localFrame, totalFrames } = activeScene;
  const fadeInDuration = 8;
  const fadeOutStart = totalFrames - 12;
  let opacity = 1;
  if (localFrame < fadeInDuration) {
    opacity = localFrame / fadeInDuration;
  } else if (localFrame >= fadeOutStart) {
    opacity = Math.max(0, 1 - (localFrame - fadeOutStart) / 12);
  }

  if (isSpecialChar) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
        opacity,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Subtitle backdrop */}
      <div
        style={{
          display: "inline-block",
          maxWidth: "80%",
          textAlign: "center",
          padding: isBilingual ? "8px 20px 6px" : "6px 20px",
          borderRadius: 4,
          background: "rgba(0,0,0,0.55)",
        }}
      >
        {isBilingual ? (
          <>
            {/* Chinese line — smaller, positioned above */}
            <span
              style={{
                display: "block",
                fontSize: 18,
                lineHeight: 1.5,
                color: "#e8e8e8",
                fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',
                letterSpacing: 2,
                marginBottom: 2,
              }}
            >
              {lines[0]}
            </span>
            {/* English line — main subtitle */}
            <span
              style={{
                display: "block",
                fontSize: 22,
                lineHeight: 1.4,
                color: "#ffffff",
                fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
                letterSpacing: 1,
                fontWeight: 500,
              }}
            >
              {lines.slice(1).join(" ")}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: isEnglish(narration) ? 22 : 20,
              lineHeight: 1.5,
              color: "#ffffff",
              fontFamily: isEnglish(narration)
                ? '"Inter","Segoe UI",Arial,sans-serif'
                : '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',
              letterSpacing: isEnglish(narration) ? 1 : 2,
              fontWeight: isEnglish(narration) ? 500 : 400,
            }}
          >
            {narration}
          </span>
        )}
      </div>
    </div>
  );
};

export default CaptionOverlay;

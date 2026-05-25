import { Composition } from "remotion";
import { AlibabaVideo } from "./AlibabaVideo";
import storyboard from "./storyboard.json";

export const RemotionRoot: React.FC = () => {
  // compute total duration from scenes
  let total = 0;
  for (const s of storyboard.scenes) {
    const dur = (s as any).compound ? (s as any).total_duration : (s as any).duration;
    total += (dur || 5) + ((s as any).transition?.duration || 0.3);
  }
  const totalFrames = Math.round(total * 30);

  return (
    <Composition
      id="AlibabaVideo"
      component={AlibabaVideo}
      durationInFrames={totalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ storyboard }}
    />
  );
};

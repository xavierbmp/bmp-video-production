import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  color: z.string(),
  backgroundColor: z.string(),
});

type Props = z.infer<typeof titleCardSchema>;

export const TitleCard: React.FC<Props> = ({ title, subtitle, color, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const exit = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const op = enter * exit;

  const titleY = interpolate(enter, [0, 1], [50, 0]);
  const subtitleOp = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: op,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontFamily: '"DM Serif Display", "Playfair Display", serif',
        }}
      >
        <div
          style={{
            color,
            fontSize: 180,
            fontWeight: 400,
            letterSpacing: 12,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color,
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: 8,
            marginTop: 20,
            opacity: subtitleOp,
            fontFamily: '"Inter", -apple-system, sans-serif',
            textTransform: 'uppercase',
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const bmpIntroSchema = z.object({
  brand: z.string(),
  tagline: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof bmpIntroSchema>;

export const BMPIntro: React.FC<Props> = ({
  brand,
  tagline,
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Brand letters rise from below with stagger, then a gold line grows underneath.
  const letterFade = (i: number) =>
    spring({ frame: frame - i * 2, fps, config: { damping: 14, stiffness: 120 } });

  const lineGrow = spring({
    frame: frame - 30,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const taglineOpacity = interpolate(frame, [40, 52, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const masterOpacity = interpolate(
    frame,
    [0, 4, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"DM Serif Display", "Playfair Display", "Times New Roman", serif',
        opacity: masterOpacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {brand.split('').map((char, i) => {
            const op = letterFade(i);
            const y = interpolate(op, [0, 1], [40, 0]);
            return (
              <span
                key={i}
                style={{
                  color: '#FFFFFF',
                  fontSize: 120,
                  fontWeight: 400,
                  letterSpacing: 8,
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  display: 'inline-block',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
        <div
          style={{
            width: interpolate(lineGrow, [0, 1], [0, 260]),
            height: 2,
            backgroundColor: accentColor,
          }}
        />
        <div
          style={{
            color: accentColor,
            fontSize: 28,
            letterSpacing: 12,
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 300,
            opacity: taglineOpacity,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

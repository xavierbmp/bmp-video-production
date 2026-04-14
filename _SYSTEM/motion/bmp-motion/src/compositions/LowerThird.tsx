import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof lowerThirdSchema>;

export const LowerThird: React.FC<Props> = ({ name, role, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 90 },
  });

  const slideOut = spring({
    frame: frame - (durationInFrames - 20),
    fps,
    config: { damping: 20, stiffness: 90 },
  });

  const x = interpolate(slideIn, [0, 1], [-900, 0]) + interpolate(slideOut, [0, 1], [0, -900]);
  const lineHeight = interpolate(spring({ frame: frame - 8, fps }), [0, 1], [0, 88]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        padding: 120,
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transform: `translateX(${x}px)`,
        }}
      >
        <div
          style={{
            width: 4,
            height: lineHeight,
            backgroundColor: accentColor,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: -0.5,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {name}
          </div>
          <div
            style={{
              color: accentColor,
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

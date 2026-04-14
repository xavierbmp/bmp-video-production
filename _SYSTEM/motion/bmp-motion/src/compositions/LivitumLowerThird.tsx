import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const livitumLowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof livitumLowerThirdSchema>;

/**
 * Custom LowerThird for Livitum:
 * - Positioned at ~65% from top (above subtitle zone)
 * - Semi-transparent dark background pill for contrast
 * - White name, gold role, gold accent line
 * - Slides in from left with spring
 */
export const LivitumLowerThird: React.FC<Props> = ({ name, role, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const slideOut = spring({
    frame: frame - (durationInFrames - 25),
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const x = interpolate(slideIn, [0, 1], [-800, 0]) + interpolate(slideOut, [0, 1], [0, -800]);
  const lineHeight = interpolate(spring({ frame: frame - 6, fps }), [0, 1], [0, 80]);
  const bgOpacity = interpolate(slideIn, [0, 1], [0, 0.7]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        /* Position well above subtitle zone */
        paddingBottom: 420,
        paddingLeft: 50,
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          transform: `translateX(${x}px)`,
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity * 1.15})`,
          borderRadius: 10,
          padding: '14px 24px 14px 18px',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 4,
            height: lineHeight,
            backgroundColor: accentColor,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            {name}
          </div>
          <div
            style={{
              color: accentColor,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: 3,
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

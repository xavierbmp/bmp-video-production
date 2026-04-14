import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const hookTextSchema = z.object({
  lines: z.array(z.string()),
  accentColor: z.string(),
  style: z.enum(['bold', 'serif', 'minimal']).optional(),
});

type Props = z.infer<typeof hookTextSchema>;

export const HookText: React.FC<Props> = ({
  lines,
  accentColor,
  style = 'bold',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const STAGGER = 6;

  const masterOpacity = interpolate(
    frame,
    [0, 4, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const fontFamilyMap = {
    bold: '"Inter", -apple-system, sans-serif',
    serif: '"DM Serif Display", "Playfair Display", serif',
    minimal: '"Inter", -apple-system, sans-serif',
  };

  const fontWeightMap = {
    bold: 900,
    serif: 400,
    minimal: 300,
  };

  const fontFamily = fontFamilyMap[style];
  const fontWeight = fontWeightMap[style];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: masterOpacity,
        padding: '0 80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: style === 'minimal' ? 16 : 8,
        }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          const lineSpring = spring({
            frame: frame - i * STAGGER,
            fps,
            config: { damping: 16, stiffness: 130 },
          });
          const opacity = interpolate(lineSpring, [0, 1], [0, 1]);
          const y = interpolate(lineSpring, [0, 1], [50, 0]);

          return (
            <div
              key={i}
              style={{
                color: isLast ? accentColor : '#FFFFFF',
                fontSize: 88,
                fontFamily,
                fontWeight,
                textTransform: 'uppercase',
                letterSpacing: style === 'minimal' ? 12 : 4,
                textAlign: 'center',
                opacity,
                transform: `translateY(${y}px)`,
                lineHeight: 1.05,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

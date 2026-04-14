import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const titleRevealSchema = z.object({
  words: z.array(z.string()),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string(),
  stagger: z.number().optional(),
});

type Props = z.infer<typeof titleRevealSchema>;

export const TitleReveal: React.FC<Props> = ({
  words,
  font = 'serif',
  accentColor,
  stagger = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fontFamily =
    font === 'serif'
      ? '"DM Serif Display", "Playfair Display", serif'
      : '"Inter", -apple-system, sans-serif';

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 24px',
          rowGap: 12,
        }}
      >
        {words.map((word, i) => {
          const wordSpring = spring({
            frame: frame - i * stagger,
            fps,
            config: { damping: 16, stiffness: 120 },
          });
          const opacity = interpolate(wordSpring, [0, 1], [0, 1]);
          const y = interpolate(wordSpring, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                overflow: 'hidden',
                display: 'inline-block',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  color: '#FFFFFF',
                  fontSize: 88,
                  fontFamily,
                  fontWeight: font === 'serif' ? 400 : 700,
                  letterSpacing: font === 'serif' ? 2 : 0,
                  textTransform: 'uppercase',
                  opacity,
                  transform: `translateY(${y}px)`,
                  lineHeight: 1.1,
                }}
              >
                {word}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

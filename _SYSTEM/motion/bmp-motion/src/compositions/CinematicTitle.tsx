import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const cinematicTitleSchema = z.object({
  text: z.string(),
  subtitle: z.string().optional(),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof cinematicTitleSchema>;

export const CinematicTitle: React.FC<Props> = ({
  text,
  subtitle,
  font = 'serif',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Very slow fade in over 30 frames
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Subtle vertical drift over the entire duration
  const drift = interpolate(frame, [0, durationInFrames], [20, -20]);

  const subtitleFade = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fontFamily =
    font === 'serif'
      ? '"DM Serif Display", "Playfair Display", serif'
      : '"Inter", -apple-system, sans-serif';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          transform: `translateY(${drift}px)`,
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 100,
            fontFamily,
            fontWeight: font === 'serif' ? 400 : 300,
            letterSpacing: 6,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {text}
        </div>
        {subtitle ? (
          <div
            style={{
              color: accentColor,
              fontSize: 26,
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontWeight: 400,
              letterSpacing: 10,
              textTransform: 'uppercase',
              opacity: subtitleFade,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

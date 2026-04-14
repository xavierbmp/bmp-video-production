import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const endCardSchema = z.object({
  brand: z.string(),
  cta: z.string(),
  url: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof endCardSchema>;

export const EndCard: React.FC<Props> = ({ brand, cta, url, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const brandIn = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const lineIn = spring({ frame: frame - 10, fps });
  const ctaIn = spring({ frame: frame - 20, fps });
  const urlIn = spring({ frame: frame - 30, fps });

  const exit = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exit,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 120,
            fontFamily: '"DM Serif Display", serif',
            letterSpacing: 8,
            opacity: brandIn,
            transform: `translateY(${interpolate(brandIn, [0, 1], [30, 0])}px)`,
          }}
        >
          {brand}
        </div>
        <div
          style={{
            width: interpolate(lineIn, [0, 1], [0, 200]),
            height: 2,
            backgroundColor: accentColor,
          }}
        />
        <div
          style={{
            color: accentColor,
            fontSize: 32,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            letterSpacing: 12,
            textTransform: 'uppercase',
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {cta}
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 28,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 300,
            marginTop: 40,
            opacity: urlIn,
          }}
        >
          {url}
        </div>
      </div>
    </AbsoluteFill>
  );
};

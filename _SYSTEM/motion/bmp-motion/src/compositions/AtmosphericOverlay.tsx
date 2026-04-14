import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const atmosphericOverlaySchema = z.object({
  type: z.enum(['grain', 'dust', 'vignette']).optional(),
  opacity: z.number().optional(),
});

type Props = z.infer<typeof atmosphericOverlaySchema>;

export const AtmosphericOverlay: React.FC<Props> = ({
  type = 'grain',
  opacity: maxOpacity = 0.4,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const masterOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, maxOpacity, maxOpacity, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (type === 'vignette') {
    return (
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
          opacity: masterOpacity / maxOpacity,
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (type === 'grain' || type === 'dust') {
    // Use frame-based seed so grain changes every frame
    const seed = frame * 1000 + 42;
    const baseFreq = type === 'grain' ? 0.65 : 0.35;
    const numOctaves = type === 'grain' ? 4 : 2;

    // Generate random dust particles for 'dust' type
    const dustParticles =
      type === 'dust'
        ? Array.from({ length: 12 }, (_, i) => ({
            x: random(`dust-x-${i}-${Math.floor(frame / 2)}`) * width,
            y: random(`dust-y-${i}-${Math.floor(frame / 2)}`) * height,
            r: random(`dust-r-${i}`) * 3 + 1,
            o: random(`dust-o-${i}`) * 0.6 + 0.2,
          }))
        : [];

    return (
      <AbsoluteFill
        style={{
          opacity: masterOpacity,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <filter id={`noise-${frame}`} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={baseFreq}
                numOctaves={numOctaves}
                seed={seed}
                stitchTiles="stitch"
                result="noiseOut"
              />
              <feColorMatrix type="saturate" values="0" in="noiseOut" />
            </filter>
          </defs>
          <rect
            width={width}
            height={height}
            filter={`url(#noise-${frame})`}
            opacity={0.9}
          />
          {type === 'dust' &&
            dustParticles.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill="white"
                opacity={p.o}
              />
            ))}
        </svg>
      </AbsoluteFill>
    );
  }

  return null;
};

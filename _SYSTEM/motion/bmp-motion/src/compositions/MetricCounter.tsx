import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const metricCounterSchema = z.object({
  value: z.number(),
  label: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof metricCounterSchema>;

export const MetricCounter: React.FC<Props> = ({
  value,
  label,
  prefix = '',
  suffix = '',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const counterSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.2 },
    durationInFrames: 60,
  });

  const currentValue = Math.round(interpolate(counterSpring, [0, 1], [0, value]));

  const labelOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelY = interpolate(frame, [35, 55], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const numberScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            transform: `scale(${interpolate(numberScale, [0, 1], [0.6, 1])})`,
            transformOrigin: 'center center',
          }}
        >
          {prefix ? (
            <span
              style={{
                color: accentColor,
                fontSize: 64,
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: 300,
              }}
            >
              {prefix}
            </span>
          ) : null}
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 160,
              fontFamily: '"DM Serif Display", "Playfair Display", serif',
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            {currentValue.toLocaleString()}
          </span>
          {suffix ? (
            <span
              style={{
                color: accentColor,
                fontSize: 64,
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: 300,
              }}
            >
              {suffix}
            </span>
          ) : null}
        </div>
        <div
          style={{
            color: accentColor,
            fontSize: 24,
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 500,
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

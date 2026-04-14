import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const featureCalloutSchema = z.object({
  text: z.string(),
  position: z.enum(['left', 'right', 'center']).optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof featureCalloutSchema>;

export const FeatureCallout: React.FC<Props> = ({
  text,
  position = 'center',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const lineSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const badgeSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  const lineWidth = interpolate(lineSpring, [0, 1], [0, 60]);
  const badgeX = interpolate(badgeSpring, [0, 1], [40, 0]);
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const justifyMap = {
    left: 'flex-start',
    right: 'flex-end',
    center: 'center',
  } as const;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: justifyMap[position],
        padding: '0 80px',
        opacity: masterOpacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            width: lineWidth,
            height: 2,
            backgroundColor: accentColor,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            backgroundColor: '#0A0A0A',
            borderRadius: 8,
            padding: '14px 28px',
            opacity: badgeOpacity,
            transform: `translateX(${badgeX}px)`,
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontWeight: 500,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

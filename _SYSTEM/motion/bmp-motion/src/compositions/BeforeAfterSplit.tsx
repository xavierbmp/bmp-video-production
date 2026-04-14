import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const beforeAfterSplitSchema = z.object({
  labelBefore: z.string(),
  labelAfter: z.string(),
  splitPosition: z.number().optional(),
  accentColor: z.string().optional(),
});

type Props = z.infer<typeof beforeAfterSplitSchema>;

export const BeforeAfterSplit: React.FC<Props> = ({
  labelBefore,
  labelAfter,
  splitPosition = 50,
  accentColor = '#C6A35D',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const lineSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 40,
  });

  const lineX = interpolate(lineSpring, [0, 1], [width / 2, (width * splitPosition) / 100]);

  const labelOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        opacity: masterOpacity,
      }}
    >
      {/* Vertical divider line */}
      <div
        style={{
          position: 'absolute',
          left: lineX,
          top: 0,
          width: 2,
          height: '100%',
          backgroundColor: accentColor,
          transform: 'translateX(-1px)',
        }}
      />

      {/* Diamond handle at center */}
      <div
        style={{
          position: 'absolute',
          left: lineX,
          top: height / 2,
          width: 24,
          height: 24,
          backgroundColor: accentColor,
          transform: 'translate(-12px, -12px) rotate(45deg)',
        }}
      />

      {/* BEFORE label */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 60,
          width: lineX,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(10,10,10,0.7)',
            padding: '10px 24px',
            borderRadius: 6,
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 22,
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontWeight: 500,
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {labelBefore}
          </span>
        </div>
      </div>

      {/* AFTER label */}
      <div
        style={{
          position: 'absolute',
          left: lineX,
          top: 60,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: `${accentColor}22`,
            border: `1px solid ${accentColor}`,
            padding: '10px 24px',
            borderRadius: 6,
          }}
        >
          <span
            style={{
              color: accentColor,
              fontSize: 22,
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontWeight: 500,
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {labelAfter}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

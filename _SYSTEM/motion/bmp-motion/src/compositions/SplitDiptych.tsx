import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const splitDiptychSchema = z.object({
  dividerColor: z.string().optional(),
  dividerWidth: z.number().optional(),
  labels: z.array(z.string()).optional(),
});

type Props = z.infer<typeof splitDiptychSchema>;

export const SplitDiptych: React.FC<Props> = ({
  dividerColor = '#C6A35D',
  dividerWidth = 3,
  labels = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();

  const growSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 90 },
    durationInFrames: 45,
  });

  const lineHeight = interpolate(growSpring, [0, 1], [0, height]);

  const labelOpacity = interpolate(frame, [25, 45], [0, 1], {
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Vertical divider growing from center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: dividerWidth,
          height: lineHeight,
          backgroundColor: dividerColor,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Labels at bottom of each half */}
      {labels.length > 0 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 80,
              width: '50%',
              display: 'flex',
              justifyContent: 'center',
              opacity: labelOpacity,
            }}
          >
            <span
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: 500,
                letterSpacing: 6,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(10,10,10,0.6)',
                padding: '8px 20px',
                borderRadius: 4,
              }}
            >
              {labels[0] ?? ''}
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 80,
              width: '50%',
              display: 'flex',
              justifyContent: 'center',
              opacity: labelOpacity,
            }}
          >
            <span
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: 500,
                letterSpacing: 6,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(10,10,10,0.6)',
                padding: '8px 20px',
                borderRadius: 4,
              }}
            >
              {labels[1] ?? ''}
            </span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const chapterMarkerSchema = z.object({
  number: z.string(),
  title: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof chapterMarkerSchema>;

export const ChapterMarker: React.FC<Props> = ({ number, title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const numberOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 20, stiffness: 90 },
  });

  const lineWidth = interpolate(lineSpring, [0, 1], [0, 80]);

  const titleSpring = spring({
    frame: frame - 24,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const titleX = interpolate(titleSpring, [0, 1], [-60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const masterOpacity = interpolate(
    frame,
    [0, 4, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 120px',
        opacity: masterOpacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Number */}
        <div
          style={{
            color: accentColor,
            fontSize: 36,
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 300,
            letterSpacing: 8,
            opacity: numberOpacity,
          }}
        >
          {number}
        </div>
        {/* Line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: accentColor,
          }}
        />
        {/* Title */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 72,
            fontFamily: '"DM Serif Display", "Playfair Display", serif',
            fontWeight: 400,
            letterSpacing: 2,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

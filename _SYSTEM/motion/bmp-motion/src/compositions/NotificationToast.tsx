import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const notificationToastSchema = z.object({
  message: z.string(),
  icon: z.string().optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof notificationToastSchema>;

export const NotificationToast: React.FC<Props> = ({
  message,
  icon = '✓',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slide in
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 140 },
  });

  // Slide out
  const slideOut = spring({
    frame: frame - (durationInFrames - 18),
    fps,
    config: { damping: 20, stiffness: 140 },
  });

  const translateY = interpolate(slideIn, [0, 1], [-120, 0]) + interpolate(slideOut, [0, 1], [0, -120]);

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: '60px 60px 0 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          backgroundColor: '#1A1A1A',
          border: `1px solid ${accentColor}33`,
          borderRadius: 12,
          padding: '18px 28px',
          opacity,
          transform: `translateY(${translateY}px)`,
          maxWidth: 380,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#0A0A0A',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            color: '#FFFFFF',
            fontSize: 20,
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          {message}
        </span>
      </div>
    </AbsoluteFill>
  );
};

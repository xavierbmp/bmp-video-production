import { z } from 'zod';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const screenRevealSchema = z.object({
  screenshot: z.string(),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
  maskColor: z.string().optional(),
});

type Props = z.infer<typeof screenRevealSchema>;

export const ScreenReveal: React.FC<Props> = ({
  screenshot,
  direction = 'left',
  maskColor = '#0A0A0A',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const revealSpring = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 80 },
    durationInFrames: 50,
  });

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Build clipPath inset based on direction
  const revealed = interpolate(revealSpring, [0, 1], [100, 0]);

  let clipPath = '';
  switch (direction) {
    case 'left':
      clipPath = `inset(0 ${revealed}% 0 0)`;
      break;
    case 'right':
      clipPath = `inset(0 0 0 ${revealed}%)`;
      break;
    case 'up':
      clipPath = `inset(0 0 ${revealed}% 0)`;
      break;
    case 'down':
      clipPath = `inset(${revealed}% 0 0 0)`;
      break;
  }

  const isUrl = screenshot.startsWith('http://') || screenshot.startsWith('https://');
  const src = isUrl ? screenshot : staticFile(screenshot);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: maskColor,
        opacity: masterOpacity,
      }}
    >
      <AbsoluteFill
        style={{
          clipPath,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

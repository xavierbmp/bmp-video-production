import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const colorWashSchema = z.object({
  color: z.string(),
  opacity: z.number().optional(),
});

type Props = z.infer<typeof colorWashSchema>;

export const ColorWash: React.FC<Props> = ({
  color,
  opacity: maxOpacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const currentOpacity = Math.min(fadeIn, fadeOut) * maxOpacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: currentOpacity,
      }}
    />
  );
};

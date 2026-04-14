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

export const logoStingSchema = z.object({
  logoSrc: z.string(),
  accentColor: z.string(),
  style: z.enum(['spring', 'fade', 'grow-line']).optional(),
});

type Props = z.infer<typeof logoStingSchema>;

export const LogoSting: React.FC<Props> = ({
  logoSrc,
  accentColor,
  style = 'spring',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.8 },
  });

  const masterOpacity = interpolate(
    frame,
    [0, 4, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const lineSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const isUrl = logoSrc.startsWith('http://') || logoSrc.startsWith('https://');
  const src = isUrl ? logoSrc : staticFile(logoSrc);

  const scale =
    style === 'fade'
      ? 1
      : interpolate(logoSpring, [0, 1], [0, 1]);

  const fadeOpacity =
    style === 'fade'
      ? interpolate(frame, [0, 20, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : masterOpacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOpacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Img
          src={src}
          style={{
            maxWidth: 320,
            maxHeight: 200,
            objectFit: 'contain',
            transform: `scale(${scale})`,
          }}
        />
        {style === 'grow-line' && (
          <div
            style={{
              width: interpolate(lineSpring, [0, 1], [0, 200]),
              height: 2,
              backgroundColor: accentColor,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

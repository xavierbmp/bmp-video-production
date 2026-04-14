import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const creditSchema = z.object({
  role: z.string(),
  name: z.string(),
});

export const creditRollSchema = z.object({
  credits: z.array(creditSchema),
  speed: z.number().optional(),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string().optional(),
});

type Props = z.infer<typeof creditRollSchema>;

export const CreditRoll: React.FC<Props> = ({
  credits,
  speed = 1,
  font = 'serif',
  accentColor = '#C6A35D',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height } = useVideoConfig();

  const ITEM_HEIGHT = 100;
  const totalContentHeight = credits.length * ITEM_HEIGHT;

  // Scroll from bottom of screen to above top
  const scrollY = interpolate(
    frame,
    [0, durationInFrames],
    [height, -(totalContentHeight + height * 0.2)],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const adjustedScrollY = scrollY * speed + (1 - speed) * height;

  const masterOpacity = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const nameFontFamily =
    font === 'serif'
      ? '"DM Serif Display", "Playfair Display", serif'
      : '"Inter", -apple-system, sans-serif';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        opacity: masterOpacity,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          transform: `translateY(${adjustedScrollY}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {credits.map((credit, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: ITEM_HEIGHT,
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                color: accentColor,
                fontSize: 18,
                fontFamily: '"Inter", -apple-system, sans-serif',
                fontWeight: 500,
                letterSpacing: 6,
                textTransform: 'uppercase',
                fontVariant: 'small-caps',
              }}
            >
              {credit.role}
            </div>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: 32,
                fontFamily: nameFontFamily,
                fontWeight: font === 'serif' ? 400 : 300,
                letterSpacing: 2,
              }}
            >
              {credit.name}
            </div>
          </div>
        ))}
      </div>

      {/* Fade masks top and bottom */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(to bottom, #0A0A0A 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(to top, #0A0A0A 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

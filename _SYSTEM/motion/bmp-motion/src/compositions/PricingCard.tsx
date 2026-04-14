import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const planSchema = z.object({
  name: z.string(),
  price: z.string(),
  features: z.array(z.string()),
});

export const pricingCardSchema = z.object({
  plans: z.array(planSchema),
  highlightIndex: z.number(),
  accentColor: z.string(),
});

type Props = z.infer<typeof pricingCardSchema>;

export const PricingCard: React.FC<Props> = ({
  plans,
  highlightIndex,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const STAGGER = 10;

  const masterOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: masterOpacity,
        padding: '60px 40px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          alignItems: 'center',
          width: '100%',
          maxWidth: 900,
        }}
      >
        {plans.map((plan, i) => {
          const isHighlighted = i === highlightIndex;
          const cardSpring = spring({
            frame: frame - i * STAGGER,
            fps,
            config: { damping: 18, stiffness: 100 },
          });
          const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const y = interpolate(cardSpring, [0, 1], [40, 0]);
          const scale = isHighlighted
            ? interpolate(cardSpring, [0, 1], [0.9, 1.06])
            : interpolate(cardSpring, [0, 1], [0.9, 1]);

          return (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: isHighlighted ? accentColor : '#1A1A1A',
                borderRadius: 16,
                padding: '40px 32px',
                opacity,
                transform: `translateY(${y}px) scale(${scale})`,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                border: isHighlighted ? 'none' : '1px solid #2A2A2A',
              }}
            >
              <div
                style={{
                  color: isHighlighted ? '#0A0A0A' : '#FFFFFF',
                  fontSize: 22,
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  color: isHighlighted ? '#0A0A0A' : accentColor,
                  fontSize: 56,
                  fontFamily: '"DM Serif Display", serif',
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                {plan.price}
              </div>
              <div
                style={{
                  width: '100%',
                  height: 1,
                  backgroundColor: isHighlighted ? 'rgba(10,10,10,0.2)' : '#2A2A2A',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {plan.features.map((feature, fi) => (
                  <div
                    key={fi}
                    style={{
                      color: isHighlighted ? '#0A0A0A' : '#CCCCCC',
                      fontSize: 18,
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

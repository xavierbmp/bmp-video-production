import { z } from 'zod';
import {
  AbsoluteFill,
  Img,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const livitumEndCardSchema = z.object({
  logoSrc: z.string(),
  iconSrc: z.string().optional(),
  score: z.string().default('4,5'),
  reviewCount: z.string().default('184 opiniones'),
});

type Props = z.infer<typeof livitumEndCardSchema>;

const TpStar: React.FC<{ delay: number; half?: boolean }> = ({ delay, half }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 200 } });
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 4,
      backgroundColor: half ? '#DCDCE6' : '#00B67A',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      marginRight: 3, transform: `scale(${s})`,
      position: 'relative', overflow: 'hidden',
    }}>
      {half && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: '50%', height: '100%',
          backgroundColor: '#00B67A',
        }} />
      )}
      <svg viewBox="0 0 24 24" width="20" height="20" style={{ position: 'relative', zIndex: 1 }}>
        <polygon
          points="12,3 14.5,8.5 20.5,9.2 16.2,13.2 17.3,19.2 12,16.3 6.7,19.2 7.8,13.2 3.5,9.2 9.5,8.5"
          fill="#FFF"
        />
      </svg>
    </div>
  );
};

export const LivitumEndCard: React.FC<Props> = ({ logoSrc, score, reviewCount }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const src = logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc);

  // ═══════════════════════════════════════════════════════════════
  // ONE SINGLE LOGO PNG — NEVER changes size.
  //
  // Logo = 300x67px. At display height 80px → width = 358px.
  // Icon portion = left 27% = 97px. Text = right 73% = 261px.
  //
  // The trick: the logo is ALWAYS at its final size (80px height).
  // We use a WRAPPER div with overflow:hidden + animated width
  // to reveal the text portion. The logo IMG inside is positioned
  // so only the icon shows initially.
  //
  // Then we animate the wrapper's margin-left (or use a parent
  // translateX) to keep the visible portion centered on screen.
  //
  // Phase 1 (f0-15):  Wrapper width = icon width (97px).
  //                    Centered on screen. Logo fades in.
  // Phase 2 (f15-40): Wrapper width expands from 97px to 358px.
  //                    The wrapper shifts left to stay centered.
  //                    Text "livitum" reveals naturally.
  // Phase 3 (f38-50): Gold accent line grows.
  // Phase 4 (f48-75): Trustpilot slides up.
  // ═══════════════════════════════════════════════════════════════

  const LOGO_H = 110;
  const LOGO_W = 493; // 300/67 * 110
  const ICON_W = 110; // tighter crop — only house icon, no text peeking

  // Phase 0: start from white, then icon appears BIG with exaggerated bounce
  // Phase 1 (f0-8): Grow from tiny to BIG (0 → 2.8)
  const growUp = interpolate(frame, [0, 8], [0, 2.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Phase 2 (f8+): Spring settle from BIG back to normal (2.8 → 1.0)
  const settleSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 8, stiffness: 80, mass: 0.8 },
  });
  const settleScale = interpolate(settleSpring, [0, 1], [2.8, 1.0]);

  // Combined: grow up then settle
  const iconScale = frame < 8 ? growUp : settleScale;

  // Fade in (fast)
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Wrapper width: icon-only → full logo (starts after bounce settles ~f35)
  const wrapperWidth = interpolate(frame, [35, 55], [ICON_W, LOGO_W], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Accent line (after text reveal)
  const lineGrow = spring({ frame: frame - 55, fps, config: { damping: 18, stiffness: 100 } });

  // Trustpilot
  const tpSpring = spring({ frame: frame - 62, fps, config: { damping: 14, stiffness: 80 } });

  // Master opacity (fade out at end)
  const masterOpacity = interpolate(
    frame,
    [0, 4, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: masterOpacity,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/*
          Overflow-hidden wrapper that expands from icon width to full logo width.
          The logo inside is always full-size, left-aligned.
          The wrapper is centered by flexbox, so as it grows it naturally
          pushes left — keeping the content centered.
        */}
        <div style={{
          width: wrapperWidth,
          height: LOGO_H,
          overflow: 'hidden',
          opacity: fadeIn,
          transform: `scale(${Math.max(0, iconScale)})`,
        }}>
          <Img
            src={src}
            style={{
              height: LOGO_H,
              width: LOGO_W,
              objectFit: 'contain',
              objectPosition: 'left center',
            }}
          />
        </div>

        {/* Gold accent line */}
        <div style={{
          width: interpolate(lineGrow, [0, 1], [0, 160]),
          height: 2,
          backgroundColor: '#F5A623',
        }} />

        {/* Trustpilot */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          opacity: tpSpring,
          transform: `translateY(${interpolate(tpSpring, [0, 1], [30, 0])}px)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#00B67A" />
            </svg>
            <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 28, fontWeight: 700, color: '#1A1A1A' }}>
              Trustpilot
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <TpStar delay={66} />
            <TpStar delay={68} />
            <TpStar delay={70} />
            <TpStar delay={72} />
            <TpStar delay={74} half />
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 24, fontWeight: 500, color: '#444' }}>
            TrustScore <strong>{score}</strong> | {reviewCount}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

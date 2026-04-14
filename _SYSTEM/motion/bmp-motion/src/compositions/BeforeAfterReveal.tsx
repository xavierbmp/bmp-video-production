import { z } from 'zod';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Easing,
} from 'remotion';

export const beforeAfterRevealSchema = z.object({
  beforeSrc: z.string(),
  renderSrc: z.string(),
  afterSrc: z.string(),
});

type Props = z.infer<typeof beforeAfterRevealSchema>;

/**
 * BeforeAfterReveal — images shown at their NATURAL landscape aspect ratio,
 * centered vertically on a transparent/clear background.
 * The b-roll video behind is visible above and below the images.
 *
 * Timeline (120 frames = 4s at 30fps):
 *   f0-8:    Hold ANTES
 *   f8-38:   Bar sweeps right, reveals RENDER
 *   f38-48:  Hold RENDER
 *   f48-78:  Bar sweeps right again, reveals DESPUÉS
 *   f78-92:  Hold DESPUÉS
 *   f92-120: DESPUÉS zooms aggressively (scale 1.0 → 2.5) to fill frame
 */
export const BeforeAfterReveal: React.FC<Props> = ({
  beforeSrc,
  renderSrc,
  afterSrc,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Images at natural landscape ratio, full width, centered vertically
  // antes/render: 2400x1792 → ratio 1.34:1. At 1080w → h=806
  // después: 1600x1200 → ratio 1.33:1. At 1080w → h=810
  // Use contain to preserve natural ratio
  const IMG_H = 810; // approximate height at full width
  const IMG_Y = (height - IMG_H) / 2; // vertical center = ~555

  const wipe1 = interpolate(frame, [8, 38], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const wipe2 = interpolate(frame, [48, 78], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Aggressive zoom at the end — como si nos metiéramos dentro del espacio
  const zoomScale = interpolate(frame, [90, 116], [1.0, 2.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  const BAR_WIDTH = 4;

  // Natural aspect ratio image style — width=100%, height=auto, centered
  const imgStyle: React.CSSProperties = {
    width,
    height: IMG_H,
    objectFit: 'cover',
    objectPosition: 'center',
    position: 'absolute',
    top: IMG_Y,
    left: 0,
  };

  // Container for each wipe layer — clips horizontally, positioned at image area
  const layerStyle = (widthPct: number, applyZoom?: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${widthPct}%`,
    height: '100%',
    overflow: 'hidden',
    transform: applyZoom && frame >= 90 ? `scale(${zoomScale})` : undefined,
    transformOrigin: `center ${IMG_Y + IMG_H / 2}px`,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Layer 1: ANTES */}
      <Img src={staticFile(beforeSrc)} style={imgStyle} />

      {/* Layer 2: RENDER (revealed by wipe1) */}
      <div style={layerStyle(wipe1)}>
        <Img src={staticFile(renderSrc)} style={{ ...imgStyle, width }} />
      </div>

      {/* Layer 3: DESPUÉS (revealed by wipe2) */}
      <div style={layerStyle(wipe2, true)}>
        <Img src={staticFile(afterSrc)} style={{ ...imgStyle, width }} />
      </div>

      {/* Full después behind during zoom (so zoom fills frame cleanly) */}
      {frame >= 78 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: frame >= 90 ? `scale(${zoomScale})` : undefined,
            transformOrigin: `center ${IMG_Y + IMG_H / 2}px`,
            opacity: interpolate(frame, [78, 82], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <Img src={staticFile(afterSrc)} style={imgStyle} />
        </div>
      )}

      {/* Bar line 1 */}
      {wipe1 > 0 && wipe1 < 100 && (
        <div style={{
          position: 'absolute',
          left: `${wipe1}%`,
          top: IMG_Y,
          width: BAR_WIDTH,
          height: IMG_H,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 12px rgba(0,0,0,0.4)',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }} />
      )}

      {/* Bar line 2 */}
      {wipe2 > 0 && wipe2 < 100 && (
        <div style={{
          position: 'absolute',
          left: `${wipe2}%`,
          top: IMG_Y,
          width: BAR_WIDTH,
          height: IMG_H,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 12px rgba(0,0,0,0.4)',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }} />
      )}
    </AbsoluteFill>
  );
};

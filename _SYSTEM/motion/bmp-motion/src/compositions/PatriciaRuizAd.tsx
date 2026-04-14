import React from 'react';
import { z } from 'zod';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

/* ─── Schema ─── */
export const patriciaAdSchema = z.object({
  accentColor: z.string().default('#C6A35D'),
});
type Props = z.infer<typeof patriciaAdSchema>;

const FPS = 30;
const ACCENT = '#C6A35D';

/* ─── Timeline: only crossfades, no slides/wipes ─── */
const T = 8; // 0.27s crossfade — soft and editorial

const BEATS: Array<{
  id: string;
  dur: number;
  type: 'video' | 'image' | 'endcard';
  src?: string;
}> = [
  // FRASE 6: "cada cliente. Te ayudaré..." (4.5s)
  { id: 'patricia-hook',   dur: 60,  type: 'video', src: 'patricia-f6.mp4' },
  { id: 'walkthrough1',    dur: 45,  type: 'video', src: 'broll-walkthrough-new.mp4' },
  { id: 'render-japandi',  dur: 40,  type: 'image', src: 'render-salon-japandi.jpg' },

  // FRASE 7: "para convertirlo en lo que siempre has soñado" (2.4s)
  { id: 'patricia-soñado', dur: 40,  type: 'video', src: 'patricia-f7.mp4' },
  { id: 'render-listones', dur: 38,  type: 'image', src: 'render-listones.jpg' },

  // FRASE 2: "Los estilos decorativos...Japandi..." (5.0s)
  { id: 'patricia-estilos',dur: 48,  type: 'video', src: 'patricia-f2.mp4' },
  { id: 'kitchen-marble',  dur: 42,  type: 'video', src: 'broll-kitchen-marble.mp4' },
  { id: 'render-sofa',     dur: 38,  type: 'image', src: 'render-sofa-cuadros.jpg' },
  { id: 'walkthrough2',    dur: 40,  type: 'video', src: 'broll-walkthrough2.mp4' },

  // FRASE 3: "texturas y materiales...mediterráneo rústico" (4.9s)
  { id: 'patricia-texturas', dur: 45, type: 'video', src: 'patricia-f3.mp4' },
  { id: 'render-fibras',    dur: 40, type: 'image', src: 'render-fibras.jpg' },
  { id: 'render-butaca',    dur: 36, type: 'image', src: 'render-butaca-verde.jpg' },
  { id: 'web-scroll',       dur: 48, type: 'video', src: 'web-scroll.mp4' },

  // FRASE 8: "¿Te parece que nos conozcamos..." (5.2s)
  { id: 'shaky-phone',     dur: 42,  type: 'video', src: 'broll-shaky-phone.mp4' },
  { id: 'render-ratan',    dur: 38,  type: 'image', src: 'render-comedor-ratan.jpg' },
  { id: 'patricia-cta',    dur: 65,  type: 'video', src: 'patricia-f8.mp4' },

  // FRASE 9: "Te espero muy pronto" (1.0s)
  { id: 'patricia-cierre', dur: 36,  type: 'video', src: 'patricia-f9.mp4' },

  // END CARD (3.5s)
  { id: 'endcard',          dur: 105, type: 'endcard' },
];

/* ─── Compute offsets ─── */
function computeOffsets() {
  const offsets: number[] = [0];
  let pos = 0;
  for (let i = 1; i < BEATS.length; i++) {
    pos += BEATS[i - 1].dur - T;
    offsets.push(pos);
  }
  return offsets;
}
const OFF = computeOffsets();
const TOTAL_FRAMES = OFF[OFF.length - 1] + BEATS[BEATS.length - 1].dur;

/* ═══════════════════════════════════════════════
   INLINE COMPONENTS — all transparent, no bg
   ═══════════════════════════════════════════════ */

/* ─── Ken Burns ─── */
const KenBurns: React.FC<{ src: string; dir?: 'in' | 'out' }> = ({ src, dir = 'in' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const p = frame / dur;
  const scale = dir === 'in'
    ? interpolate(p, [0, 1], [1.0, 1.15])
    : interpolate(p, [0, 1], [1.15, 1.0]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(`livitum/${src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

/* ─── Video clip ─── */
const Clip: React.FC<{ src: string; brightness?: number }> = ({ src, brightness = 1 }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(`livitum/${src}`)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: brightness < 1 ? `brightness(${brightness})` : undefined,
      }}
      muted
    />
  </AbsoluteFill>
);

/* ─── Animated text overlay — BIG, readable on mobile ─── */
const BigText: React.FC<{
  line1: string;
  line2?: string;
  startFrame: number;
  durFrames?: number;
  position?: 'center' | 'bottom';
}> = ({ line1, line2, startFrame, durFrames = 40, position = 'center' }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;
  if (rel < 0 || rel > durFrames) return null;

  const fadeIn = interpolate(rel, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(rel, [durFrames - 8, durFrames], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);
  const yShift = interpolate(rel, [0, 12], [30, 0], { extrapolateRight: 'clamp' });

  const posStyle = position === 'center'
    ? { top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : { bottom: 320, left: 0, right: 0, display: 'flex', justifyContent: 'center' };

  return (
    <div style={{ position: 'absolute', ...posStyle, opacity, pointerEvents: 'none' as const }}>
      <div style={{
        transform: `translateY(${yShift}px)`,
        textAlign: 'center',
        padding: '0 60px',
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 56,
          color: 'white',
          lineHeight: 1.2,
          textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.3)',
          letterSpacing: 2,
        }}>
          {line1}
        </div>
        {line2 && (
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 26,
            color: ACCENT,
            marginTop: 12,
            letterSpacing: 3,
            textTransform: 'uppercase' as const,
            textShadow: '0 1px 10px rgba(0,0,0,0.5)',
          }}>
            {line2}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Animated counter (transparent, no bg) ─── */
const Counter: React.FC<{
  target: number;
  label: string;
  prefix?: string;
  startFrame: number;
  durFrames?: number;
}> = ({ target, label, prefix = '+', startFrame, durFrames = 45 }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;
  if (rel < 0 || rel > durFrames) return null;

  const progress = interpolate(rel, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const value = Math.round(target * progress);
  const fadeIn = interpolate(rel, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(rel, [durFrames - 6, durFrames], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div style={{
      position: 'absolute',
      bottom: 380,
      width: '100%',
      textAlign: 'center',
      opacity,
      pointerEvents: 'none' as const,
    }}>
      <div style={{
        display: 'inline-block',
        padding: '16px 40px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 12,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${ACCENT}40`,
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 52,
          color: 'white',
          letterSpacing: 1,
        }}>
          {prefix}{value.toLocaleString('es-ES')}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          color: ACCENT,
          marginTop: 4,
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
};

/* ─── Lower third — inline, transparent ─── */
const LT: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - startFrame;
  if (rel < 0 || rel > 75) return null;

  const lineWidth = spring({ frame: rel, fps, config: { damping: 18, stiffness: 80 } });
  const textOpacity = interpolate(rel, [5, 15], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(rel, [65, 75], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = Math.min(textOpacity, fadeOut);
  const lineOp = Math.min(interpolate(rel, [0, 8], [0, 1], { extrapolateRight: 'clamp' }), fadeOut);

  return (
    <div style={{
      position: 'absolute',
      bottom: 340,
      left: 60,
      pointerEvents: 'none' as const,
    }}>
      {/* Accent line */}
      <div style={{
        width: 50 * lineWidth,
        height: 2,
        backgroundColor: ACCENT,
        marginBottom: 12,
        opacity: lineOp,
      }} />
      {/* Name */}
      <div style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 36,
        color: 'white',
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        opacity,
      }}>
        Patricia Ruiz
      </div>
      {/* Role */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 18,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        letterSpacing: 1,
        textShadow: '0 1px 8px rgba(0,0,0,0.5)',
        opacity,
      }}>
        Diseñadora de Interiores · Livitum
      </div>
    </div>
  );
};

/* ─── Logo watermark (persistent, subtle) ─── */
const LogoMark: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 0.55], { extrapolateRight: 'clamp' });
  const endStart = OFF[OFF.length - 1];
  const hide = frame >= endStart - 10 ? 0 : 1;
  return (
    <Img
      src={staticFile('livitum/logo.png')}
      style={{
        position: 'absolute',
        top: 55,
        left: 36,
        width: 120,
        opacity: fadeIn * hide,
      }}
    />
  );
};

/* ─── Subtitles — big, editorial, readable ─── */
const SUBS = [
  { start: 0,   end: 60,  text: 'cada cliente.' },
  { start: 62,  end: 135, text: 'Te ayudaré en todo el proceso\nde la decoración de tu estancia' },
  { start: 140, end: 210, text: 'para convertirlo en lo que\nsiempre has soñado.' },
  { start: 215, end: 300, text: 'Los estilos decorativos que más\nme definen son el moderno Japandi,' },
  { start: 302, end: 365, text: 'menos es más, pero' },
  { start: 370, end: 440, text: 'también me encantan las texturas\ny los materiales' },
  { start: 442, end: 510, text: 'que tiene el estilo\nmediterráneo rústico,' },
  { start: 515, end: 610, text: '¿Te parece que nos conozcamos\ny vemos cómo darle vida' },
  { start: 612, end: 670, text: 'a ese espacio vacío\no semiamueblado?' },
  { start: 675, end: 710, text: 'Te espero muy pronto.' },
];

const Subs: React.FC = () => {
  const frame = useCurrentFrame();
  const s = SUBS.find((x) => frame >= x.start && frame <= x.end);
  if (!s) return null;

  const rel = frame - s.start;
  const dur = s.end - s.start;
  const fadeIn = interpolate(rel, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(rel, [dur - 5, dur], [1, 0], { extrapolateLeft: 'clamp' });
  const lines = s.text.split('\n');

  return (
    <div style={{
      position: 'absolute',
      bottom: 180,
      width: '100%',
      textAlign: 'center',
      opacity: Math.min(fadeIn, fadeOut),
      pointerEvents: 'none' as const,
    }}>
      <div style={{
        display: 'inline-block',
        padding: '10px 28px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28,
            color: 'white',
            lineHeight: 1.5,
            letterSpacing: 0.3,
          }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── End card ─── */
const EndCardInline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
  const lineWidth = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 18, stiffness: 80 } });
  const textOp = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOp = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });
  const badgeOp = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{
        position: 'absolute',
        top: '32%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <Img
          src={staticFile('livitum/logo.png')}
          style={{
            width: 220,
            transform: `scale(${logoScale})`,
          }}
        />
      </div>

      {/* Accent line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 80 * lineWidth,
        height: 1.5,
        backgroundColor: ACCENT,
      }} />

      {/* CTA text */}
      <div style={{
        position: 'absolute',
        top: '55%',
        width: '100%',
        textAlign: 'center',
        opacity: textOp,
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 48,
          color: 'white',
          letterSpacing: 1,
        }}>
          Diseña tu hogar
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 22,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 14,
          letterSpacing: 3,
          opacity: ctaOp,
        }}>
          livitum.es
        </div>
      </div>

      {/* Price badge */}
      <div style={{
        position: 'absolute',
        top: '70%',
        width: '100%',
        textAlign: 'center',
        opacity: badgeOp,
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          color: ACCENT,
          border: `1px solid ${ACCENT}50`,
          padding: '8px 24px',
          borderRadius: 6,
          letterSpacing: 1,
        }}>
          Desde 59€ / habitación
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPOSITION
   ═══════════════════════════════════════════════ */
export const PatriciaRuizAd: React.FC<Props> = ({ accentColor }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* ═══ AUDIO ═══ */}
      <Audio src={staticFile('livitum/voiceover-v2.m4a')} volume={1} />
      <Audio
        src={staticFile('livitum/music.mp3')}
        volume={(f) =>
          interpolate(
            f,
            [0, 25, TOTAL_FRAMES - 45, TOTAL_FRAMES],
            [0, 0.15, 0.18, 0],
            { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
          )
        }
      />

      {/* ═══ VIDEO — all crossfade, no slide/wipe ═══ */}
      <TransitionSeries>
        {BEATS.map((beat, i) => {
          const isLast = i === BEATS.length - 1;

          const content = (() => {
            if (beat.type === 'endcard') return <EndCardInline />;
            if (beat.type === 'image') {
              return <KenBurns src={beat.src!} dir={i % 2 === 0 ? 'in' : 'out'} />;
            }
            return <Clip src={beat.src!} />;
          })();

          const seq = (
            <TransitionSeries.Sequence key={beat.id} durationInFrames={beat.dur}>
              {content}
            </TransitionSeries.Sequence>
          );

          if (isLast) return seq;

          return (
            <React.Fragment key={beat.id}>
              {seq}
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: T })}
              />
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* ═══ OVERLAYS — all transparent, on top of video ═══ */}

      <LogoMark />

      {/* Lower third on first Patricia clip */}
      <LT startFrame={8} />

      {/* "LO QUE SIEMPRE HAS SOÑADO" over render after frase 7 */}
      <BigText
        line1="LO QUE SIEMPRE"
        line2="has soñado"
        startFrame={OFF[4] + 5}
        durFrames={32}
      />

      {/* "TEXTURAS" over render-fibras */}
      <BigText
        line1="TEXTURAS"
        line2="& materiales naturales"
        startFrame={OFF[10] + 5}
        durFrames={34}
      />

      {/* Counter over web scroll */}
      <Counter
        target={9000}
        label="proyectos realizados"
        prefix="+"
        startFrame={OFF[12] + 6}
        durFrames={40}
      />

      {/* Subtitles — always on top */}
      <Subs />
    </AbsoluteFill>
  );
};

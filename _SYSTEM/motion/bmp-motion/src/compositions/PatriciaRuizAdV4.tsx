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

/* ─── Schema ─── */
export const patriciaAdV4Schema = z.object({
  accentColor: z.string().default('#C6A35D'),
});
type Props = z.infer<typeof patriciaAdV4Schema>;

const FPS = 30;
const ACCENT = '#C6A35D';

/*
  STRUCTURE (from brief):
  Plano 1 (0–6.9s):   B-roll casas + VO "Te ayudaré..."
  Plano 2 (6.9–11.6s): Patricia a cámara + VO "Mi principal objetivo..."
  Plano 3 (11.6–21.5s): Renders/b-roll + VO estilos Japandi/mediterráneo
  Plano 4 (21.5–27.7s): Patricia cierre + VO "nos conozcamos... te espero"
  End card (27.7–30.7s): Logo + CTA
*/

/* ─── Frame timings ─── */
const P1_START = 0;
const P1_DUR = Math.round(6.9 * FPS);   // 207 frames

const P2_START = P1_DUR;
const P2_DUR = Math.round(4.7 * FPS);   // 141 frames

const P3_START = P2_START + P2_DUR;
const P3_DUR = Math.round(9.9 * FPS);   // 297 frames

const P4_START = P3_START + P3_DUR;
const P4_DUR = Math.round(6.2 * FPS);   // 186 frames

const EC_START = P4_START + P4_DUR;
const EC_DUR = Math.round(3.0 * FPS);   // 90 frames

const TOTAL = EC_START + EC_DUR;         // ~930 frames = 31s

/* ─── Sub-clip durations within each plano (frames) ─── */
// Plano 1: walkthrough1 + render japandi + walkthrough2
const P1A = 70, P1B = 69, P1C = 68; // = 207

// Plano 3: render listones + b-roll cocina + render fibras + b-roll shaky + render butaca
const P3A = 60, P3B = 60, P3C = 60, P3D = 60, P3E = 57; // = 297

/* ─── Components ─── */

const Clip: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(`livitum/${src}`)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      muted
    />
  </AbsoluteFill>
);

const PatriciaClip: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(`livitum/${src}`)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      muted
    />
  </AbsoluteFill>
);

const KenBurns: React.FC<{ src: string; dir?: 'in' | 'out' }> = ({ src, dir = 'in' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const p = frame / dur;
  const scale = dir === 'in'
    ? interpolate(p, [0, 1], [1.0, 1.12])
    : interpolate(p, [0, 1], [1.12, 1.0]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(`livitum/${src}`)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: `scale(${scale})`, transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

const DarkClip: React.FC<{ src: string; brightness?: number }> = ({ src, brightness = 0.4 }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(`livitum/${src}`)}
      style={{
        width: '100%', height: '100%', objectFit: 'cover',
        filter: `brightness(${brightness})`,
      }}
      muted
    />
  </AbsoluteFill>
);

/* ─── Lower Third (transparent, inline) ─── */
const LowerThird: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineW = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const textOp = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [75, 85], [1, 0], { extrapolateLeft: 'clamp' });
  const op = Math.min(textOp, fadeOut);
  const lineOp = Math.min(
    interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
    fadeOut
  );

  return (
    <div style={{ position: 'absolute', bottom: 340, left: 60, pointerEvents: 'none' }}>
      <div style={{
        width: 50 * lineW, height: 2, backgroundColor: ACCENT,
        marginBottom: 12, opacity: lineOp,
      }} />
      <div style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 40, color: 'white', opacity: op,
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 20, color: 'rgba(255,255,255,0.85)', marginTop: 4,
        letterSpacing: 1, opacity: op,
        textShadow: '0 1px 8px rgba(0,0,0,0.5)',
      }}>
        {role}
      </div>
    </div>
  );
};

/* ─── Subtitles ─── */
const SUBS = [
  // Plano 1: VO f6+f7 (0-207 frames)
  { s: 0,   e: 50,  t: 'cada cliente.' },
  { s: 50,  e: 130, t: 'Te ayudaré en todo el proceso\nde la decoración de tu estancia' },
  { s: 132, e: 207, t: 'para convertirlo en lo que\nsiempre has soñado.' },
  // Plano 2: VO f5 (207-348)
  { s: 210, e: 280, t: 'Mi principal objetivo es llegar\na proyectar sensaciones' },
  { s: 282, e: 348, t: 'creando espacios únicos\npara cada cliente.' },
  // Plano 3: VO f2+f3 (348-645)
  { s: 351, e: 430, t: 'Los estilos decorativos que más\nme definen son el moderno Japandi,' },
  { s: 432, e: 500, t: 'menos es más, pero' },
  { s: 502, e: 570, t: 'también me encantan las texturas\ny los materiales' },
  { s: 572, e: 645, t: 'que tiene el estilo\nmediterráneo rústico,' },
  // Plano 4: VO f8+f9 (645-831)
  { s: 648, e: 740, t: '¿Te parece que nos conozcamos\ny vemos cómo darle vida' },
  { s: 742, e: 800, t: 'a ese espacio vacío\no semiamueblado?' },
  { s: 805, e: 831, t: 'Te espero muy pronto.' },
];

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const sub = SUBS.find((x) => frame >= x.s && frame <= x.e);
  if (!sub) return null;

  const rel = frame - sub.s;
  const dur = sub.e - sub.s;
  const fadeIn = interpolate(rel, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(rel, [dur - 5, dur], [1, 0], { extrapolateLeft: 'clamp' });
  const lines = sub.t.split('\n');

  return (
    <div style={{
      position: 'absolute', bottom: 180, width: '100%',
      textAlign: 'center', opacity: Math.min(fadeIn, fadeOut),
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'inline-block', padding: '10px 28px',
        backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6,
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28, color: 'white', lineHeight: 1.5, letterSpacing: 0.3,
          }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── End Card ─── */
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
  const lineW = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 18, stiffness: 80 } });
  const textOp = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const urlOp = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' });
  const badgeOp = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Logo */}
      <div style={{
        position: 'absolute', top: '32%', width: '100%',
        display: 'flex', justifyContent: 'center',
      }}>
        <Img
          src={staticFile('livitum/logo.png')}
          style={{ width: 200, transform: `scale(${logoScale})` }}
        />
      </div>
      {/* Line */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translateX(-50%)',
        width: 70 * lineW, height: 1.5, backgroundColor: ACCENT,
      }} />
      {/* CTA */}
      <div style={{
        position: 'absolute', top: '55%', width: '100%',
        textAlign: 'center', opacity: textOp,
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 48, color: 'white', letterSpacing: 1,
        }}>
          Diseña tu hogar
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 22, color: 'rgba(255,255,255,0.6)',
          marginTop: 14, letterSpacing: 3, opacity: urlOp,
        }}>
          livitum.es
        </div>
      </div>
      {/* Price */}
      <div style={{
        position: 'absolute', top: '70%', width: '100%',
        textAlign: 'center', opacity: badgeOp,
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: 18, color: ACCENT,
          border: `1px solid ${ACCENT}50`, padding: '8px 24px',
          borderRadius: 6, letterSpacing: 1,
        }}>
          Desde 59€ / habitación
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Logo watermark ─── */
const LogoWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 0.5], { extrapolateRight: 'clamp' });
  const hide = frame >= EC_START ? 0 : 1;
  return (
    <Img
      src={staticFile('livitum/logo.png')}
      style={{
        position: 'absolute', top: 55, left: 36, width: 120,
        opacity: fadeIn * hide,
      }}
    />
  );
};

/* ═══════════════════════════════════════
   MAIN COMPOSITION
   ═══════════════════════════════════════ */
export const PatriciaRuizAdV4: React.FC<Props> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>

      {/* ═══ AUDIO ═══ */}
      <Audio src={staticFile('livitum/voiceover-v4.m4a')} volume={1} />
      <Audio
        src={staticFile('livitum/music.mp3')}
        volume={(f) =>
          interpolate(f,
            [0, 20, TOTAL - 45, TOTAL],
            [0, 0.14, 0.18, 0],
            { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
          )
        }
      />

      {/* ═══ PLANO 1: B-roll casas (0 – 207 frames) ═══ */}
      <Sequence from={P1_START} durationInFrames={P1A}>
        <Clip src="broll-walkthrough-new.mp4" />
      </Sequence>
      <Sequence from={P1_START + P1A} durationInFrames={P1B}>
        <KenBurns src="render-salon-japandi.jpg" dir="in" />
      </Sequence>
      <Sequence from={P1_START + P1A + P1B} durationInFrames={P1C}>
        <Clip src="broll-walkthrough2.mp4" />
      </Sequence>

      {/* ═══ PLANO 2: Patricia a cámara (207 – 348 frames) ═══ */}
      <Sequence from={P2_START} durationInFrames={P2_DUR}>
        <PatriciaClip src="patricia-f5.mp4" />
      </Sequence>

      {/* ═══ PLANO 3: Renders + b-roll (348 – 645 frames) ═══ */}
      <Sequence from={P3_START} durationInFrames={P3A}>
        <KenBurns src="render-listones.jpg" dir="out" />
      </Sequence>
      <Sequence from={P3_START + P3A} durationInFrames={P3B}>
        <Clip src="broll-kitchen-marble.mp4" />
      </Sequence>
      <Sequence from={P3_START + P3A + P3B} durationInFrames={P3C}>
        <KenBurns src="render-fibras.jpg" dir="in" />
      </Sequence>
      <Sequence from={P3_START + P3A + P3B + P3C} durationInFrames={P3D}>
        <Clip src="broll-shaky-phone.mp4" />
      </Sequence>
      <Sequence from={P3_START + P3A + P3B + P3C + P3D} durationInFrames={P3E}>
        <KenBurns src="render-butaca-verde.jpg" dir="out" />
      </Sequence>

      {/* ═══ PLANO 4: Patricia cierre (645 – 831 frames) ═══ */}
      <Sequence from={P4_START} durationInFrames={P4_DUR}>
        <PatriciaClip src="patricia-f89.mp4" />
      </Sequence>

      {/* ═══ END CARD (831 – 921 frames) ═══ */}
      <Sequence from={EC_START} durationInFrames={EC_DUR}>
        <DarkClip src="broll-walkthrough3.mp4" brightness={0.35} />
        <EndCard />
      </Sequence>

      {/* ═══ OVERLAYS ═══ */}

      {/* Logo watermark (all except end card) */}
      <LogoWatermark />

      {/* Lower Third — on Patricia plano 2 */}
      <Sequence from={P2_START + 8} durationInFrames={90}>
        <LowerThird name="Patricia Ruiz" role="Diseñadora de Interiores · Livitum" />
      </Sequence>

      {/* Subtitles */}
      <Subtitles />
    </AbsoluteFill>
  );
};

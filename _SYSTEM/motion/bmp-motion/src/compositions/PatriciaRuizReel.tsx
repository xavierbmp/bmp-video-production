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
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';

// Import new compositions as overlay components
import { TitleReveal } from './TitleReveal';
import { CinematicTitle } from './CinematicTitle';
import { MetricCounter } from './MetricCounter';
import { NotificationToast } from './NotificationToast';
import { LogoSting } from './LogoSting';
import { LowerThird } from './LowerThird';

/* ─── Schema ─── */
export const patriciaReelSchema = z.object({
  accentColor: z.string().default('#C6A35D'),
});

type Props = z.infer<typeof patriciaReelSchema>;

/* ─── Beat durations in frames (@30fps) ─── */
const T = 3;  // transition frames (0.1s — Holded-style fast cuts)
const T_END = 8; // fade-to-black frames for end card

const BEATS = [
  { id: 'hook',      dur: 36,  src: 'broll-walkthrough.mp4' },   // 1.2s
  { id: 'patricia1', dur: 54,  src: 'patricia-beat2.mp4' },      // 1.8s
  { id: 'dining',    dur: 36,  src: 'broll-dining.mp4' },        // 1.2s
  { id: 'kitchen',   dur: 36,  src: 'broll-kitchen.mp4' },       // 1.2s
  { id: 'patricia2', dur: 24,  src: 'patricia-beat5.mp4' },      // 0.8s
  { id: 'salon',     dur: 39,  src: 'broll-salon.mp4' },         // 1.3s
  { id: 'scroll',    dur: 45,  src: 'broll-scroll.mp4' },        // 1.5s
  { id: 'living',    dur: 39,  src: 'broll-living.mp4' },        // 1.3s
  { id: 'furniture', dur: 45,  src: 'furniture-click.mp4' },     // 1.5s
  { id: 'patricia3', dur: 69,  src: 'patricia-beat10.mp4' },     // 2.3s
  { id: 'endcard',   dur: 60 },                                   // 2.0s — LogoSting
];

// Transitions between each beat (one fewer than beats)
const TRANSITIONS: Array<{
  presentation: ReturnType<typeof fade>;
  frames: number;
}> = [
  { presentation: fade(),                        frames: T },     // hook → patricia1
  { presentation: slide({ direction: 'from-left' }),  frames: T },     // patricia1 → dining
  { presentation: slide({ direction: 'from-right' }), frames: T },     // dining → kitchen
  { presentation: fade(),                        frames: T },     // kitchen → patricia2
  { presentation: slide({ direction: 'from-bottom' }), frames: T },   // patricia2 → salon
  { presentation: fade(),                        frames: T },     // salon → scroll
  { presentation: slide({ direction: 'from-left' }),  frames: T },     // scroll → living
  { presentation: wipe({ direction: 'from-left' }),   frames: 4 },     // living → furniture
  { presentation: fade(),                        frames: 4 },     // furniture → patricia3
  { presentation: fade(),                        frames: T_END }, // patricia3 → endcard
];

/* ─── Calculate absolute frame positions for each beat ─── */
function computeOffsets() {
  const offsets: number[] = [0];
  let pos = 0;
  for (let i = 1; i < BEATS.length; i++) {
    pos += BEATS[i - 1].dur - TRANSITIONS[i - 1].frames;
    offsets.push(pos);
  }
  return offsets;
}
const OFFSETS = computeOffsets();

/* ─── Subtitle data (pre-parsed, frames relative to composition start) ─── */
const SUBTITLES = [
  { start: 0,   end: 105, text: 'Mi principal objetivo es llegar\na proyectar sensaciones' },
  { start: 105, end: 182, text: 'creando espacios únicos\npara cada cliente.' },
  { start: 186, end: 255, text: 'Te ayudaré en todo el proceso\nde la decoración de tu estancia' },
  { start: 255, end: 358, text: 'para convertirlo en lo que\nsiempre has soñado.' },
  { start: 360, end: 414, text: 'Te espero muy pronto.' },
];

/* ─── Simple helper components ─── */

const VideoClip: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(`livitum/${src}`)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      muted
    />
  </AbsoluteFill>
);

const LogoWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 0.7], { extrapolateRight: 'clamp' });
  // Hide during endcard (last 60 frames — LogoSting handles branding there)
  const { durationInFrames } = useVideoConfig();
  const endcardStart = durationInFrames - 60;
  const hideForEnd = frame > endcardStart ? 0 : 1;
  return (
    <Img
      src={staticFile('livitum/logo.png')}
      style={{
        position: 'absolute',
        top: 60,
        left: 40,
        width: 140,
        opacity: opacity * hideForEnd,
      }}
    />
  );
};

const SubtitleTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const current = SUBTITLES.find((s) => frame >= s.start && frame <= s.end);
  if (!current) return null;

  const relFrame = frame - current.start;
  const fadeIn = Math.min(1, relFrame / 4);
  const lines = current.text.split('\n');

  return (
    <div style={{
      position: 'absolute',
      bottom: 240,
      width: '100%',
      textAlign: 'center',
      opacity: fadeIn,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 24,
          color: 'white',
          textShadow: '0 1px 6px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.3)',
          lineHeight: 1.4,
        }}>
          {line}
        </div>
      ))}
    </div>
  );
};

/* ─── Main Composition ─── */
export const PatriciaRuizReel: React.FC<Props> = ({ accentColor }) => {
  // Overlay positions (absolute frames in composition)
  const lowerThirdStart = OFFSETS[1] + 3; // shortly after Patricia appears
  const titleRevealStart = OFFSETS[2] + 2; // beat 3: dining
  const cinematicStart = OFFSETS[3] + 2; // beat 4: kitchen
  const toastStart = OFFSETS[5] + 2; // beat 6: salon
  const metricStart = OFFSETS[7] + 2; // beat 8: living
  const dreamTextStart = OFFSETS[8] + 2; // beat 9: furniture

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* ═══ AUDIO ═══ */}
      <Audio src={staticFile('livitum/voiceover.m4a')} volume={1} />

      {/* ═══ VIDEO TIMELINE (TransitionSeries) ═══ */}
      <TransitionSeries>
        {BEATS.map((beat, i) => {
          const isLast = i === BEATS.length - 1;
          const sequence = (
            <TransitionSeries.Sequence key={beat.id} durationInFrames={beat.dur}>
              {beat.id === 'endcard' ? (
                <LogoSting
                  logoSrc="livitum/logo.png"
                  accentColor={accentColor}
                  style="grow-line"
                />
              ) : (
                <VideoClip src={beat.src!} />
              )}
            </TransitionSeries.Sequence>
          );

          if (isLast) return sequence;

          const trans = TRANSITIONS[i];
          return (
            <React.Fragment key={beat.id}>
              {sequence}
              <TransitionSeries.Transition
                presentation={trans.presentation}
                timing={linearTiming({ durationInFrames: trans.frames })}
              />
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* ═══ OVERLAY LAYERS ═══ */}

      {/* Persistent logo watermark (hides during endcard) */}
      <LogoWatermark />

      {/* LowerThird: Patricia Ruiz — appears during beat 2 */}
      <Sequence from={lowerThirdStart} durationInFrames={54}>
        <LowerThird
          name="Patricia Ruiz"
          role="Diseñadora de Interiores"
          accentColor={accentColor}
        />
      </Sequence>

      {/* TitleReveal: PROYECTAR SENSACIONES — beat 3 (dining) */}
      <Sequence from={titleRevealStart} durationInFrames={34}>
        <TitleReveal
          words={['PROYECTAR', 'SENSACIONES']}
          font="serif"
          accentColor={accentColor}
          stagger={8}
        />
      </Sequence>

      {/* CinematicTitle: ESPACIOS ÚNICOS — beat 4 (kitchen) */}
      <Sequence from={cinematicStart} durationInFrames={34}>
        <CinematicTitle
          text="ESPACIOS ÚNICOS"
          subtitle="para cada cliente"
          font="serif"
          accentColor={accentColor}
        />
      </Sequence>

      {/* NotificationToast: ¡Tu diseño está listo! — beat 6 (salon) */}
      <Sequence from={toastStart} durationInFrames={36}>
        <NotificationToast
          message="¡Tu diseño está listo!"
          icon="✓"
          accentColor={accentColor}
        />
      </Sequence>

      {/* MetricCounter: 9,000+ proyectos — beat 8 (living) */}
      <Sequence from={metricStart} durationInFrames={36}>
        <MetricCounter
          value={9000}
          label="proyectos realizados"
          prefix="+"
          accentColor={accentColor}
        />
      </Sequence>

      {/* TitleReveal: LO QUE SIEMPRE HAS SOÑADO — beat 9 (furniture) */}
      <Sequence from={dreamTextStart} durationInFrames={42}>
        <TitleReveal
          words={['LO QUE SIEMPRE', 'HAS SOÑADO']}
          font="serif"
          accentColor={accentColor}
          stagger={10}
        />
      </Sequence>

      {/* Subtitles (always on top) */}
      <SubtitleTrack />
    </AbsoluteFill>
  );
};

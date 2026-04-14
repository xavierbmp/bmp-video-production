import { Composition } from 'remotion';
import { BMPIntro, bmpIntroSchema } from './compositions/BMPIntro';
import { LowerThird, lowerThirdSchema } from './compositions/LowerThird';
import { EndCard, endCardSchema } from './compositions/EndCard';
import { TitleCard, titleCardSchema } from './compositions/TitleCard';
import { PatriciaRuizReel, patriciaReelSchema } from './compositions/PatriciaRuizReel';
import { PatriciaRuizAd, patriciaAdSchema } from './compositions/PatriciaRuizAd';
import { PatriciaRuizAdV4, patriciaAdV4Schema } from './compositions/PatriciaRuizAdV4';

// SaaS / Product Ads
import { MetricCounter, metricCounterSchema } from './compositions/MetricCounter';
import { FeatureCallout, featureCalloutSchema } from './compositions/FeatureCallout';
import { ScreenReveal, screenRevealSchema } from './compositions/ScreenReveal';
import { HookText, hookTextSchema } from './compositions/HookText';
import { PricingCard, pricingCardSchema } from './compositions/PricingCard';
import { NotificationToast, notificationToastSchema } from './compositions/NotificationToast';
import { BeforeAfterSplit, beforeAfterSplitSchema } from './compositions/BeforeAfterSplit';

// Fashion / Lifestyle
import { TitleReveal, titleRevealSchema } from './compositions/TitleReveal';
import { LogoSting, logoStingSchema } from './compositions/LogoSting';
import { ColorWash, colorWashSchema } from './compositions/ColorWash';
import { SplitDiptych, splitDiptychSchema } from './compositions/SplitDiptych';

// Custom client compositions
import { LivitumEndCard, livitumEndCardSchema } from './compositions/LivitumEndCard';
import { LivitumLowerThird, livitumLowerThirdSchema } from './compositions/LivitumLowerThird';
import { BeforeAfterReveal, beforeAfterRevealSchema } from './compositions/BeforeAfterReveal';

// Brand Film
import { CinematicTitle, cinematicTitleSchema } from './compositions/CinematicTitle';
import { ChapterMarker, chapterMarkerSchema } from './compositions/ChapterMarker';
import { AtmosphericOverlay, atmosphericOverlaySchema } from './compositions/AtmosphericOverlay';
import { CreditRoll, creditRollSchema } from './compositions/CreditRoll';

export const Root: React.FC = () => {
  return (
    <>
      {/* ─── Original compositions ─── */}

      {/* Vertical 9:16 variants (Reels/TikTok) */}
      <Composition
        id="BMPIntro-Vertical"
        component={BMPIntro}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        schema={bmpIntroSchema}
        defaultProps={{
          brand: 'LIVITUM',
          tagline: 'BY BMP',
          primaryColor: '#0A0A0A',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="LowerThird-Vertical"
        component={LowerThird}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={lowerThirdSchema}
        defaultProps={{
          name: 'Dra. Laura Martínez',
          role: 'Head of Research',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="TitleCard-Vertical"
        component={TitleCard}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        schema={titleCardSchema}
        defaultProps={{
          title: 'ANTES',
          subtitle: 'Día 1',
          color: '#FFFFFF',
          backgroundColor: '#0A0A0A',
        }}
      />
      <Composition
        id="EndCard-Vertical"
        component={EndCard}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={endCardSchema}
        defaultProps={{
          brand: 'LIVITUM',
          cta: 'DESCÚBRELO',
          url: 'livitum.com',
          accentColor: '#C6A35D',
        }}
      />

      {/* ─── Full edits ─── */}
      <Composition
        id="PatriciaRuiz-Reel"
        component={PatriciaRuizReel}
        durationInFrames={487}
        fps={30}
        width={1080}
        height={1920}
        schema={patriciaReelSchema}
        defaultProps={{
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="PatriciaRuiz-Ad"
        component={PatriciaRuizAd}
        durationInFrames={810}
        fps={30}
        width={1080}
        height={1920}
        schema={patriciaAdSchema}
        defaultProps={{
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="PatriciaRuiz-Ad-V4"
        component={PatriciaRuizAdV4}
        durationInFrames={921}
        fps={30}
        width={1080}
        height={1920}
        schema={patriciaAdV4Schema}
        defaultProps={{
          accentColor: '#C6A35D',
        }}
      />

      {/* ─── Custom client compositions ─── */}
      <Composition
        id="BeforeAfterReveal-Vertical"
        component={BeforeAfterReveal}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={beforeAfterRevealSchema}
        defaultProps={{
          beforeSrc: 'livitum-antes.png',
          renderSrc: 'livitum-render.png',
          afterSrc: 'livitum-despues.png',
        }}
      />
      <Composition
        id="LivitumLowerThird-Vertical"
        component={LivitumLowerThird}
        durationInFrames={105}
        fps={30}
        width={1080}
        height={1920}
        schema={livitumLowerThirdSchema}
        defaultProps={{
          name: 'Patricia Ruiz',
          role: 'Diseñadora de Interiores',
          accentColor: '#F5A623',
        }}
      />
      <Composition
        id="LivitumEndCard-Vertical"
        component={LivitumEndCard}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        schema={livitumEndCardSchema}
        defaultProps={{
          logoSrc: 'livitum-logo-transparent.png',
          rating: '4,5',
          ratingLabel: 'Excelente',
          reviewCount: '184 opiniones',
        }}
      />

      {/* Horizontal 16:9 variants (YouTube / LinkedIn) */}
      <Composition
        id="BMPIntro-Horizontal"
        component={BMPIntro}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        schema={bmpIntroSchema}
        defaultProps={{
          brand: 'LIVITUM',
          tagline: 'BY BMP',
          primaryColor: '#0A0A0A',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="LowerThird-Horizontal"
        component={LowerThird}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        schema={lowerThirdSchema}
        defaultProps={{
          name: 'Dra. Laura Martínez',
          role: 'Head of Research',
          accentColor: '#C6A35D',
        }}
      />

      {/* ─── SaaS / Product Ads ─── */}

      <Composition
        id="MetricCounter-Vertical"
        component={MetricCounter}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        schema={metricCounterSchema}
        defaultProps={{
          value: 10000,
          label: 'Usuarios activos',
          prefix: '+',
          suffix: '',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="MetricCounter-Horizontal"
        component={MetricCounter}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        schema={metricCounterSchema}
        defaultProps={{
          value: 10000,
          label: 'Usuarios activos',
          prefix: '+',
          suffix: '',
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="FeatureCallout-Vertical"
        component={FeatureCallout}
        durationInFrames={75}
        fps={30}
        width={1080}
        height={1920}
        schema={featureCalloutSchema}
        defaultProps={{
          text: 'Resultados en 7 días',
          position: 'center',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="FeatureCallout-Horizontal"
        component={FeatureCallout}
        durationInFrames={75}
        fps={30}
        width={1920}
        height={1080}
        schema={featureCalloutSchema}
        defaultProps={{
          text: 'Resultados en 7 días',
          position: 'center',
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="ScreenReveal-Vertical"
        component={ScreenReveal}
        durationInFrames={105}
        fps={30}
        width={1080}
        height={1920}
        schema={screenRevealSchema}
        defaultProps={{
          screenshot: 'screenshot.jpg',
          direction: 'left',
          maskColor: '#0A0A0A',
        }}
      />
      <Composition
        id="ScreenReveal-Horizontal"
        component={ScreenReveal}
        durationInFrames={105}
        fps={30}
        width={1920}
        height={1080}
        schema={screenRevealSchema}
        defaultProps={{
          screenshot: 'screenshot.jpg',
          direction: 'left',
          maskColor: '#0A0A0A',
        }}
      />

      <Composition
        id="HookText-Vertical"
        component={HookText}
        durationInFrames={75}
        fps={30}
        width={1080}
        height={1920}
        schema={hookTextSchema}
        defaultProps={{
          lines: ['¿Cansada de', 'cremas que', 'no funcionan?'],
          accentColor: '#C6A35D',
          style: 'bold',
        }}
      />
      <Composition
        id="HookText-Horizontal"
        component={HookText}
        durationInFrames={75}
        fps={30}
        width={1920}
        height={1080}
        schema={hookTextSchema}
        defaultProps={{
          lines: ['¿Cansada de', 'cremas que', 'no funcionan?'],
          accentColor: '#C6A35D',
          style: 'bold',
        }}
      />

      <Composition
        id="PricingCard-Vertical"
        component={PricingCard}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={pricingCardSchema}
        defaultProps={{
          plans: [
            { name: 'Basic', price: '€29', features: ['1 usuario', '5 proyectos', 'Soporte email'] },
            { name: 'Pro', price: '€79', features: ['5 usuarios', 'Proyectos ilimitados', 'Soporte 24/7', 'Analytics'] },
            { name: 'Enterprise', price: '€199', features: ['Usuarios ilimitados', 'Todo incluido', 'SLA garantizado'] },
          ],
          highlightIndex: 1,
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="PricingCard-Horizontal"
        component={PricingCard}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        schema={pricingCardSchema}
        defaultProps={{
          plans: [
            { name: 'Basic', price: '€29', features: ['1 usuario', '5 proyectos', 'Soporte email'] },
            { name: 'Pro', price: '€79', features: ['5 usuarios', 'Proyectos ilimitados', 'Soporte 24/7', 'Analytics'] },
            { name: 'Enterprise', price: '€199', features: ['Usuarios ilimitados', 'Todo incluido', 'SLA garantizado'] },
          ],
          highlightIndex: 1,
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="NotificationToast-Vertical"
        component={NotificationToast}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
        schema={notificationToastSchema}
        defaultProps={{
          message: '¡Pedido confirmado!',
          icon: '✓',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="NotificationToast-Horizontal"
        component={NotificationToast}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
        schema={notificationToastSchema}
        defaultProps={{
          message: '¡Pedido confirmado!',
          icon: '✓',
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="BeforeAfterSplit-Vertical"
        component={BeforeAfterSplit}
        durationInFrames={105}
        fps={30}
        width={1080}
        height={1920}
        schema={beforeAfterSplitSchema}
        defaultProps={{
          labelBefore: 'ANTES',
          labelAfter: 'DESPUÉS',
          splitPosition: 50,
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="BeforeAfterSplit-Horizontal"
        component={BeforeAfterSplit}
        durationInFrames={105}
        fps={30}
        width={1920}
        height={1080}
        schema={beforeAfterSplitSchema}
        defaultProps={{
          labelBefore: 'ANTES',
          labelAfter: 'DESPUÉS',
          splitPosition: 50,
          accentColor: '#C6A35D',
        }}
      />

      {/* ─── Fashion / Lifestyle ─── */}

      <Composition
        id="TitleReveal-Vertical"
        component={TitleReveal}
        durationInFrames={105}
        fps={30}
        width={1080}
        height={1920}
        schema={titleRevealSchema}
        defaultProps={{
          words: ['NUEVA', 'COLECCIÓN', 'SS26'],
          font: 'serif',
          accentColor: '#C6A35D',
          stagger: 10,
        }}
      />
      <Composition
        id="TitleReveal-Horizontal"
        component={TitleReveal}
        durationInFrames={105}
        fps={30}
        width={1920}
        height={1080}
        schema={titleRevealSchema}
        defaultProps={{
          words: ['NUEVA', 'COLECCIÓN', 'SS26'],
          font: 'serif',
          accentColor: '#C6A35D',
          stagger: 10,
        }}
      />

      <Composition
        id="LogoSting-Vertical"
        component={LogoSting}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        schema={logoStingSchema}
        defaultProps={{
          logoSrc: 'logos/bmp-watermark.png',
          accentColor: '#C6A35D',
          style: 'grow-line',
        }}
      />
      <Composition
        id="LogoSting-Horizontal"
        component={LogoSting}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        schema={logoStingSchema}
        defaultProps={{
          logoSrc: 'logos/bmp-watermark.png',
          accentColor: '#C6A35D',
          style: 'grow-line',
        }}
      />

      <Composition
        id="ColorWash-Vertical"
        component={ColorWash}
        durationInFrames={45}
        fps={30}
        width={1080}
        height={1920}
        schema={colorWashSchema}
        defaultProps={{
          color: '#C6A35D',
          opacity: 0.4,
        }}
      />
      <Composition
        id="ColorWash-Horizontal"
        component={ColorWash}
        durationInFrames={45}
        fps={30}
        width={1920}
        height={1080}
        schema={colorWashSchema}
        defaultProps={{
          color: '#C6A35D',
          opacity: 0.4,
        }}
      />

      <Composition
        id="SplitDiptych-Vertical"
        component={SplitDiptych}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={splitDiptychSchema}
        defaultProps={{
          dividerColor: '#C6A35D',
          dividerWidth: 3,
          labels: ['IZQUIERDA', 'DERECHA'],
        }}
      />
      <Composition
        id="SplitDiptych-Horizontal"
        component={SplitDiptych}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        schema={splitDiptychSchema}
        defaultProps={{
          dividerColor: '#C6A35D',
          dividerWidth: 3,
          labels: ['IZQUIERDA', 'DERECHA'],
        }}
      />

      {/* ─── Brand Film ─── */}

      <Composition
        id="CinematicTitle-Vertical"
        component={CinematicTitle}
        durationInFrames={135}
        fps={30}
        width={1080}
        height={1920}
        schema={cinematicTitleSchema}
        defaultProps={{
          text: 'Una historia de belleza',
          subtitle: 'LIVITUM · PRIMAVERA 2026',
          font: 'serif',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="CinematicTitle-Horizontal"
        component={CinematicTitle}
        durationInFrames={135}
        fps={30}
        width={1920}
        height={1080}
        schema={cinematicTitleSchema}
        defaultProps={{
          text: 'Una historia de belleza',
          subtitle: 'LIVITUM · PRIMAVERA 2026',
          font: 'serif',
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="ChapterMarker-Vertical"
        component={ChapterMarker}
        durationInFrames={75}
        fps={30}
        width={1080}
        height={1920}
        schema={chapterMarkerSchema}
        defaultProps={{
          number: '01',
          title: 'El origen',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="ChapterMarker-Horizontal"
        component={ChapterMarker}
        durationInFrames={75}
        fps={30}
        width={1920}
        height={1080}
        schema={chapterMarkerSchema}
        defaultProps={{
          number: '01',
          title: 'El origen',
          accentColor: '#C6A35D',
        }}
      />

      <Composition
        id="AtmosphericOverlay-Vertical"
        component={AtmosphericOverlay}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        schema={atmosphericOverlaySchema}
        defaultProps={{
          type: 'grain',
          opacity: 0.35,
        }}
      />
      <Composition
        id="AtmosphericOverlay-Horizontal"
        component={AtmosphericOverlay}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={atmosphericOverlaySchema}
        defaultProps={{
          type: 'grain',
          opacity: 0.35,
        }}
      />

      <Composition
        id="CreditRoll-Vertical"
        component={CreditRoll}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={creditRollSchema}
        defaultProps={{
          credits: [
            { role: 'Dirección', name: 'Xavier Motjellinas' },
            { role: 'Producción', name: 'BMP Studio' },
            { role: 'Fotografía', name: 'Equipo BMP' },
            { role: 'Edición', name: 'Claude · BMP' },
            { role: 'Música', name: 'Licencia comercial' },
          ],
          speed: 1,
          font: 'serif',
          accentColor: '#C6A35D',
        }}
      />
      <Composition
        id="CreditRoll-Horizontal"
        component={CreditRoll}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={creditRollSchema}
        defaultProps={{
          credits: [
            { role: 'Dirección', name: 'Xavier Motjellinas' },
            { role: 'Producción', name: 'BMP Studio' },
            { role: 'Fotografía', name: 'Equipo BMP' },
            { role: 'Edición', name: 'Claude · BMP' },
            { role: 'Música', name: 'Licencia comercial' },
          ],
          speed: 1,
          font: 'serif',
          accentColor: '#C6A35D',
        }}
      />
    </>
  );
};

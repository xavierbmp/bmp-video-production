# BMP Video Production — Guía Definitiva de Recursos

> **Lee esta guía al inicio de cada proyecto.**
> Contiene TODOS los recursos disponibles y CUÁNDO usar cada uno.
> Si un recurso de esta lista puede hacer lo que necesitas, ÚSALO.
> No reinventes la rueda con comandos manuales.

---

## ÍNDICE RÁPIDO — ¿QUÉ NECESITO HACER?

| Necesito... | Herramienta | Comando rápido |
|-------------|------------|----------------|
| Crear proyecto nuevo | `new-client.sh` | `new-client.sh "ClientName"` |
| Elegir template | `template-selector.sh` | `template-selector.sh --keywords "talking head vertical"` |
| Ingestar footage | `ingest.sh` | `ingest.sh /Volumes/SD CLIENTS/Name` |
| Inspeccionar un archivo | `probe.sh` | `probe.sh clip.mp4` |
| Ver qué hay en un clip | `thumbnail.sh` | `thumbnail.sh clip.mp4 sheet.jpg --grid 3x3` |
| Detectar escenas | `scene-detect.sh` | `scene-detect.sh long.mp4 --threshold 27` |
| Crop centrado en cara | `face-detect-crop.py` | `face-detect-crop.py bruto.mp4 --target 1080x1920 --verify check.jpg` |
| Cortar un clip | `trim.sh` | `trim.sh in.mp4 00:00:10 00:00:25 out.mp4` |
| Unir clips | `concat.sh` | `concat.sh --reencode -o out.mp4 a.mp4 b.mp4` |
| Transición entre clips | `crossfade.sh` | `crossfade.sh -o out.mp4 --transition fade --duration 0.5 a.mp4 b.mp4` |
| Cambiar aspecto | `reframe.sh` | `reframe.sh in.mp4 out.mp4 9x16 --mode crop` |
| Cambiar velocidad | `speed.sh` | `speed.sh in.mp4 out.mp4 1.5` |
| Quitar silencios | `auto-cut.sh` | `auto-cut.sh interview.mp4 tight.mp4 --threshold 0.03` |
| Estabilizar video | `stabilize.sh` | `stabilize.sh shaky.mp4 stable.mp4` |
| Animar foto | `ken-burns.sh` | `ken-burns.sh photo.jpg out.mp4 --duration 5 --direction in` |
| Color grading | `color-grade.sh` | `color-grade.sh in.mp4 out.mp4 --preset editorial` |
| Igualar color entre clips | `color-match.sh` | `color-match.sh clip.mp4 reference.jpg matched.mp4` |
| Quitar fondo | `remove-bg.sh` | `remove-bg.sh product.jpg out.png` |
| Transcribir audio | `transcribe.sh` | `transcribe.sh in.mp4 --lang es --burn` |
| Subtítulos profesionales | `subtitle-pro.sh` | `subtitle-pro.sh in.mp4 --lang es --style editorial --burn` |
| Normalizar audio | `normalize-audio.sh` | `normalize-audio.sh in.mp4 out.mp4 --lufs -14` |
| Añadir música + ducking | `music-mix.sh` | `music-mix.sh video.mp4 music.mp3 out.mp4 --duck` |
| Separar voces/instrumental | `stem-split.sh` | `stem-split.sh music.mp3` |
| Detectar BPM | `bpm.py` | `bpm.py music.mp3 --json` |
| Texto sobre video | `text-overlay.sh` | `text-overlay.sh in.mp4 out.mp4 --text "TITLE"` |
| Watermark/logo | `watermark.sh` | `watermark.sh in.mp4 out.mp4 --pos br --scale 0.12` |
| OCR en video | `ocr.sh` | `ocr.sh video.mp4 --lang spa+eng` |
| Motion graphics | `remotion-render.sh` | `remotion-render.sh EndCard-Vertical out.mp4 --props '{...}'` |
| Split-screen animado | `split-screen-expand.py` | `split-screen-expand.py base.mp4 overlay.png out.mp4` |
| Render desde timeline | `render-edit.py` | `render-edit.py timeline.json out.mp4` |
| QA automatizado | `qa-check.sh` | `qa-check.sh out.mp4 --target-lufs -14 --target-width 1080` |
| QA visual | `qa-visual.sh` | `qa-visual.sh out.mp4` |
| Export multi-plataforma | `export-social.sh` | `export-social.sh master.mp4 Client all` |
| Limpiar intermedios | `cleanup.sh` | `cleanup.sh "Client" --dry-run` |

---

## REMOTION — 25 COMPOSICIONES DE MOTION GRAPHICS

### Cuándo usar Remotion vs ffmpeg:
- **Remotion**: animaciones complejas (springs, reveals, contadores, wipes)
- **ffmpeg drawtext**: texto simple sobre video (LowerThird, títulos estáticos)
- **NUNCA**: Remotion + colorkey para overlay de texto (causa blur)

### Composiciones por categoría:

#### Intros y Outros
| Composición | Duración | Qué hace | Ejemplo |
|-------------|----------|----------|---------|
| `BMPIntro-Vertical` | 3s | Letras suben con stagger + línea dorada | `remotion-render.sh BMPIntro-Vertical out.mp4 --props '{"brand":"LIVITUM"}'` |
| `LogoSting-Vertical` | 3s | Logo con spring bounce + línea | `remotion-render.sh LogoSting-Vertical out.mp4 --props '{"logoSrc":"logo.png","style":"spring"}'` |
| `EndCard-Vertical` | 4s | Marca + CTA + URL con stagger | `remotion-render.sh EndCard-Vertical out.mp4 --props '{"brand":"X","cta":"DESCUBRE","url":"x.com"}'` |
| `LivitumEndCard-Vertical` | 5s | Logo Livitum + Trustpilot stars | `remotion-render.sh LivitumEndCard-Vertical out.mp4 --props '{"logoSrc":"livitum-logo-transparent.png"}'` |

#### Texto Animado
| Composición | Duración | Qué hace | Cuándo usar |
|-------------|----------|----------|-------------|
| `HookText-Vertical` | 2.5s | Líneas de texto con stagger (bold/serif/minimal) | Gancho inicial, pregunta retórica |
| `TitleReveal-Vertical` | 3.5s | Palabras aparecen una a una | Lanzamiento producto, título de sección |
| `CinematicTitle-Vertical` | 4.5s | Texto grande con fade lento + drift vertical | Inicio de brand film, apertura dramática |
| `TitleCard-Vertical` | 3s | Título + subtítulo fullscreen | Divisor de escenas (ANTES/DESPUÉS) |
| `ChapterMarker-Vertical` | 2.5s | Número + línea + título (01 — Origen) | Documental, serie multi-parte |

#### Datos y Callouts
| Composición | Duración | Qué hace | Cuándo usar |
|-------------|----------|----------|-------------|
| `MetricCounter-Vertical` | 3s | Número animado con spring ("+10,000") | KPIs, stats, social proof |
| `FeatureCallout-Vertical` | 2.5s | Línea + badge de texto | Beneficios producto, features |
| `NotificationToast-Vertical` | 2s | Toast que sube desde abajo | Mockup de app, confirmación |
| `PricingCard-Vertical` | 4s | 3 cards de pricing con cascade | SaaS pricing, planes |

#### Imágenes y Reveals
| Composición | Duración | Qué hace | Cuándo usar |
|-------------|----------|----------|-------------|
| `ScreenReveal-Vertical` | 3.5s | Imagen se revela con clip-path | Mockup de UI, screenshot |
| `BeforeAfterSplit-Vertical` | 3.5s | Divisor vertical con labels | Antes/después estático |
| `BeforeAfterReveal-Vertical` | 4s | 3 imágenes con wipe + zoom final | Interiorismo: antes→render→después |
| `SplitDiptych-Vertical` | 4s | Dos paneles con divisor central | Comparación A vs B |

#### Lower Thirds y Créditos
| Composición | Duración | Qué hace | Cuándo usar |
|-------------|----------|----------|-------------|
| `LowerThird-Vertical` | 4s | Nombre + rol con slide-in + línea | Entrevistas, presentaciones |
| `LivitumLowerThird-Vertical` | 3.5s | Custom con pill oscuro + oro | Proyecto Livitum específico |
| `CreditRoll-Vertical` | 10s | Créditos scrolling | Final de brand film |

#### Overlays y Utilidades
| Composición | Duración | Qué hace | Cuándo usar |
|-------------|----------|----------|-------------|
| `ColorWash-Vertical` | 1.5s | Overlay de color con fade | Transición entre actos |
| `AtmosphericOverlay-Vertical` | 5s | Grano/polvo/viñeta (grain/dust/vignette) | Textura editorial, look vintage |

---

## ESTILOS DE SUBTÍTULOS

| Estilo | Font | Tamaño | Look | Usar para |
|--------|------|--------|------|-----------|
| `editorial` | DM Serif Display | 44pt | Blanco, outline negro, sin caja | Documental, editorial, lujo |
| `social` | Inter Bold | 56pt | Blanco sobre caja negra | TikTok, Reels, ritmo rápido |
| `luxury` | Playfair Display | 40pt | Crema, sombra sutil | Marcas premium, belleza |

**Empírico para 1080×1920 (FontSize en libass):**
- FontSize 8: mínimo legible
- FontSize 10-12: editorial limpio (RECOMENDADO)
- FontSize 18+: demasiado grande, wrappea
- FontSize 22+: cubre todo el frame

---

## PRESETS DE EXPORTACIÓN

| Plataforma | Resolución | Aspecto | Max dur | LUFS | Uso |
|-----------|-----------|---------|---------|------|-----|
| `instagram-reel` | 1080×1920 | 9:16 | 90s | -14 | Reels verticales |
| `instagram-story` | 1080×1920 | 9:16 | 60s | -14 | Stories |
| `instagram-feed` | 1080×1080 | 1:1 | 60s | -14 | Feed cuadrado |
| `tiktok` | 1080×1920 | 9:16 | 10min | -14 | TikTok |
| `youtube` | 1920×1080 | 16:9 | ∞ | -14 | YouTube estándar |
| `youtube-4k` | 3840×2160 | 16:9 | ∞ | -14 | YouTube 4K |
| `youtube-shorts` | 1080×1920 | 9:16 | 60s | -14 | Shorts |
| `linkedin` | 1920×1080 | 16:9 | 10min | -14 | LinkedIn |
| `master` | 1920×1080 | 16:9 | ∞ | -16 | Archivo (CRF 14) |

**Comando:** `export-social.sh master.mp4 Client all` genera TODAS las versiones.

---

## PAQUETES PYTHON DISPONIBLES

### Transcripción y Audio
| Paquete | Qué hace | Script que lo usa |
|---------|----------|-------------------|
| `faster-whisper` | Transcripción rápida con word timestamps | `transcribe.sh`, uso directo en Python |
| `stable-ts` | Whisper mejorado con timing word-level | `subtitle-pro.sh` |
| `librosa` | Análisis de audio (BPM, beats, espectro) | `bpm.py` |
| `demucs` | Separación de stems (voz/instrumental) | `stem-split.sh` |
| `soundfile` | Lectura/escritura de WAV | Análisis de waveform |

### Visión por Computador
| Paquete | Qué hace | Script que lo usa |
|---------|----------|-------------------|
| `opencv-python` | Detección de caras, tracking, procesado de imagen | `face-detect-crop.py` |
| `rembg` | Eliminación de fondo con IA (U²-Net) | `remove-bg.sh` |
| `katna` | Smart-crop content-aware (Mediapipe) | Disponible, sin script wrapper |
| `scenedetect` | Detección automática de escenas | `scene-detect.sh` |

### Color y Calidad
| Paquete | Qué hace | Script que lo usa |
|---------|----------|-------------------|
| `color-matcher` | Transfer de color entre frames/clips | `color-match.sh` |
| `ffmpeg-quality-metrics` | VMAF/SSIM/PSNR scoring | `qa-check.sh --master` |

### Composición de Video
| Paquete | Qué hace | Script que lo usa |
|---------|----------|-------------------|
| `moviepy` 2.2.1 | Edición programática en Python | Disponible para edits complejos |
| `av` (PyAV) 15.1 | Bindings directos a ffmpeg (bajo nivel) | Acceso frame-a-frame preciso |
| `Pillow` 11.3 | Procesado de imágenes | Manipulación de frames, watermarks |
| `numpy` 2.0 | Operaciones numéricas sobre frames | `split-screen-expand.py` |

### Machine Learning
| Paquete | Qué hace | Script que lo usa |
|---------|----------|-------------------|
| `torch` 2.8 | Framework deep learning (GPU) | Backend para demucs, rembg |
| `onnxruntime` 1.19 | Inferencia de modelos ONNX | rembg background removal |

### Utilidades
| Paquete | Qué hace | Para qué |
|---------|----------|----------|
| `rich` | Terminal bonito (progress bars, tablas) | Output de scripts |
| `Jinja2` | Templates | Generar timelines desde templates |
| `beautifulsoup4` | Parseo HTML | Extraer info de briefs HTML |
| `jsonschema` | Validación JSON | Validar timeline.json |
| `tqdm` | Barras de progreso | Renders largos |

### Capacidades NO instaladas (para futuro)
| Capacidad | Paquete necesario | Para qué |
|-----------|-------------------|----------|
| Upscaling IA | Real-ESRGAN | Subir resolución de footage viejo |
| Text-to-Speech | Coqui TTS / Bark | Generar VO desde texto |
| Chroma key avanzado | — | Usar filtros ffmpeg (chromakey) |
| 3D compositing | Blender Python | Composición 3D |

---

## HERRAMIENTAS DE SISTEMA (BREW)

| Herramienta | Qué hace | Cuándo usar |
|-------------|----------|-------------|
| `ffmpeg` (full 8.1) | TODA la edición de video/audio. Incluye libx264/x265, vidstab, libass, videotoolbox HW accel | Siempre |
| `ffprobe` | Inspección de metadatos | Verificación SAR, duración, codecs |
| `mediainfo` | Metadatos ultra-detallados | Debugging de codecs, color space |
| `imagemagick` | Procesado de imágenes (convert, identify, mogrify) | Thumbnails, crops, resize de imagen |
| `jq` | Parseo de JSON en terminal | template-selector.sh, configs, briefs |
| `tesseract` | OCR (reconocimiento de texto) | `ocr.sh`, extraer texto de frames |
| `sox` | Navaja suiza de audio CLI | Manipulación de audio avanzada, efectos |
| `rubberband` | Time-stretch sin cambiar pitch | Cambio de velocidad preservando tono |
| `yt-dlp` | Descarga video/audio de web | Referencias, música con licencia |

### Herramientas pipx (CLI aisladas)
| Herramienta | Qué hace |
|-------------|----------|
| `auto-editor` 29.3.1 | Eliminar silencios automáticamente (talking head) |
| `openai-whisper` 20250625 | Transcripción CLI con Whisper |

## HERRAMIENTA WEB — BRIEFING FORM

`_SYSTEM/tools/briefing-form.html` — Formulario web interactivo para capturar briefs.

**Cómo usar:** Abrir en navegador → rellenar campos → descargar JSON

**Campos del formulario:**
- Identidad del proyecto (cliente, nombre)
- Tipo de video (SaaS, fashion, brand film, otro)
- Formato (aspect ratio: 9:16, 16:9, 1:1, 4:5; slider de duración 15-120s)
- Plataformas destino (Instagram, TikTok, YouTube, LinkedIn)
- Mood y referencias (keywords + links)
- Música (proporcionada / ninguna / describir)
- Subtítulos (toggle + idioma)
- Watermark (ninguno / BMP studio / logo cliente)
- Notas especiales

**Output:** `brief-input.json` → copiar a `brief.json in project root (` del proyecto

**Auto-save:** Guarda borradores en localStorage cada 5s

---

## FONTS INSTALADAS

| Font | Estilo | Usar para |
|------|--------|-----------|
| **DM Serif Display** | Serif display | Títulos, headings, subtítulos editorial |
| **Inter** | Sans-serif moderno | Body, captions, subtítulos social |
| **Playfair Display** | Serif elegante | Lujo, belleza, premium |
| **Libre Baskerville** | Serif editorial | Magazine, editorial |

---

## BRAND CONFIG (bmp-brand.json)

| Elemento | Valor |
|----------|-------|
| Primary color | `#0A0A0A` (negro) |
| Secondary color | `#F2F0EB` (off-white) |
| Accent color | `#C6A35D` (dorado) |
| Display font | DM Serif Display |
| Body font | Inter |
| Luxury font | Playfair Display |
| LUFS target | -14 (social), -16 (master) |
| Watermark | `_ASSETS/logos/bmp-watermark.png` |

---

## PLANTILLAS DE TIMELINE

| Template | Duración | Aspecto | Tipo |
|----------|----------|---------|------|
| `talking-head-vertical-30s` | 30s | 9:16 | Speaker + b-roll intercut |
| `interior-design-spotlight-30s` | 30s | 9:16 | Diseño interior + before/after |
| `saas-product-30s` | 30s | variable | Demo de producto SaaS |
| `saas-product-60s` | 60s | variable | Demo extendida |
| `fashion-music-30s` | 30s | variable | Moda con música |
| `fashion-music-60s` | 60s | variable | Moda extendida |
| `brand-film-60s` | 60s | variable | Narrativa de marca |
| `brand-film-90s` | 90s | variable | Brand film extendido |

---

## BRIEFING FORM HTML

`_SYSTEM/tools/briefing-form.html` — formulario web que el usuario puede rellenar
en el navegador. Exporta `brief-input.json` con todos los campos estructurados.

**Campos:**
- Tipo de video, aspecto, duración, plataformas
- Mood, estilo, música
- Datos del speaker
- Entregables requeridos
- Colores de marca

**Cómo usar:** Abrir en navegador → rellenar → guardar JSON → copiar a `brief.json in project root (`

---

## PATRONES DE USO COMUNES

### Talking Head Vertical (Reel/TikTok)
```
1. face-detect-crop.py bruto.mp4 --verify    → verificar crop
2. face-detect-crop.py bruto.mp4 --apply     → aplicar crop
3. subtitle-pro.sh --style editorial --burn   → subtítulos
4. remotion-render.sh LowerThird-Vertical     → nombre del speaker
5. remotion-render.sh EndCard-Vertical        → cierre con CTA
6. render-edit.py timeline.json               → render final
7. qa-check.sh                                → verificar
8. export-social.sh all                       → todas las plataformas
```

### Música + B-roll (Fashion)
```
1. bpm.py music.mp3 --json                    → detectar beats
2. Alinear cortes a phrase_ends en timeline.json
3. color-grade.sh --preset luxury             → look consistente
4. color-match.sh clips contra referencia     → coherencia
5. ken-burns.sh en stills                     → animar fotos
6. render-edit.py timeline.json               → render
7. normalize-audio.sh --lufs -14              → loudness
```

### Before/After (Interiorismo)
```
1. remotion-render.sh BeforeAfterReveal-Vertical  → wipe animation
2. split-screen-expand.py                          → expansión
3. face-detect-crop.py en talking head             → crop
4. subtitle-pro.sh --style editorial               → subtítulos
5. render-edit.py                                  → render
```

### Quick Social Clip
```
1. auto-cut.sh interview.mp4 --threshold 0.03  → quitar silencios
2. transcribe.sh --lang es --burn               → subtítulos rápidos
3. reframe.sh out.mp4 vertical.mp4 9x16        → vertical
4. normalize-audio.sh --lufs -14                → loudness
5. export-social.sh vertical.mp4 Client all     → exportar
```

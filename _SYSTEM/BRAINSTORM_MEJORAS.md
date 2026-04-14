# Brainstorming: Mejoras de calidad para BMP Video Production

> Compilado tras el proyecto Livitum Diseñadora (11 versiones, 428 archivos
> intermedios, 1.4GB, 7.5h de producción para un video de 30s).

---

## DATOS DEL PROYECTO LIVITUM

| Métrica | Valor |
|---------|-------|
| Versiones entregadas | 11 |
| Sub-iteraciones | 20+ (v7a-e, v10a-e, v11a-l) |
| Archivos intermedios | 428 |
| Espacio consumido | 1.4 GB |
| Duración final | 30.1s |
| Tiempo de producción | ~7.5 horas |
| Scripts disponibles | 32 |
| Scripts usados | ~3 (remotion-render, concat manual, ffmpeg directo) |
| Utilización del toolkit | ~10% |
| Clips disponibles | 17 interiores + 28 pikaso + 1 bruto |
| Clips usados | 6 interiores (35%) |

---

## RECURSOS DISPONIBLES QUE NO SE USARON

### Scripts que habrían evitado problemas:

| Script | Qué hace | Problema que habría evitado |
|--------|----------|---------------------------|
| `qa-check.sh` | QA automatizado (LUFS, resolución, silencio, negro) | v01-v05 habrían fallado QA inmediatamente |
| `subtitle-pro.sh` | Subtítulos pro con stable-ts + ASS styling | FontSize=22 nunca habría llegado al usuario |
| `render-edit.py` | Render declarativo desde timeline.json | No se habría construido manualmente con ffmpeg |
| `color-match.sh` | Coherencia de color entre clips | B-roll de distintas fuentes sin normalizar |
| `export-social.sh` | Exportación multi-plataforma automática | Solo se exportó IGReel, no TikTok/YT Shorts |
| `normalize-audio.sh` | Normalización EBU R128 en un comando | Normalización manual con errores |
| `bpm.py` | Detección de BPM y beats | Cortes no alineados a la música |
| `probe.sh` | Inspección de metadatos | SAR=32:27 no se detectó a tiempo |
| `reframe.sh` | Reframe automático | Crop de Patricia hecho manualmente con error |

### Paquetes Python instalados pero no usados:

| Paquete | Qué hace | Utilidad potencial |
|---------|----------|-------------------|
| `color_matcher` | Transfer de color entre clips | Consistencia visual en b-roll |
| `stable_whisper` | Subtítulos word-level con ASS | Subtítulos profesionales en un comando |
| `demucs` | Separación de stems (voz/instrumental) | Aislar VO de ruido ambiente |
| `katna` | Smart-crop con content-awareness | Auto-reframe horizontal→vertical sin face detection manual |
| `scenedetect` | Detección automática de escenas | Segmentar clips largos automáticamente |

### Remotion compositions disponibles pero no aprovechadas:

| Composición | Qué hace | Oportunidad perdida |
|-------------|----------|-------------------|
| `LogoSting` | Logo con spring animation | Podría haber sido la base del EndCard (ya existía) |
| `TitleReveal` | Texto word-by-word | Alternativa al LowerThird genérico |
| `ColorWash` | Overlay de color dissolve | Separación visual entre actos |
| `AtmosphericOverlay` | Film grain/dust loop | Textura editorial para b-roll |

---

## IDEAS DE MEJORA — CLASIFICADAS POR IMPACTO

### 🔴 IMPACTO CRÍTICO (evitan el 80% de los problemas)

#### 1. Pipeline render-edit.py obligatorio
En vez de construir manualmente con ffmpeg, SIEMPRE crear un `timeline.json`
y renderizar con `render-edit.py`. Esto:
- Hace cada decisión explícita y auditable
- Permite rollback instantáneo (cambiar un clip = editar una línea)
- Integra normalización, subs, music mix en un solo paso
- Genera un documento que el usuario puede revisar ANTES del render

#### 2. qa-check.sh automático tras cada render interno
Nunca presentar al usuario sin pasar el QA automatizado:
```bash
qa-check.sh render.mp4 --target-lufs -14 --target-duration 30 \
  --target-width 1080 --target-height 1920
```
Si FAIL → arreglar y re-renderizar. Sin excepciones.

#### 3. Verificación visual frame-by-frame obligatoria
Tras cada cambio:
1. Extraer frame al timestamp del cambio
2. Leerlo con Read tool
3. Describir lo que se ve
4. Comparar con el request del usuario
5. Si no coincide → arreglar → repetir

#### 4. face-detect-crop.py para cualquier reframe
Nunca asumir la posición del sujeto. Script que:
1. Extrae frame de referencia
2. Detecta cara con OpenCV
3. Calcula crop centrado en la cara
4. Verifica visualmente con Read

#### 5. subtitle-pro.sh como estándar
Nunca crear SRT manualmente. SIEMPRE:
```bash
subtitle-pro.sh assembly.mp4 --lang es --style editorial --burn
```
Genera subtítulos con timing word-level, estilo ASS, y burn verificado.

---

### 🟡 IMPACTO ALTO (mejoran la calidad y velocidad)

#### 6. Template selector automático
Al recibir un brief, el sistema sugiere la plantilla más cercana:
- "talking head + b-roll" → `talking-head-vertical-30s.json`
- "interior design spotlight" → `interior-design-spotlight-30s.json`
- "product showcase" → `saas-product-30s.json`
- "brand film" → `brand-film-60s.json`

#### 7. Color matching automático entre clips
Cuando hay 3+ clips de fuentes diferentes:
```bash
# Seleccionar clip de referencia (el de mejor look)
color-match.sh clip2.mp4 reference.jpg matched_clip2.mp4 --method mkl
```
Repetir para cada clip. Resultado: coherencia visual editorial.

#### 8. Beat-sync editing para proyectos con música
```bash
bpm.py music.mp3 --json > beats.json
# Usar phrase_ends (cada 8 barras) como cut points en timeline.json
```
Los cortes caen en frases musicales, no en sitios arbitrarios.

#### 9. export-social.sh para delivery multi-plataforma
Un solo comando genera 7 versiones optimizadas:
```bash
export-social.sh master.mp4 ClientName all
```
Instagram Reel, Story, Feed, TikTok, YouTube Shorts, YouTube, LinkedIn.

#### 10. Cleanup automático de archivos intermedios
Tras aprobar la versión final:
```bash
# Mover intermedios a 99_ARCHIVE/
# Mantener solo: raw/, master, timeline.json, SRT final
```
Evita acumular 1.4GB de archivos temporales.

---

### 🟢 IMPACTO MEDIO (mejoran la experiencia)

#### 11. Remotion compositions parametrizables
En vez de crear composiciones custom por cliente, usar props configurables:
```bash
remotion-render.sh LowerThird-Vertical output.mp4 \
  --props '{"name":"Patricia Ruiz","role":"Diseñadora","accentColor":"#F5A623","position":"lower-third","animation":"slide-in"}'
```
Misma composición, diferentes marcas.

#### 12. Preview rápido antes de render final
Generar un preview a baja resolución (540x960, CRF 35) en segundos
para validar estructura/timing antes del render final en alta calidad.

#### 13. Automatic asset catalog
Al ingestar material, generar automáticamente:
- Contact sheet de cada clip
- Metadata (resolución, duración, codec)
- Tags de Finder detectados
- Thumbnails para referencia visual

#### 14. Composition decision tree
Documento visual que guía: "¿Qué composición Remotion uso?"
```
¿Necesitas texto animado? → TitleReveal / HookText
¿Lower third con nombre? → LowerThird (genérico) o Custom
¿End card con logo? → EndCard / LogoSting
¿Before/after? → BeforeAfterReveal / BeforeAfterSplit
¿Métricas/números? → MetricCounter
```

#### 15. LUT library
Crear una colección de LUTs (.cube) para looks consistentes:
- `editorial-warm.cube` — el look de Livitum
- `fashion-cool.cube` — moda con tonos fríos
- `luxury-matte.cube` — blacks levantados, saturación baja
- `bw-contrast.cube` — B&N editorial

---

### 🔵 MEJORAS DE ARQUITECTURA (largo plazo)

#### 16. Timeline.json v2 con soporte para:
- Motion graphics con props de Remotion
- Color grading con preset/LUT reference
- Beat-sync markers de bpm.py
- QA targets integrados
- Split-screen layouts con especificación de capas

#### 17. Project template generator desde brief
Basado en el brief-input.json, auto-generar:
- Estructura de carpetas
- Timeline template pre-rellenado
- Lista de scripts recomendados
- Composiciones Remotion sugeridas

#### 18. Version control para edits
Git tracking de timeline.json + SRT + creative direction.
Cada cambio del usuario = commit con diff claro.
Rollback = `git checkout` de la versión anterior.

#### 19. Audio waveform visualization
Script que genera una imagen del waveform con marcadores de corte.
Permite verificar visualmente que los cortes están en silencios.

#### 20. Automated regression testing
Después de un cambio, verificar que TODO lo que estaba bien SIGUE bien:
- SAR sigue siendo 1:1
- Audio sigue siendo completo
- Clips no cambiados siguen en su posición
- Subtítulos no se han movido
- EndCard sigue intacto

---

## PLANTILLAS CREADAS

Basado en el proyecto Livitum, se han creado estas plantillas:

1. **`talking-head-vertical-30s.json`** — Plantilla genérica para video de talking head
   vertical con b-roll intercuts. Aplicable a cualquier marca/profesional.

2. **`interior-design-spotlight-30s.json`** — Plantilla específica derivada de Livitum v11.
   Incluye split-screen reveal, before/after, Trustpilot social proof.

Ambas en `_SYSTEM/presets/timelines/`.

---

## RESUMEN: DE 11 ITERACIONES A 2-3

Si se hubieran usado los recursos disponibles desde el principio:

| Iteración | Con herramientas | Sin herramientas (Livitum real) |
|-----------|-----------------|-------------------------------|
| v01 | Timeline.json + render-edit.py → qa-check.sh → PASS | Manual ffmpeg → no QA → 6 errores |
| v02 | Feedback del usuario → edit timeline → re-render → QA PASS | Re-cut manual → errores de audio, crop, subs |
| v03 | Ajuste fino → APROBADO | ... |
| v04-v11 | No necesarios | Arreglar errores evitables uno por uno |

**Inversión en usar las herramientas: 30 min de setup.**
**Ahorro: ~5 horas de iteraciones y frustración.**

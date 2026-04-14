# BMP — Video Production

Hub de post-producción de **BMP** (Barcelona, AI content para fashion,
cosmetics & luxury). Esta carpeta contiene la arquitectura, scripts y
plantillas para llevar cualquier proyecto de video desde la ingesta hasta la
entrega multi-plataforma.

> **Lee primero `CLAUDE.md`** — es la guía completa que también usa Claude
> Code para asistirte. Este README es la versión rápida para humanos.

---

## Quick start

### 1. Instala las dependencias (una sola vez)

```bash
brew install ffmpeg jq
# Subtítulos opcionales:
pip install -U openai-whisper        # más lento, fácil
# o
brew install whisper-cpp             # más rápido
```

### 2. Crea un cliente
```bash
_SYSTEM/scripts/new-client.sh "Vulcano"
```

### 3. Ingesta el material
```bash
_SYSTEM/scripts/ingest.sh /Volumes/SD_CARD/DCIM Vulcano
```

### 4. Genera proxies para editar
```bash
_SYSTEM/scripts/proxy.sh Vulcano
```

### 5. Edita en tu NLE de elección
DaVinci Resolve / Premiere / FCP. Guarda los proyectos en
`CLIENTS/Vulcano/03_EDIT/timelines/`. Apunta el media manager a la carpeta
`01_FOOTAGE/proxies/`.

### 6. Exporta el master desde el NLE
Ponlo en `CLIENTS/Vulcano/05_EXPORTS/master/Vulcano_BrandFilm_Master_v01.mp4`.

### 7. Genera todas las versiones para redes
```bash
_SYSTEM/scripts/export-social.sh \
  CLIENTS/Vulcano/05_EXPORTS/master/Vulcano_BrandFilm_Master_v01.mp4 \
  Vulcano all
```

¡Listo! Tendrás versiones para Instagram Reel, Story, Feed, TikTok, YouTube,
YouTube Shorts y LinkedIn, cada una con loudness a -14 LUFS.

---

## Estructura

```
02_VIDEO EDITS/
├── CLAUDE.md              ← guía maestra (la lee Claude y la lees tú)
├── README.md              ← este archivo
├── _SYSTEM/               ← scripts, presets, plantillas, config
│   ├── scripts/           ← bash + ffmpeg para todo el pipeline
│   ├── presets/           ← export-presets.json + ffmpeg-recipes.md + LUTs
│   ├── templates/         ← _CLIENT_TEMPLATE/ (skeleton)
│   └── config/            ← bmp-brand.json
├── _ASSETS/               ← logos, música, sfx, fonts, intros del estudio
├── _DELIVERABLES/         ← archivo final de entregas aprobadas
├── 00_INBOX/              ← drop zone para footage sin clasificar
└── CLIENTS/
    └── Livitum/           ← un folder por cliente
        ├── PROJECT.md
        ├── 00_BRIEF/   01_FOOTAGE/   02_ASSETS/   03_EDIT/
        ├── 04_RENDERS/ 05_EXPORTS/   06_REVIEW/   99_ARCHIVE/
```

## Scripts disponibles

| Script               | Para qué sirve                                              |
|----------------------|-------------------------------------------------------------|
| `new-client.sh`      | Crear un cliente desde la plantilla                         |
| `ingest.sh`          | Copiar footage de SD/USB con SHA256 + manifiesto            |
| `proxy.sh`           | Generar proxies 1080p H.264 para editar                     |
| `probe.sh`           | Inspeccionar metadatos de un archivo                        |
| `trim.sh`            | Cortar una sección (lossless o frame-accurate)              |
| `concat.sh`          | Unir clips (stream copy o re-encode normalizado)            |
| `normalize-audio.sh` | Loudness EBU R128 a -14 LUFS (dos pases)                    |
| `watermark.sh`       | Overlay del logo BMP                                        |
| `thumbnail.sh`       | Frame still o contact sheet                                 |
| `transcribe.sh`      | Subtítulos auto via Whisper, opción de quemarlos            |
| `export-social.sh`   | Exportar a uno o todos los presets de redes                 |

Más detalles: `CLAUDE.md` y `_SYSTEM/presets/ffmpeg-recipes.md`.

## Convenciones de nombres

```
{Client}_{Project}_{Format}_v{NN}.mp4

Livitum_AvsD_IGReel_v03.mp4
Livitum_BrandFilm_Master_v01.mp4
Vulcano_SS26_TikTok_v02.mp4
```

Formatos válidos: `Master, IGReel, IGStory, IGFeed, TikTok, YT16x9, YTShort, LinkedIn`.

## Loudness y color

- **-14 LUFS** integrated, **-1 dBTP**, **LRA 11** para social.
- **-16 LUFS** para masters de archivo.
- Color en **Rec.709** salvo proyectos HDR específicos.

## Cliente de ejemplo

`CLIENTS/Livitum/` ya está creado y enlazado a la carpeta existente del
cliente en `01_Ops/Livitum/`. Lee `CLIENTS/Livitum/PROJECT.md`.

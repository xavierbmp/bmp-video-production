# Instrucciones para Claude — Setup BMP Video Production en Windows

> **CONTEXTO PARA CLAUDE:** Tu usuario (Bernat) es compañero de Xavier en BMP,
> un estudio de producción de video con IA en Barcelona. El toolkit de producción
> está en un repo de GitHub. Tu trabajo es instalarlo TODO en su Windows sin que
> Bernat tenga que hacer nada manualmente. Él solo te habla a ti.

---

## QUÉ ES ESTO

BMP Video Production es un sistema headless de edición de video. No hay
Premiere ni DaVinci — todo se hace con scripts de ffmpeg, Python, y Remotion
(motion graphics en React). El sistema incluye:

- 32+ scripts de producción (crop, concat, subtítulos, color, audio, QA)
- 25 composiciones de motion graphics animadas (intros, lower thirds, end cards)
- Templates de timeline para distintos tipos de video
- Presets de exportación para Instagram, TikTok, YouTube, LinkedIn
- Sistema de verificación de calidad automatizado
- Guías de workflow y checklists

**Repo:** https://github.com/xavierbmp/bmp-video-production (público)

---

## INSTALACIÓN EN WINDOWS — PASO A PASO

**El usuario NO tiene que hacer nada. Tú (Claude) haces todo.**

### Paso 1 — Instalar Chocolatey (gestor de paquetes Windows)

Necesitas ejecutar esto en PowerShell con permisos de administrador:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Si Chocolatey ya está instalado, sáltate este paso.

### Paso 2 — Instalar dependencias

```powershell
choco install -y git ffmpeg python3 nodejs-lts jq imagemagick tesseract
```

**Verificar que funciona:**
```powershell
ffmpeg -version
python --version
node --version
git --version
jq --version
```

### Paso 3 — Clonar el repo

```powershell
cd $HOME\Documents
git clone https://github.com/xavierbmp/bmp-video-production.git "BMP"
cd BMP
```

### Paso 4 — Crear entorno Python

```powershell
cd _SYSTEM
python -m venv .venv
.venv\Scripts\pip install `
  "scenedetect[opencv]" `
  librosa numpy Pillow moviepy `
  opencv-python-headless soundfile `
  faster-whisper "rembg[cpu]" onnxruntime `
  color-matcher stable-ts demucs `
  ffmpeg-quality-metrics scipy scikit-image
cd ..
```

**Verificar:**
```powershell
_SYSTEM\.venv\Scripts\python -c "import cv2; print('OpenCV OK')"
_SYSTEM\.venv\Scripts\python -c "from faster_whisper import WhisperModel; print('Whisper OK')"
_SYSTEM\.venv\Scripts\python -c "import librosa; print('librosa OK')"
```

### Paso 5 — Instalar pipx + herramientas CLI

```powershell
python -m pip install pipx
python -m pipx ensurepath
python -m pipx install auto-editor
python -m pipx install openai-whisper
```

### Paso 6 — Instalar Remotion (motion graphics)

```powershell
cd _SYSTEM\motion\bmp-motion
npm install
cd ..\..\..
```

### Paso 7 — Crear carpetas locales

```powershell
mkdir CLIENTS, 00_INBOX, _DELIVERABLES
mkdir _ASSETS\music, _ASSETS\stock, _ASSETS\sfx
```

### Paso 8 — Verificar que TODO funciona

```powershell
# Face detection test (sin video, solo importar)
_SYSTEM\.venv\Scripts\python -c "import cv2; print('Face detection: OK')"

# ffmpeg
ffmpeg -version | Select-Object -First 1

# Remotion
cd _SYSTEM\motion\bmp-motion
npx remotion compositions 2>$null | Select-Object -First 3
cd ..\..\..

# Template selector (Git Bash o traducir a PowerShell)
python _SYSTEM\scripts\template-selector.sh 2>$null || echo "Shell scripts need Git Bash — use Python scripts directly"
```

---

## CÓMO FUNCIONA EN WINDOWS

### Scripts que funcionan directamente (Python):
- `_SYSTEM\scripts\render-edit.py` — renderizar desde timeline.json
- `_SYSTEM\scripts\face-detect-crop.py` — crop centrado en cara
- `_SYSTEM\scripts\split-screen-expand.py` — animación split-screen
- `_SYSTEM\scripts\bpm.py` — detección de BPM

**Para ejecutarlos:**
```powershell
_SYSTEM\.venv\Scripts\python _SYSTEM\scripts\render-edit.py timeline.json output.mp4
_SYSTEM\.venv\Scripts\python _SYSTEM\scripts\face-detect-crop.py video.mp4 --target 1080x1920 --verify check.jpg
```

### Scripts .sh (bash) — cómo usarlos en Windows:

Los scripts .sh están hechos para bash (Mac/Linux). En Windows tienes dos opciones:

**Opción A — Git Bash** (se instala con git):
```bash
# Abrir Git Bash y ejecutar directamente:
bash _SYSTEM/scripts/probe.sh video.mp4
bash _SYSTEM/scripts/trim.sh input.mp4 00:00:05 00:00:15 output.mp4
```

**Opción B — Claude traduce a PowerShell:**
Los scripts .sh son wrappers de ffmpeg. Claude puede ejecutar los comandos
ffmpeg equivalentes directamente en PowerShell. Por ejemplo:

En vez de `probe.sh video.mp4`, ejecutar:
```powershell
ffprobe -v quiet -print_format json -show_streams video.mp4
```

En vez de `normalize-audio.sh video.mp4 output.mp4`, ejecutar:
```powershell
ffmpeg -i video.mp4 -af "loudnorm=I=-14:TP=-1:LRA=11" -c:v copy output.mp4
```

**Claude: siempre intenta Git Bash primero. Si no funciona, traduce a PowerShell.**

### Remotion (motion graphics) — funciona igual:
```powershell
cd _SYSTEM\motion\bmp-motion
npx remotion render BMPIntro-Vertical output.mp4 --props="{\"brand\":\"LIVITUM\"}"
cd ..\..\..
```

### ffmpeg — funciona exactamente igual que en Mac:
```powershell
ffmpeg -i input.mp4 -vf "scale=1080:-1,crop=1080:1920,setsar=1" -c:v libx264 output.mp4
```

---

## DOCUMENTACIÓN IMPORTANTE — LEER AL INICIO DE CADA SESIÓN

1. **`CLAUDE.md`** — Las reglas de producción, workflow obligatorio, anti-patrones.
   LÉELO ENTERO. Cada regla existe porque se violó y causó horas de trabajo perdido.

2. **`_SYSTEM\RESOURCE_GUIDE.md`** — Catálogo completo de todos los recursos:
   32 scripts, 25 composiciones Remotion, paquetes Python, presets. ANTES de
   hacer cualquier cosa manual, busca aquí si ya existe una herramienta.

3. **`_SYSTEM\VERIFY_CHECKLIST.md`** — Después de CADA comando ffmpeg/Python,
   ejecuta los checks de verificación. NUNCA asumas que un comando funcionó
   sin verificar el output.

---

## DIFERENCIAS WINDOWS vs MAC — CHEAT SHEET

| Mac | Windows |
|-----|---------|
| `source .venv/bin/activate` | `.venv\Scripts\activate` |
| `.venv/bin/python3` | `.venv\Scripts\python` |
| `brew install ffmpeg` | `choco install ffmpeg` |
| `chmod +x script.sh` | No necesario |
| `/tmp/` | `$env:TEMP\` |
| `~/Library/Fonts/` | `C:\Windows\Fonts\` |
| `open file.mp4` | `Start-Process file.mp4` |
| `bash script.sh` | `bash script.sh` (Git Bash) |
| `xattr -px ...` (Finder tags) | No disponible — pedir al usuario que indique clips |

---

## ACTUALIZAR EL TOOLKIT

Cuando Xavier o alguien del equipo mejore un script:

```powershell
cd $HOME\Documents\BMP
git pull
```

Los proyectos de clientes no se tocan (están en .gitignore).

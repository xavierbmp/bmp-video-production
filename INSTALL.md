# BMP Video Production — Guía de Instalación

> **Para Claude:** Lee este archivo completo y ejecuta los comandos en orden.
> Si alguno falla, diagnóstica y arregla antes de continuar.

## Plataformas soportadas

- **macOS** (Apple Silicon o Intel) — nativo
- **Windows 10/11** — via WSL2 (Windows Subsystem for Linux)
- **Linux** (Ubuntu/Debian) — nativo

---

## Instalación en Windows (WSL2)

> **Para el usuario de Windows: no tienes que hacer NADA manualmente.**
> Solo abre Claude Code y dile:
>
> *"Instala el toolkit de BMP Video Production desde
> https://github.com/xavierbmp/bmp-video-production — lee INSTALL.md y sigue todos los pasos"*
>
> Claude detectará que estás en Windows e instalará todo automáticamente.

### Qué hace Claude en Windows (todo automático):

1. Detecta que el sistema es Windows
2. Comprueba si WSL2 está instalado, si no lo instala:
   ```powershell
   wsl --install -d Ubuntu
   ```
   (Puede pedir reiniciar — Claude avisará)
3. Dentro de WSL2/Ubuntu, instala todas las dependencias:
   ```bash
   sudo apt install -y ffmpeg jq python3 python3-venv nodejs npm ...
   ```
4. Clona el repo, crea el venv Python, instala Remotion, crea carpetas
5. Verifica que todo funciona

> **Nota:** WSL2 no cambia nada del PC. Es como una app más.
> Los archivos se acceden desde Windows en `\\wsl$\Ubuntu\home\tu_usuario\`.

### Si Claude Code está en Windows nativo (sin WSL2):

Los scripts de Python (`face-detect-crop.py`, `split-screen-expand.py`, `render-edit.py`,
`bpm.py`) funcionan directamente en Windows si ffmpeg está en el PATH.
Los scripts .sh necesitan WSL2 o Git Bash.

**Opción rápida sin WSL2:** Instalar solo ffmpeg + Python + Node.js en Windows
y usar los scripts .py directamente. Claude puede adaptar los comandos .sh
a equivalentes de PowerShell si es necesario.

---

## Instalación en macOS

### Requisitos previos

- macOS (Apple Silicon o Intel)
- Homebrew instalado (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- Node.js 18+ (`brew install node`)
- Python 3.9+ (`brew install python@3.9` o superior)

---

## Paso 1 — Clonar el repositorio

```bash
cd ~/Documents
# O donde quieras tener el workspace
git clone https://github.com/xavierbmp/bmp-video-production.git "00_BMP/02_VIDEO EDITS"
cd "00_BMP/02_VIDEO EDITS"
```

---

## Paso 2 — Instalar herramientas de sistema

### macOS (Homebrew)
```bash
brew install ffmpeg jq mediainfo imagemagick tesseract sox rubberband yt-dlp
brew install --cask font-playfair-display font-inter font-libre-baskerville font-dm-serif-display
```

### Linux / WSL2 (apt)
```bash
sudo apt install -y ffmpeg jq mediainfo imagemagick tesseract-ocr sox rubberband-cli

# Fonts
sudo apt install -y fonts-inter
# Playfair y DM Serif: descargar de Google Fonts
mkdir -p ~/.local/share/fonts
wget -qO- "https://fonts.google.com/download?family=Playfair+Display" > /tmp/pf.zip && unzip -o /tmp/pf.zip -d ~/.local/share/fonts/
wget -qO- "https://fonts.google.com/download?family=DM+Serif+Display" > /tmp/dm.zip && unzip -o /tmp/dm.zip -d ~/.local/share/fonts/
fc-cache -f -v
```

**Verificar (ambos sistemas):**
```bash
ffmpeg -version | head -1
ffprobe -version | head -1
jq --version
```

---

## Paso 3 — Crear entorno Python

```bash
cd _SYSTEM
python3 -m venv .venv
source .venv/bin/activate

# Instalar paquetes de producción de video
pip install \
  "scenedetect[opencv]" \
  librosa \
  numpy \
  Pillow \
  moviepy \
  opencv-python-headless \
  soundfile \
  faster-whisper \
  "rembg[cpu]" \
  onnxruntime \
  color-matcher \
  stable-ts \
  demucs \
  ffmpeg-quality-metrics \
  scipy \
  scikit-image

deactivate
cd ..
```

**Verificar:**
```bash
_SYSTEM/.venv/bin/python3 -c "import cv2; print('OpenCV', cv2.__version__)"
_SYSTEM/.venv/bin/python3 -c "from faster_whisper import WhisperModel; print('faster-whisper OK')"
_SYSTEM/.venv/bin/python3 -c "import librosa; print('librosa OK')"
```

---

## Paso 4 — Instalar herramientas CLI (pipx)

### macOS
```bash
brew install pipx
pipx ensurepath
```

### Linux / WSL2
```bash
sudo apt install -y pipx
pipx ensurepath
```

### Ambos sistemas
```bash
pipx install auto-editor
pipx install openai-whisper
```

**Verificar:**
```bash
auto-editor --version
whisper --help | head -1
```

---

## Paso 5 — Instalar Remotion (motion graphics)

```bash
cd _SYSTEM/motion/bmp-motion
npm install
cd ../../..
```

**Verificar:**
```bash
cd _SYSTEM/motion/bmp-motion
npx remotion compositions 2>/dev/null | head -5
cd ../../..
```

---

## Paso 6 — Crear carpetas locales

Estas carpetas NO están en git (son locales de cada máquina):

```bash
mkdir -p CLIENTS
mkdir -p 00_INBOX
mkdir -p _DELIVERABLES
mkdir -p _ASSETS/music _ASSETS/stock _ASSETS/sfx _ASSETS/fonts
```

---

## Paso 7 — Hacer scripts ejecutables

```bash
chmod +x _SYSTEM/scripts/*.sh
chmod +x _SYSTEM/scripts/*.py
```

---

## Paso 8 — Verificar que todo funciona

```bash
# Test: crear un cliente de prueba
_SYSTEM/scripts/new-client.sh "Test"

# Test: buscar template
_SYSTEM/scripts/template-selector.sh --keywords "talking head vertical 30s"

# Test: face detection (necesita un video de prueba)
# _SYSTEM/scripts/face-detect-crop.py video.mp4 --target 1080x1920 --verify /tmp/test.jpg

# Limpiar test
rm -rf CLIENTS/Test
```

---

## Paso 9 — Configurar Claude Code

Si usas Claude Code (CLI), asegúrate de tener el proyecto apuntando a este directorio:

```bash
# Claude Code lee automáticamente CLAUDE.md al abrir el proyecto
# No hace falta configuración adicional
cd "ruta/a/00_BMP/02_VIDEO EDITS"
claude
```

Claude leerá automáticamente:
1. `CLAUDE.md` — reglas, workflow, anti-patrones
2. `_SYSTEM/VERIFY_CHECKLIST.md` — checks por operación
3. `_SYSTEM/RESOURCE_GUIDE.md` — catálogo de recursos

---

## Estructura del workspace

```
02_VIDEO EDITS/
├── CLAUDE.md               ← Reglas y workflow (Claude lee esto siempre)
├── README.md               ← Quickstart para humanos
├── INSTALL.md              ← Esta guía
├── .gitignore
├── _SYSTEM/                ← EL TOOLKIT (esto es lo que comparte el equipo)
│   ├── scripts/            ← 32+ scripts de producción
│   ├── motion/bmp-motion/  ← Remotion (25 composiciones de motion graphics)
│   ├── presets/            ← Timelines, subtítulos, export, LUTs
│   ├── templates/          ← Template de proyecto para nuevos clientes
│   ├── config/             ← Brand config (colores, fonts)
│   ├── tools/              ← Briefing form HTML
│   ├── VERIFY_CHECKLIST.md
│   ├── RESOURCE_GUIDE.md
│   └── BRAINSTORM_MEJORAS.md
├── _ASSETS/                ← Logos/assets compartidos del estudio
│   └── logos/
├── CLIENTS/                ← [LOCAL] Proyectos de clientes (no en git)
├── 00_INBOX/               ← [LOCAL] Material sin procesar
└── _DELIVERABLES/          ← [LOCAL] Archivos finales entregados
```

---

## Actualizar el toolkit

Cuando alguien mejora un script o añade una composición Remotion:

```bash
cd "ruta/a/00_BMP/02_VIDEO EDITS"
git pull
```

Los proyectos de clientes no se tocan (están en .gitignore).

---

## Troubleshooting

### "ffmpeg not found"
```bash
# macOS
brew install ffmpeg
# Linux/WSL2
sudo apt install -y ffmpeg
```

### "No module named 'cv2'"
```bash
source _SYSTEM/.venv/bin/activate
pip install opencv-python-headless
```

### "remotion: command not found"
```bash
cd _SYSTEM/motion/bmp-motion
npm install
```

### Scripts no ejecutables
```bash
chmod +x _SYSTEM/scripts/*.sh _SYSTEM/scripts/*.py
```

### Fonts no aparecen en ffmpeg
```bash
# macOS
brew install --cask font-playfair-display font-inter font-dm-serif-display font-libre-baskerville
# Linux/WSL2
sudo apt install -y fonts-inter
# O descargar de Google Fonts a ~/.local/share/fonts/ y correr fc-cache -f
```

### WSL2: "cannot access Windows files"
```bash
# Los archivos de Windows están en /mnt/c/, /mnt/d/, etc.
ls /mnt/c/Users/TuNombre/Desktop/
# Pero es MEJOR trabajar dentro de ~/  (filesystem nativo de Linux, más rápido)
```

### WSL2: ffmpeg muy lento
```bash
# Trabaja DENTRO del filesystem de WSL2, no en /mnt/c/
# Copiar material del disco C al home:
cp -r /mnt/c/Users/TuNombre/Videos/proyecto ~/proyecto
```

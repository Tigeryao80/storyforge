# ComfyUI × StoryForge Integration

## Quick Start

### 1. Start ComfyUI
Double-click: `scripts/start-comfyui.bat`

Or run in terminal:
```bash
cd C:\Users\tiger\ComfyUI-Installs\ComfyUI\ComfyUI
set PYTHONPATH=.venv\Lib\site-packages
.venv\Scripts\python.exe -B main.py --listen 127.0.0.1 --port 8188
```

Wait for: `Total VRAM 6144 MB` → API ready at `http://127.0.0.1:8188`

### 2. Generate a Cover (UI)
1. Open StoryForge in browser
2. Open a book → click **KDP Export** button
3. Go to **KDP Metadata** tab
4. Click **"🎨 Generate AI Cover with ComfyUI"**
5. Select genre, write optional prompt
6. Click **Generate Cover** → preview appears in ~15-45s
7. **Use This Cover** saves it to the book

### 3. Generate a Cover (Hermes AI)
Hermes can call the MCP tool autonomously:
```
generate_cover(
  title: "The Shadow of Dragons",
  genre: "fantasy",
  description: "A dragon silhouette against a crimson sunset, mountains below"
)
→ Returns image URL
→ Sets book.coverImageUrl automatically
```

## Models Installed

| Model | Size | Best For |
|---|---|---|
| **Juggernaut XL v9** | 6.7 GB | High-quality SDXL covers, all genres |
| **Realistic Vision V5.1** | 2.0 GB | Fast generation, realistic covers |

## File Structure
```
ComfyUI-Shared/
├── models/
│   └── checkpoints/
│       ├── Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors
│       └── Realistic_Vision_V5.1_fp16-no-ema.safetensors
├── input/          ← Reference images go here
└── output/         ← Generated covers appear here
```

## Troubleshooting

| Problem | Solution |
|---|---|
| "ComfyUI is not running" | Run `start-comfyui.bat` first |
| "No checkpoint found" | Download a model to `ComfyUI-Shared/models/checkpoints/` |
| PIL import error | Make sure PYTHONPATH is set to `.venv/Lib/site-packages` |
| CUDA out of memory | Close other apps, or use Realistic Vision (smaller) |
| Generation takes too long | Reduce steps in workflow (currently 25 for Juggernaut, 15 for RV) |

## API Endpoint
- **ComfyUI**: `http://127.0.0.1:8188`
- **StoryForge**: `POST /api/generate-cover`
  - Body: `{ title, subtitle?, author?, genre?, description?, style?, trimSize? }`
  - Returns: `{ success, imageUrl, imagePath, model }`

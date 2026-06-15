// mcp-server/src/comfyui.ts
// ComfyUI API client for book cover generation

export interface CoverPrompt {
  title: string;
  subtitle?: string;
  author?: string;
  genre?: string;
  description?: string;
  style?: string;
  trimSize?: string;
}

export interface CoverResult {
  success: boolean;
  imageUrl?: string;
  imagePath?: string;
  error?: string;
}

const COMFYUI_BASE = 'http://127.0.0.1:8188';

/**
 * Get the status of ComfyUI (whether it's running and what models are available)
 */
export async function checkComfyUIStatus(): Promise<{
  running: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const statsResp = await fetch(`${COMFYUI_BASE}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!statsResp.ok) {
      return { running: false, models: [], error: `ComfyUI returned status ${statsResp.status}` };
    }
    const stats = await statsResp.json();

    // Check available checkpoints
    const objResp = await fetch(`${COMFYUI_BASE}/object_info`, {
      signal: AbortSignal.timeout(5000),
    });
    const models: string[] = [];
    if (objResp.ok) {
      const objInfo = await objResp.json();
      // Extract checkpoint names from CheckpointLoaderSimple
      const loaderInfo = objInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name;
      if (loaderInfo) {
        models.push(...loaderInfo.filter((n: unknown) => typeof n === 'string'));
      }
    }

    return { running: true, models };
  } catch (err) {
    return {
      running: false,
      models: [],
      error: err instanceof Error ? err.message : 'Failed to connect to ComfyUI',
    };
  }
}

/**
 * Generate a book cover using ComfyUI
 */
export async function generateCover(prompt: CoverPrompt): Promise<CoverResult> {
  try {
    // First check that ComfyUI is running
    const status = await checkComfyUIStatus();
    if (!status.running) {
      return {
        success: false,
        error: `ComfyUI is not running. ${status.error || 'Start ComfyUI first (port 8188).'}`,
      };
    }

    // Find the right checkpoint
    const checkpoint = findBestCheckpoint(status.models);
    if (!checkpoint) {
      return {
        success: false,
        error: 'No SDXL checkpoint found in ComfyUI. Download Juggernaut XL or SDXL Turbo to ComfyUI-Shared/models/checkpoints/',
      };
    }

    // Build the prompt
    const positivePrompt = buildCoverPrompt(prompt);
    const negativePrompt = 'text, watermark, signature, low quality, blurry, distorted, bad anatomy, extra fingers, deformed, ugly, messy, cluttered';

    // Create the workflow JSON
    const workflow = createCoverWorkflow(checkpoint, positivePrompt, negativePrompt, prompt.trimSize);

    // Queue the prompt
    const queueResp = await fetch(`${COMFYUI_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
      signal: AbortSignal.timeout(30000),
    });

    if (!queueResp.ok) {
      const errText = await queueResp.text();
      return { success: false, error: `ComfyUI queue failed: ${errText}` };
    }

    const queueResult = await queueResp.json();
    const promptId = queueResult.prompt_id;

    // Poll for completion (up to 120 seconds)
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(1000);

      const historyResp = await fetch(`${COMFYUI_BASE}/history/${promptId}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!historyResp.ok) continue;

      const history = await historyResp.json();
      const result = history[promptId];

      if (result?.status?.completed) {
        // Get the output image
        const outputs = result.outputs;
        for (const nodeId of Object.keys(outputs)) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const image = nodeOutput.images[0];
            const imageUrl = `${COMFYUI_BASE}/view?filename=${encodeURIComponent(image.filename)}&type=output&subfolder=${encodeURIComponent(image.subfolder || '')}`;
            const imagePath = `C:\\Users\\tiger\\ComfyUI-Shared\\output\\${image.filename}`;

            return {
              success: true,
              imageUrl,
              imagePath,
            };
          }
        }

        return { success: false, error: 'ComfyUI completed but no image found in output' };
      }

      if (result?.status?.error) {
        return { success: false, error: `ComfyUI generation error: ${result.status.error}` };
      }
    }

    return { success: false, error: 'Timed out waiting for ComfyUI (120s)' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating cover',
    };
  }
}

/**
 * Build a detailed cover prompt from book metadata
 */
function buildCoverPrompt(prompt: CoverPrompt): string {
  const parts: string[] = [];

  // Genre-based style cues
  const genreStyles: Record<string, string> = {
    fantasy: 'epic fantasy, mystical, magical, ethereal lighting, dramatic sky, cinematic',
    scifi: 'science fiction, futuristic, technological, neon lighting, space, cosmic, sleek',
    romance: 'romantic, warm lighting, soft focus, intimate, passionate, dreamy',
    thriller: 'dark, suspenseful, moody lighting, shadows, intense, gritty, atmospheric',
    horror: 'dark, terrifying, ominous, creepy, blood-red accents, gothic',
    mystery: 'noir style, shadows, fog, mysterious, moody, detective, urban night',
    historical: 'period accurate, vintage, antique, classic painting style, warm sepia tones',
    literary: 'minimalist, artistic, abstract, elegant typography space, muted colors',
    adventure: 'epic landscape, dynamic, action-oriented, vast scenery, dramatic lighting',
    biography: 'elegant, refined, portrait style, warm tones, sophisticated',
  };

  const styleSuffix = prompt.genre ? (genreStyles[prompt.genre.toLowerCase()] || '') : '';
  const customStyle = prompt.style || 'professional book cover, high quality, 4K, detailed, beautiful composition';

  // Title as concept
  if (prompt.title) {
    parts.push(`Book cover for "${prompt.title}"`);
  }

  if (prompt.subtitle) {
    parts.push(`Subtitled: "${prompt.subtitle}"`);
  }

  if (prompt.description) {
    parts.push(prompt.description);
  }

  // Genre/style
  if (styleSuffix) parts.push(styleSuffix);
  if (customStyle) parts.push(customStyle);

  // Format specifications
  parts.push('portrait orientation, 2:3 aspect ratio, cover art, no text or letters in image');

  return parts.join(', ');
}

/**
 * Find the best available checkpoint for cover generation
 */
function findBestCheckpoint(models: string[]): string | null {
  if (models.length === 0) return null;

  // Prefer SDXL models
  const sdxlModels = models.filter(m =>
    m.toLowerCase().includes('juggernaut') ||
    m.toLowerCase().includes('sdxl') ||
    m.toLowerCase().includes('dreamshaper') ||
    m.toLowerCase().includes('realistic')
  );

  if (sdxlModels.length > 0) return sdxlModels[0];

  // Fall back to first available
  return models[0];
}

/**
 * Create a minimal ComfyUI workflow for book cover generation
 * Uses standard SDXL nodes: CheckpointLoader → CLIPTextEncode → KSampler → VAEDecode → SaveImage
 */
function createCoverWorkflow(checkpoint: string, positivePrompt: string, negativePrompt: string, trimSize?: string): Record<string, unknown> {
  // Calculate dimensions based on trim size (2:3 ratio for typical book covers)
  const dimensions = getCoverDimensions(trimSize);

  return {
    // Node 1: Load Checkpoint
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint,
      },
    },
    // Node 2: CLIP Text Encode (Positive)
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: positivePrompt,
        clip: ['1', 1],
      },
    },
    // Node 3: CLIP Text Encode (Negative)
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt,
        clip: ['1', 1],
      },
    },
    // Node 4: Empty Latent Image
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: dimensions.width,
        height: dimensions.height,
        batch_size: 1,
      },
    },
    // Node 5: KSampler
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 1000000),
        steps: 25,
        cfg: 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
    },
    // Node 6: VAE Decode
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    // Node 7: Save Image
    '7': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'storyforge_cover',
        images: ['6', 0],
      },
    },
  };
}

/**
 * Get cover dimensions based on trim size, maintaining 2:3 aspect ratio
 */
function getCoverDimensions(trimSize?: string): { width: number; height: number } {
  // SDXL native is 1024x1024, but for covers we want portrait
  // Typical book cover ratios (width:height):
  // 6x9 → 2:3 → 832x1248 or similar
  // 5x8 → 5:8 → 768x1216
  // 8.5x11 → ~3:4 → 896x1216

  const dimMap: Record<string, { width: number; height: number }> = {
    '5x8': { width: 640, height: 1024 },
    '5.25x8': { width: 672, height: 1024 },
    '5.5x8.5': { width: 704, height: 1088 },
    '6x9': { width: 768, height: 1152 },
    '6.14x9.21': { width: 768, height: 1152 },
    '7x10': { width: 832, height: 1184 },
    '8x10': { width: 896, height: 1152 },
    '8.5x11': { width: 896, height: 1216 },
  };

  return dimMap[trimSize || ''] || { width: 768, height: 1152 };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

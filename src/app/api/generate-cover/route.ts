// src/app/api/generate-cover/route.ts
// Next.js API route that bridges the StoryForge UI to ComfyUI

import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_BASE = 'http://127.0.0.1:8188';

interface CoverPrompt {
  title: string;
  subtitle?: string;
  author?: string;
  genre?: string;
  description?: string;
  style?: string;
  trimSize?: string;
}

export async function POST(request: NextRequest) {
  try {
    const prompt: CoverPrompt = await request.json();

    // 1. Check ComfyUI is running
    try {
      const statsResp = await fetch(`${COMFYUI_BASE}/system_stats`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!statsResp.ok) {
        return NextResponse.json(
          { success: false, error: `ComfyUI returned status ${statsResp.status}` },
          { status: 503 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'ComfyUI is not running on localhost:8188. Start it first from the ComfyUI launcher.' },
        { status: 503 }
      );
    }

    // 2. Get available checkpoints
    const objResp = await fetch(`${COMFYUI_BASE}/object_info`, {
      signal: AbortSignal.timeout(5000),
    });
    const objInfo = await objResp.json();
    const loaderInfo = objInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name;
    const models: string[] = loaderInfo ? [...loaderInfo.filter((n: unknown) => typeof n === 'string')] : [];

    // Find best checkpoint
    const sdxlModels = models.filter(m =>
      m.toLowerCase().includes('juggernaut') ||
      m.toLowerCase().includes('sdxl') ||
      m.toLowerCase().includes('dreamshaper') ||
      m.toLowerCase().includes('realistic')
    );
    const checkpoint = sdxlModels.length > 0 ? sdxlModels[0] : models[0];

    if (!checkpoint) {
      return NextResponse.json(
        { success: false, error: 'No checkpoint models found in ComfyUI. Download Juggernaut XL first.' },
        { status: 400 }
      );
    }

    // 3. Build the prompt
    const positivePrompt = buildCoverPrompt(prompt);
    const negativePrompt = 'text, watermark, signature, low quality, blurry, distorted, bad anatomy, extra fingers, deformed, ugly, messy, cluttered';

    // 4. Create workflow
    const workflow = createCoverWorkflow(checkpoint, positivePrompt, negativePrompt, prompt.trimSize);

    // 5. Queue the prompt
    const queueResp = await fetch(`${COMFYUI_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
      signal: AbortSignal.timeout(30000),
    });

    if (!queueResp.ok) {
      const errText = await queueResp.text();
      return NextResponse.json(
        { success: false, error: `ComfyUI queue failed: ${errText}` },
        { status: 500 }
      );
    }

    const queueResult = await queueResp.json();
    const promptId = queueResult.prompt_id;

    // 6. Poll for completion (up to 120s)
    for (let i = 0; i < 120; i++) {
      await sleep(1000);

      const historyResp = await fetch(`${COMFYUI_BASE}/history/${promptId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!historyResp.ok) continue;

      const history = await historyResp.json();
      const result = history[promptId];

      if (result?.status?.completed) {
        const outputs = result.outputs;
        for (const nodeId of Object.keys(outputs)) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const image = nodeOutput.images[0];
            const imageUrl = `${COMFYUI_BASE}/view?filename=${encodeURIComponent(image.filename)}&type=output&subfolder=${encodeURIComponent(image.subfolder || '')}`;
            const imagePath = `C:\\Users\\tiger\\ComfyUI-Shared\\output\\${image.filename}`;

            return NextResponse.json({
              success: true,
              imageUrl,
              imagePath,
              model: checkpoint,
            });
          }
        }

        return NextResponse.json(
          { success: false, error: 'ComfyUI completed but no image found in output' },
          { status: 500 }
        );
      }

      if (result?.status?.error) {
        return NextResponse.json(
          { success: false, error: `ComfyUI error: ${result.status.error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Timed out waiting for ComfyUI (120s)' },
      { status: 504 }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildCoverPrompt(prompt: CoverPrompt): string {
  const parts: string[] = [];

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

  if (prompt.title) parts.push(`Book cover for "${prompt.title}"`);
  if (prompt.subtitle) parts.push(`Subtitled: "${prompt.subtitle}"`);
  if (prompt.description) parts.push(prompt.description);

  if (styleSuffix) parts.push(styleSuffix);
  if (customStyle) parts.push(customStyle);
  parts.push('portrait orientation, 2:3 aspect ratio, cover art, no text or letters in image');

  return parts.join(', ');
}

function createCoverWorkflow(checkpoint: string, positivePrompt: string, negativePrompt: string, trimSize?: string): Record<string, unknown> {
  const dims = getCoverDimensions(trimSize);

  return {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: positivePrompt, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: negativePrompt, clip: ['1', 1] } },
    '4': { class_type: 'EmptyLatentImage', inputs: { width: dims.width, height: dims.height, batch_size: 1 } },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 999999),
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
    '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
    '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'storyforge_cover', images: ['6', 0] } },
  };
}

function getCoverDimensions(trimSize?: string): { width: number; height: number } {
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

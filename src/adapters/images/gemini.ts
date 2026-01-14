import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ImageRequest } from '../../types.js';
import type { Theme } from '../../core/themes/index.js';
import { hashPrompt } from './hash.js';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

/**
 * Style modifiers for different image styles
 */
const STYLE_MODIFIERS: Record<string, string> = {
  'flat-vector': 'flat vector illustration, clean lines, solid colors, no gradients',
  photorealistic: 'professional photography, high resolution, realistic lighting',
  '3d-render': '3D render, soft lighting, smooth surfaces, studio quality',
  'hand-drawn': 'hand-drawn illustration, sketch style, artistic, organic lines',
  minimalist: 'minimalist icon, simple shapes, single color, abstract',
};

/**
 * Enhance a prompt with style and theme modifiers
 */
export function enhancePrompt(basePrompt: string, style: string, theme: Theme): string {
  return [
    basePrompt,
    STYLE_MODIFIERS[style] || STYLE_MODIFIERS['flat-vector'],
    theme.imagePromptModifier,
    'high quality, presentation slide graphic, 16:9 aspect ratio',
  ].join(', ');
}

/**
 * Generate an image using Gemini API
 */
export async function generateWithGemini(
  request: ImageRequest,
  theme: Theme,
  style: string,
  config: GeminiConfig
): Promise<{ buffer: Buffer; promptHash: string }> {
  const genAI = new GoogleGenerativeAI(config.apiKey);

  const model = genAI.getGenerativeModel({
    model: config.model || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    } as unknown as import('@google/generative-ai').GenerationConfig,
  });

  const enhancedPrompt = enhancePrompt(request.prompt, style, theme);
  const promptHash = hashPrompt(enhancedPrompt);

  const result = await model.generateContent(enhancedPrompt);
  const response = result.response;

  // Extract image from response parts
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => 'inlineData' in part && part.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData?.data) {
    throw new Error('No image data in Gemini response');
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

  return { buffer, promptHash };
}

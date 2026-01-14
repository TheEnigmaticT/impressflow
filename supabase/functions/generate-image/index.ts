import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  presentationId: string;
  prompt: string;
  slideIndex: number;
  imageIndex: number;
  styleModifier?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ImageRequest = await req.json();
    const { presentationId, prompt, slideIndex, imageIndex, styleModifier = '' } = body;

    // Generate prompt hash for caching
    const promptHash = await hashPrompt(prompt + styleModifier);

    // Check cache first
    const { data: cachedImage } = await supabase
      .from('image_cache')
      .select('storage_path')
      .eq('prompt_hash', promptHash)
      .single();

    if (cachedImage) {
      // Return cached image URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(cachedImage.storage_path);

      return new Response(
        JSON.stringify({
          success: true,
          url: urlData.publicUrl,
          cached: true,
          promptHash,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Generate new image
    if (!geminiApiKey) {
      // Return placeholder if no API key
      const placeholderUrl = generatePlaceholderUrl(prompt);
      return new Response(
        JSON.stringify({
          success: true,
          url: placeholderUrl,
          placeholder: true,
          promptHash,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Call Gemini API for image generation
    const enhancedPrompt = enhancePrompt(prompt, styleModifier);
    const imageBuffer = await generateWithGemini(enhancedPrompt, geminiApiKey);

    // Save to Supabase storage
    const storagePath = `cache/${promptHash}.png`;
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Record in cache database
    await supabase
      .from('image_cache')
      .upsert({
        prompt_hash: promptHash,
        storage_path: storagePath,
        prompt_text: prompt,
        style_modifier: styleModifier,
        width: 1024,
        height: 1024,
      }, {
        onConflict: 'prompt_hash',
      });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        cached: false,
        promptHash,
        slideIndex,
        imageIndex,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Hash a prompt string for caching
 */
async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Enhance prompt with style modifiers for better image generation
 */
function enhancePrompt(prompt: string, styleModifier: string): string {
  const baseEnhancement = 'professional presentation slide image, high quality, clean design';

  if (styleModifier) {
    return `${prompt}, ${styleModifier}, ${baseEnhancement}`;
  }

  return `${prompt}, ${baseEnhancement}`;
}

/**
 * Generate image using Gemini API
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<Uint8Array> {
  // Use Gemini's Imagen model for image generation
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          safetyFilterLevel: 'block_only_high',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No image generated');
  }

  // Decode base64 image
  const base64Image = data.predictions[0].bytesBase64Encoded;
  const binaryString = atob(base64Image);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Generate a placeholder image URL when API is unavailable
 */
function generatePlaceholderUrl(prompt: string): string {
  // Use a placeholder service
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
  return `https://placehold.co/1024x576/1a1a2e/00d4ff?text=${encodedPrompt}`;
}

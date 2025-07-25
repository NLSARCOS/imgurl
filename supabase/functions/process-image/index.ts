/*
  # API de Procesamiento de Imágenes sRGB

  Esta función procesa imágenes desde URLs aplicando perfil de color sRGB.

  ## Funcionalidad
  - Descarga imagen desde URL proporcionada
  - Aplica corrección gamma sRGB y optimizaciones de color
  - Retorna la imagen procesada como base64 o la almacena temporalmente
  - Manejo de errores y validación de entrada

  ## Endpoints
  - POST /process-image - Procesa imagen desde URL

  ## Parámetros
  - imageUrl: URL de la imagen a procesar
  - format: Formato de salida (jpeg, png) - opcional, por defecto jpeg
  - quality: Calidad de compresión (0.1-1.0) - opcional, por defecto 0.95
*/

interface ProcessImageRequest {
  imageUrl: string;
  format?: 'jpeg' | 'png';
  quality?: number;
}

interface ProcessImageResponse {
  success: boolean;
  processedImageUrl?: string;
  processedImageBase64?: string;
  originalSize?: number;
  processedSize?: number;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Función para aplicar perfil sRGB a los datos de imagen
const applySRGBProfile = (imageData: ImageData): ImageData => {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Convertir a valores normalizados (0-1)
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    
    // Aplicar función de transferencia sRGB
    const applySRGBGamma = (val: number) => {
      if (val <= 0.04045) {
        return val / 12.92;
      } else {
        return Math.pow((val + 0.055) / 1.055, 2.4);
      }
    };
    
    const linearToSRGB = (val: number) => {
      if (val <= 0.0031308) {
        return val * 12.92;
      } else {
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
      }
    };
    
    // Convertir a lineal y de vuelta a sRGB para normalizar
    r = linearToSRGB(applySRGBGamma(r));
    g = linearToSRGB(applySRGBGamma(g));
    b = linearToSRGB(applySRGBGamma(b));
    
    // Aplicar ligera mejora de contraste y saturación
    const enhance = (val: number) => {
      val = Math.pow(val, 0.95);
      return Math.max(0, Math.min(1, val));
    };
    
    r = enhance(r);
    g = enhance(g);
    b = enhance(b);
    
    // Convertir de vuelta a 0-255
    data[i] = Math.round(r * 255);
    data[i + 1] = Math.round(g * 255);
    data[i + 2] = Math.round(b * 255);
  }
  
  return imageData;
};

// Función para procesar imagen usando Canvas API
const processImageWithCanvas = async (
  imageBuffer: ArrayBuffer,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: number = 0.95
): Promise<{ processedBuffer: ArrayBuffer; originalSize: number; processedSize: number }> => {
  
  // Crear un canvas offscreen
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo crear el contexto del canvas');
  }
  
  // Crear imagen desde buffer
  const blob = new Blob([imageBuffer]);
  const imageBitmap = await createImageBitmap(blob);
  
  // Configurar canvas con dimensiones de la imagen
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  
  // Dibujar imagen en canvas
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Obtener datos de imagen y aplicar perfil sRGB
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processedImageData = applySRGBProfile(imageData);
  
  // Aplicar datos procesados al canvas
  ctx.putImageData(processedImageData, 0, 0);
  
  // Convertir a blob
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const processedBlob = await canvas.convertToBlob({ 
    type: mimeType, 
    quality: format === 'jpeg' ? quality : undefined 
  });
  
  const processedBuffer = await processedBlob.arrayBuffer();
  
  return {
    processedBuffer,
    originalSize: imageBuffer.byteLength,
    processedSize: processedBuffer.byteLength
  };
};

Deno.serve(async (req: Request) => {
  try {
    // Manejar CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Método no permitido. Use POST." 
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: ProcessImageRequest = await req.json();
    
    // Validar entrada
    if (!requestData.imageUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Se requiere el parámetro 'imageUrl'" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar URL
    let imageUrl: URL;
    try {
      imageUrl = new URL(requestData.imageUrl);
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "URL de imagen inválida" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar parámetros opcionales
    const format = requestData.format || 'jpeg';
    const quality = requestData.quality || 0.95;
    
    if (!['jpeg', 'png'].includes(format)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Formato debe ser 'jpeg' o 'png'" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (quality < 0.1 || quality > 1.0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "La calidad debe estar entre 0.1 y 1.0" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Descargar imagen
    const imageResponse = await fetch(requestData.imageUrl);
    
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No se pudo descargar la imagen: ${imageResponse.status} ${imageResponse.statusText}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar que sea una imagen
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "La URL no apunta a una imagen válida" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Procesar imagen
    const { processedBuffer, originalSize, processedSize } = await processImageWithCanvas(
      imageBuffer, 
      format, 
      quality
    );
    
    // Convertir a base64 para respuesta
    const processedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(processedBuffer))
    );
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${processedBase64}`;

    const response: ProcessImageResponse = {
      success: true,
      processedImageBase64: dataUrl,
      originalSize,
      processedSize
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error procesando imagen:', error);
    
    const response: ProcessImageResponse = {
      success: false,
      error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
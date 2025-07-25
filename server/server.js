import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

// Configurar multer para subida de archivos
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Función para aplicar perfil sRGB
const applySRGBProfile = (canvas, ctx, img) => {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    
    const applySRGBGamma = (val) => {
      if (val <= 0.04045) {
        return val / 12.92;
      } else {
        return Math.pow((val + 0.055) / 1.055, 2.4);
      }
    };
    
    const linearToSRGB = (val) => {
      if (val <= 0.0031308) {
        return val * 12.92;
      } else {
        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
      }
    };
    
    r = linearToSRGB(applySRGBGamma(r));
    g = linearToSRGB(applySRGBGamma(g));
    b = linearToSRGB(applySRGBGamma(b));
    
    const enhance = (val) => {
      val = Math.pow(val, 0.95);
      return Math.max(0, Math.min(1, val));
    };
    
    r = enhance(r);
    g = enhance(g);
    b = enhance(b);
    
    data[i] = Math.round(r * 255);
    data[i + 1] = Math.round(g * 255);
    data[i + 2] = Math.round(b * 255);
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// API: Procesar imagen desde URL
app.post('/api/process-image', async (req, res) => {
  try {
    const { imageUrl, format = 'jpeg', quality = 0.95 } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el parámetro imageUrl'
      });
    }
    
    // Validar URL
    let url;
    try {
      url = new URL(imageUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'URL de imagen inválida'
      });
    }
    
    // Descargar imagen
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return res.status(400).json({
        success: false,
        error: `No se pudo descargar la imagen: ${imageResponse.status}`
      });
    }
    
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'La URL no apunta a una imagen válida'
      });
    }
    
    const imageBuffer = await imageResponse.buffer();
    const originalSize = imageBuffer.length;
    
    // Cargar imagen con canvas
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Aplicar perfil sRGB
    applySRGBProfile(canvas, ctx, img);
    
    // Convertir a buffer
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const processedBuffer = canvas.toBuffer(mimeType, { quality: format === 'jpeg' ? quality : undefined });
    const processedSize = processedBuffer.length;
    
    // Convertir a base64
    const processedBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;
    
    res.json({
      success: true,
      processedImageBase64: processedBase64,
      originalSize,
      processedSize
    });
    
  } catch (error) {
    console.error('Error procesando imagen:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`
    });
  }
});

// API: Subir y procesar archivo
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      });
    }
    
    const { format = 'jpeg', quality = 0.95 } = req.body;
    const originalSize = req.file.size;
    
    // Cargar imagen
    const img = await loadImage(req.file.buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Aplicar perfil sRGB
    applySRGBProfile(canvas, ctx, img);
    
    // Convertir a buffer
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const processedBuffer = canvas.toBuffer(mimeType, { quality: format === 'jpeg' ? quality : undefined });
    const processedSize = processedBuffer.length;
    
    // Convertir a base64
    const processedBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;
    
    res.json({
      success: true,
      processedImageBase64: processedBase64,
      originalSize,
      processedSize
    });
    
  } catch (error) {
    console.error('Error procesando imagen:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`
    });
  }
});

// Servir aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api/process-image`);
});
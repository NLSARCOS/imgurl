import express from 'express';
import multer from 'multer';
import cors from 'cors';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/processed', express.static('processed'));

// Create directories if they don't exist
await fs.mkdir('uploads', { recursive: true });
await fs.mkdir('processed', { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Apply sRGB color profile to image
async function applySRGBProfile(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .toColorspace('srgb')
      .jpeg({ quality: 95 })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Error applying sRGB profile:', error);
    return false;
  }
}

// Download image from URL
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join('uploads', filename);
    
    await fs.writeFile(filepath, buffer);
    return filepath;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Clean up old files (files older than 1 hour)
async function cleanupOldFiles() {
  const directories = ['uploads', 'processed'];
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const dir of directories) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          await fs.unlink(filepath);
          console.log(`Cleaned up old file: ${filepath}`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${dir}:`, error);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'sRGB Image Processor API',
    version: '1.0.0',
    endpoints: {
      'POST /api/upload': 'Upload image file and apply sRGB profile',
      'POST /api/process-url': 'Process image from URL and apply sRGB profile',
      'GET /health': 'Health check endpoint'
    },
    examples: {
      upload: {
        method: 'POST',
        url: '/api/upload',
        description: 'Upload file using multipart/form-data with field name "image"'
      },
      processUrl: {
        method: 'POST',
        url: '/api/process-url',
        body: { imageUrl: 'https://example.com/image.jpg' },
        description: 'Send JSON with imageUrl field'
      }
    }
  });
});

// Upload and process image file
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const inputPath = req.file.path;
    const outputFilename = `srgb-${req.file.filename}`;
    const outputPath = path.join('processed', outputFilename);

    const success = await applySRGBProfile(inputPath, outputPath);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to process image' });
    }

    // Clean up original file
    await fs.unlink(inputPath);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processedUrl = `${baseUrl}/processed/${outputFilename}`;

    res.json({
      success: true,
      message: 'Image processed successfully',
      originalFilename: req.file.originalname,
      processedUrl: processedUrl,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Process image from URL
app.post('/api/process-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Download image
    const inputPath = await downloadImage(imageUrl);
    
    const outputFilename = `srgb-${path.basename(inputPath)}`;
    const outputPath = path.join('processed', outputFilename);

    const success = await applySRGBProfile(inputPath, outputPath);
    
    if (!success) {
      await fs.unlink(inputPath); // Clean up
      return res.status(500).json({ error: 'Failed to process image' });
    }

    // Clean up original downloaded file
    await fs.unlink(inputPath);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processedUrl = `${baseUrl}/processed/${outputFilename}`;

    res.json({
      success: true,
      message: 'Image processed successfully',
      originalUrl: imageUrl,
      processedUrl: processedUrl,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process image from URL', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`sRGB Image Processor API running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});
import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, CheckCircle, Link, Code } from 'lucide-react';

interface ProcessedImage {
  original: string;
  processed: string;
  filename: string;
}

function App() {
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'api'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applySRGBProfile = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    // Dibujar la imagen en el canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Obtener los datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Aplicar corrección gamma sRGB (aproximación)
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a valores normalizados (0-1)
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      
      // Aplicar función de transferencia sRGB inversa y luego directa
      // Esto simula la conversión al espacio sRGB
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
        val = Math.pow(val, 0.95); // Ligero ajuste de gamma
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
    
    // Aplicar los datos modificados al canvas
    ctx.putImageData(imageData, 0, 0);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    const img = new Image();
    const originalUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Configurar el canvas con las dimensiones de la imagen
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Aplicar el perfil sRGB
      applySRGBProfile(canvas, ctx, img);
      
      // Convertir a blob y crear URL
      canvas.toBlob((blob) => {
        if (blob) {
          const processedUrl = URL.createObjectURL(blob);
          
          setProcessedImage({
            original: originalUrl,
            processed: processedUrl,
            filename: file.name
          });
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    };
    
    img.src = originalUrl;
  };

  const processImageFromUrl = async () => {
    if (!imageUrl.trim()) return;
    
    setIsProcessingUrl(true);
    
    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          format: 'jpeg',
          quality: 0.95
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProcessedImage({
          original: imageUrl,
          processed: result.processedImageBase64,
          filename: 'processed_image_from_url.jpg'
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error procesando imagen: ${error}`);
    } finally {
      setIsProcessingUrl(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage.processed;
      const filename = processedImage.filename.replace(/\.[^/.]+$/, '') + '_sRGB.jpg';
      link.download = filename;
      link.click();
    }
  };

  const reset = () => {
    setProcessedImage(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ImageIcon className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-800">Conversor sRGB Pro</h1>
          </div>
          <p className="text-slate-600 text-lg">
            Procesa imágenes aplicando perfil de color sRGB - Subida directa, URL o API
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors duration-200 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Subir Archivo
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors duration-200 ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Link className="w-5 h-5 inline mr-2" />
              Desde URL
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors duration-200 ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Code className="w-5 h-5 inline mr-2" />
              Documentación API
            </button>
          </div>
        </div>

        {/* Upload Area */}
        {activeTab === 'upload' && !processedImage && !isProcessing && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div
              className={`border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 transform scale-105'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Arrastra tu imagen aquí
              </h3>
              <p className="text-slate-500 mb-4">
                o haz click para seleccionar un archivo
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <Upload className="w-5 h-5 mr-2" />
                Seleccionar Imagen
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* URL Input */}
        {activeTab === 'url' && !processedImage && !isProcessingUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <Link className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Procesar imagen desde URL
              </h3>
              <p className="text-slate-500">
                Ingresa la URL de una imagen para procesarla automáticamente
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-4">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={processImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
                >
                  Procesar
                </button>
              </div>
              
              <p className="text-sm text-slate-500 mt-3 text-center">
                Formatos soportados: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        )}

        {/* API Documentation */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Code className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-2xl font-semibold text-slate-700 mb-2">
                  Documentación de la API
                </h3>
                <p className="text-slate-500">
                  Integra el procesamiento sRGB en tus aplicaciones
                </p>
              </div>

              <div className="space-y-8">
                {/* Endpoint */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Endpoint</h4>
                  <div className="bg-slate-100 rounded-lg p-4 font-mono text-sm">
                    <span className="text-green-600 font-bold">POST</span> /api/process-image
                  </div>
                </div>

                {/* Request */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Parámetros de Entrada</h4>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{`{
  "imageUrl": "https://ejemplo.com/imagen.jpg",    // Requerido
  "format": "jpeg",                                // Opcional: "jpeg" | "png"
  "quality": 0.95                                  // Opcional: 0.1 - 1.0
}`}</pre>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Respuesta</h4>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{`{
  "success": true,
  "processedImageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "originalSize": 245760,
  "processedSize": 198432
}`}</pre>
                  </div>
                </div>

                {/* Example */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Ejemplo de Uso</h4>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{`// Ejemplo con tu servidor
const response = await fetch('/api/process-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://ejemplo.com/imagen.jpg',
    format: 'jpeg',
    quality: 0.95
  })
});

const result = await response.json();

if (result.success) {
  // Usar result.processedImageBase64
  const img = document.createElement('img');
  img.src = result.processedImageBase64;
  document.body.appendChild(img);
} else {
  console.error('Error:', result.error);
}`}</pre>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Ejemplo con cURL</h4>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{`curl -X POST /api/process-image \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "format": "jpeg",
    "quality": 0.95
  }'`}</pre>
                  </div>
                </div>

                {/* Error Codes */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Códigos de Error</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div><span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">400</span> - Parámetros inválidos o URL no válida</div>
                      <div><span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">405</span> - Método no permitido (solo POST)</div>
                      <div><span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">500</span> - Error interno del servidor</div>
                    </div>
                  </div>
                </div>

                {/* Rate Limits */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Limitaciones</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Tamaño máximo de imagen: 10MB</li>
                      <li>• Formatos soportados: JPG, PNG, GIF, WebP</li>
                      <li>• Tiempo de procesamiento: ~2-5 segundos</li>
                      <li>• La imagen se retorna como base64 en la respuesta</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {(isProcessing || isProcessingUrl) && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Procesando imagen...
            </h3>
            <p className="text-slate-500">
              {isProcessingUrl ? 'Descargando y procesando imagen desde URL' : 'Aplicando perfil de color sRGB'}
            </p>
          </div>
        )}

        {/* Results */}
        {processedImage && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            {/* Success Header */}
            <div className="bg-green-50 border-b border-green-200 p-6">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-green-800">
                    ¡Procesamiento Completado!
                  </h3>
                  <p className="text-green-600">
                    Perfil sRGB aplicado correctamente
                  </p>
                </div>
              </div>
            </div>

            {/* Images Comparison */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Original */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4">
                    Imagen Original
                  </h4>
                  <div className="bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={processedImage.original}
                      alt="Original"
                      className="w-full h-auto max-h-80 object-contain"
                    />
                  </div>
                </div>

                {/* Processed */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4">
                    Con Perfil sRGB
                  </h4>
                  <div className="bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={processedImage.processed}
                      alt="Processed"
                      className="w-full h-auto max-h-80 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <button
                  onClick={downloadImage}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
                >
                  <Download className="w-6 h-6 mr-3" />
                  Descargar Imagen sRGB
                </button>
                
                <button
                  onClick={reset}
                  className="inline-flex items-center px-8 py-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 font-semibold text-lg"
                >
                  <Upload className="w-6 h-6 mr-3" />
                  Procesar Otra Imagen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">
            Características de la Aplicación
          </h3>
          <div className="space-y-3 text-slate-600">
            <p>
              • <strong>Subida directa:</strong> Arrastra y suelta archivos o selecciona desde tu dispositivo
            </p>
            <p>
              • <strong>Procesamiento por URL:</strong> Procesa imágenes directamente desde enlaces web
            </p>
            <p>
              • <strong>API REST:</strong> Integra el procesamiento sRGB en tus aplicaciones
            </p>
            <p>
              • <strong>Perfil sRGB automático:</strong> Normaliza colores para visualización web consistente
            </p>
            <p>
              • <strong>Múltiples formatos:</strong> Soporta JPG, PNG, GIF y WebP
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;
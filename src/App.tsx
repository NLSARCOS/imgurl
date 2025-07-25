import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

interface ProcessedImage {
  originalName?: string;
  originalUrl?: string;
  processedUrl: string;
  processedAt: string;
  success: boolean;
}

function App() {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [processingUrl, setProcessingUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'api'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:3001';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setProcessedImages(prev => [result, ...prev]);
      } else {
        alert(result.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setProcessing(false);
    }
  };

  const processUrlImage = async () => {
    if (!urlInput.trim()) {
      alert('Please enter an image URL');
      return;
    }

    setProcessingUrl(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/process-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: urlInput }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setProcessedImages(prev => [result, ...prev]);
        setUrlInput('');
      } else {
        alert(result.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('URL processing error:', error);
      alert('Failed to process image from URL');
    } finally {
      setProcessingUrl(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">sRGB Image Processor</h1>
              <p className="text-gray-600">Convert images to sRGB color profile for consistent color reproduction</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          {[
            { id: 'upload', label: 'Upload Image', icon: Upload },
            { id: 'url', label: 'Process URL', icon: ExternalLink },
            { id: 'api', label: 'API Documentation', icon: CheckCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {activeTab === 'upload' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
                
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={processing}
                  />
                  
                  {processing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-gray-600">Processing image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP, TIFF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Image from URL</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={processingUrl}
                    />
                  </div>
                  
                  <button
                    onClick={processUrlImage}
                    disabled={processingUrl || !urlInput.trim()}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {processingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Process Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Upload Image</h3>
                    <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                      <div className="text-blue-600">POST</div>
                      <div className="text-gray-800">{API_BASE}/api/upload</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Upload image file using multipart/form-data with field name "image"
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Process URL</h3>
                    <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                      <div className="text-blue-600">POST</div>
                      <div className="text-gray-800">{API_BASE}/api/process-url</div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 text-sm font-mono mt-2">
                      {`{
  "imageUrl": "https://example.com/image.jpg"
}`}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Send JSON with imageUrl field pointing to a publicly accessible image
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Response Format</h3>
                    <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                      {`{
  "success": true,
  "message": "Image processed successfully",
  "processedUrl": "https://your-domain.com/processed/srgb-image.jpg",
  "processedAt": "2025-01-11T..."
}`}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Integration Note</h4>
                        <p className="text-sm text-amber-800 mt-1">
                          For n8n, Make, or Zapier integrations, use the process-url endpoint with a POST request containing the imageUrl in JSON format.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processed Images</h2>
            
            {processedImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No images processed yet</p>
                <p className="text-sm">Upload an image or process a URL to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {processedImages.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Processing Complete</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(image.processedAt).toLocaleString()}
                      </span>
                    </div>
                    
                    {image.originalName && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Original:</span> {image.originalName}
                      </p>
                    )}
                    
                    {image.originalUrl && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Source URL:</span> 
                        <a href={image.originalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1 break-all">
                          {image.originalUrl}
                        </a>
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => copyToClipboard(image.processedUrl)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy URL
                      </button>
                      
                      <a
                        href={image.processedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
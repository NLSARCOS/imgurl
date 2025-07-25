<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procesador de Imágenes sRGB</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            background: #f8f9ff;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .upload-area:hover {
            border-color: #764ba2;
            background: #f0f4ff;
        }
        
        .upload-area.dragover {
            border-color: #4CAF50;
            background: #e8f5e8;
        }
        
        .upload-icon {
            font-size: 3rem;
            color: #667eea;
            margin-bottom: 20px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .api-section {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
        }
        
        .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 0.9rem;
        }
        
        .status {
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: 600;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .progress {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .image-preview {
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        
        .endpoint-badge {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            display: inline-block;
            margin: 5px 5px 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Procesador sRGB</h1>
            <p>Convierte tus imágenes al perfil de color sRGB automáticamente</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📤 Subir Imagen</h2>
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="upload-area" id="uploadArea">
                        <div class="upload-icon">📷</div>
                        <h3>Arrastra una imagen aquí o haz clic para seleccionar</h3>
                        <p>Formatos soportados: JPG, PNG, WEBP, AVIF</p>
                        <input type="file" id="fileInput" name="image" accept="image/*" style="display: none;">
                        <br><br>
                        <button type="button" class="btn" onclick="document.getElementById('fileInput').click();">
                            Seleccionar Archivo
                        </button>
                    </div>
                    <div class="progress" id="progressContainer" style="display: none;">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                    <div id="result"></div>
                </form>
            </div>
            
            <div class="api-section">
                <h2>🔌 API para Automatización</h2>
                <p>Integra con n8n, Make, Zapier o cualquier herramienta que soporte HTTP POST:</p>
                
                <div class="endpoint-badge">POST</div>
                <strong>/api.php</strong>
                
                <h3 style="margin: 20px 0 10px 0;">Ejemplo de uso con cURL:</h3>
                <div class="code-block">curl -X POST http://tu-dominio.com/api.php \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://ejemplo.com/imagen.jpg"}'</div>
                
                <h3 style="margin: 20px 0 10px 0;">Respuesta exitosa:</h3>
                <div class="code-block">{
  "success": true,
  "processed_image_url": "http://tu-dominio.com/processed/imagen_srgb.jpg",
  "original_url": "https://ejemplo.com/imagen.jpg",
  "message": "Imagen procesada correctamente"
}</div>

                <h3 style="margin: 20px 0 10px 0;">Ejemplo para n8n/Make/Zapier:</h3>
                <ul style="margin: 15px 0; padding-left: 30px;">
                    <li><strong>URL:</strong> http://tu-dominio.com/api.php</li>
                    <li><strong>Método:</strong> POST</li>
                    <li><strong>Content-Type:</strong> application/json</li>
                    <li><strong>Body:</strong> {"image_url": "URL_DE_TU_IMAGEN"}</li>
                </ul>
            </div>
        </div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadForm = document.getElementById('uploadForm');
        const result = document.getElementById('result');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                uploadFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                uploadFile(e.target.files[0]);
            }
        });

        function uploadFile(file) {
            const formData = new FormData();
            formData.append('image', file);

            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';

            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressBar.style.width = percentComplete + '%';
                }
            });

            xhr.addEventListener('load', () => {
                progressContainer.style.display = 'none';
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        result.innerHTML = `
                            <div class="status success">
                                ✅ ¡Imagen procesada correctamente!
                                <br><br>
                                <img src="${response.processed_image_url}" class="image-preview" alt="Imagen procesada">
                                <br>
                                <a href="${response.processed_image_url}" target="_blank" class="btn">Ver Imagen Completa</a>
                            </div>
                        `;
                    } else {
                        result.innerHTML = `<div class="status error">❌ Error: ${response.message}</div>`;
                    }
                } else {
                    result.innerHTML = '<div class="status error">❌ Error al procesar la imagen</div>';
                }
            });

            xhr.addEventListener('error', () => {
                progressContainer.style.display = 'none';
                result.innerHTML = '<div class="status error">❌ Error de conexión</div>';
            });

            xhr.open('POST', 'upload.php');
            xhr.send(formData);
        }
    </script>
</body>
</html>
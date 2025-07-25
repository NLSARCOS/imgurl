# API de Procesamiento sRGB - Documentación Completa

## Descripción General

Esta API permite procesar imágenes aplicando automáticamente un perfil de color sRGB. Acepta URLs de imágenes y retorna la imagen procesada en formato base64.

## Endpoint Principal

```
POST /api/functions/v1/process-image
```

## Autenticación

No se requiere autenticación para usar esta API.

## Parámetros de Entrada

### Cuerpo de la Petición (JSON)

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos |
|-----------|------|-----------|-------------|-------------------|
| `imageUrl` | string | ✅ Sí | URL de la imagen a procesar | URL válida que apunte a una imagen |
| `format` | string | ❌ No | Formato de salida deseado | `"jpeg"` (por defecto), `"png"` |
| `quality` | number | ❌ No | Calidad de compresión (solo para JPEG) | `0.1` a `1.0` (por defecto: `0.95`) |

### Ejemplo de Petición

```json
{
  "imageUrl": "https://ejemplo.com/mi-imagen.jpg",
  "format": "jpeg",
  "quality": 0.95
}
```

## Respuesta

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "processedImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "originalSize": 245760,
  "processedSize": 198432
}
```

### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `success` | boolean | Indica si el procesamiento fue exitoso |
| `processedImageBase64` | string | Imagen procesada en formato Data URL (base64) |
| `originalSize` | number | Tamaño original de la imagen en bytes |
| `processedSize` | number | Tamaño de la imagen procesada en bytes |

### Respuesta de Error

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Procesamiento exitoso |
| `400` | Parámetros inválidos o URL no válida |
| `405` | Método no permitido (solo se acepta POST) |
| `500` | Error interno del servidor |

## Ejemplos de Uso

### JavaScript/TypeScript

```javascript
async function processImage(imageUrl) {
  try {
    const response = await fetch('/api/functions/v1/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        format: 'jpeg',
        quality: 0.95
      })
    });

    const result = await response.json();

    if (result.success) {
      // Crear elemento imagen con el resultado
      const img = document.createElement('img');
      img.src = result.processedImageBase64;
      document.body.appendChild(img);
      
      console.log(`Tamaño original: ${result.originalSize} bytes`);
      console.log(`Tamaño procesado: ${result.processedSize} bytes`);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
}

// Uso
processImage('https://ejemplo.com/imagen.jpg');
```

### Python

```python
import requests
import json
import base64

def process_image(image_url, format='jpeg', quality=0.95):
    url = '/api/functions/v1/process-image'
    
    payload = {
        'imageUrl': image_url,
        'format': format,
        'quality': quality
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        result = response.json()
        
        if result['success']:
            # Extraer datos base64
            base64_data = result['processedImageBase64'].split(',')[1]
            
            # Guardar imagen procesada
            with open('imagen_procesada.jpg', 'wb') as f:
                f.write(base64.b64decode(base64_data))
            
            print(f"Imagen procesada guardada")
            print(f"Tamaño original: {result['originalSize']} bytes")
            print(f"Tamaño procesado: {result['processedSize']} bytes")
        else:
            print(f"Error: {result['error']}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error de red: {e}")

# Uso
process_image('https://ejemplo.com/imagen.jpg')
```

### cURL

```bash
curl -X POST /api/functions/v1/process-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "format": "jpeg",
    "quality": 0.95
  }'
```

### PHP

```php
<?php
function processImage($imageUrl, $format = 'jpeg', $quality = 0.95) {
    $url = '/api/functions/v1/process-image';
    
    $data = array(
        'imageUrl' => $imageUrl,
        'format' => $format,
        'quality' => $quality
    );
    
    $options = array(
        'http' => array(
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        )
    );
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        echo "Error en la petición\n";
        return;
    }
    
    $response = json_decode($result, true);
    
    if ($response['success']) {
        // Extraer datos base64
        $base64Data = explode(',', $response['processedImageBase64'])[1];
        
        // Guardar imagen
        file_put_contents('imagen_procesada.jpg', base64_decode($base64Data));
        
        echo "Imagen procesada guardada\n";
        echo "Tamaño original: " . $response['originalSize'] . " bytes\n";
        echo "Tamaño procesado: " . $response['processedSize'] . " bytes\n";
    } else {
        echo "Error: " . $response['error'] . "\n";
    }
}

// Uso
processImage('https://ejemplo.com/imagen.jpg');
?>
```

## Limitaciones y Consideraciones

### Limitaciones Técnicas

- **Tamaño máximo de imagen:** 10MB
- **Formatos soportados:** JPG, JPEG, PNG, GIF, WebP
- **Tiempo de procesamiento:** 2-5 segundos típicamente
- **Formato de respuesta:** La imagen se retorna como base64 en la respuesta JSON

### Consideraciones de Rendimiento

- Las imágenes grandes pueden tomar más tiempo en procesarse
- El tamaño de la respuesta será aproximadamente 33% mayor que el archivo original debido a la codificación base64
- Se recomienda implementar timeouts en el cliente para peticiones de larga duración

### Manejo de Errores

La API puede retornar los siguientes errores:

| Error | Descripción | Solución |
|-------|-------------|----------|
| "Se requiere el parámetro 'imageUrl'" | Falta el parámetro imageUrl | Incluir imageUrl en el cuerpo de la petición |
| "URL de imagen inválida" | La URL proporcionada no es válida | Verificar que la URL esté bien formada |
| "No se pudo descargar la imagen" | Error al acceder a la URL | Verificar que la URL sea accesible públicamente |
| "La URL no apunta a una imagen válida" | El contenido no es una imagen | Asegurar que la URL apunte a un archivo de imagen |
| "Formato debe ser 'jpeg' o 'png'" | Formato especificado inválido | Usar solo 'jpeg' o 'png' |
| "La calidad debe estar entre 0.1 y 1.0" | Valor de calidad fuera de rango | Usar valores entre 0.1 y 1.0 |

## Procesamiento sRGB

### ¿Qué hace el procesamiento?

1. **Descarga la imagen** desde la URL proporcionada
2. **Aplica corrección gamma sRGB** para normalizar los colores
3. **Optimiza el contraste y saturación** ligeramente
4. **Convierte al formato especificado** manteniendo la calidad
5. **Retorna la imagen procesada** como base64

### Beneficios del Perfil sRGB

- **Consistencia visual:** Los colores se ven igual en diferentes dispositivos
- **Optimización web:** Mejor rendimiento en navegadores web
- **Estándar universal:** sRGB es el espacio de color estándar para web
- **Compatibilidad:** Funciona correctamente en todos los navegadores modernos

## Integración en Aplicaciones

### React/Next.js

```jsx
import { useState } from 'react';

function ImageProcessor() {
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const processImage = async (imageUrl) => {
    setLoading(true);
    try {
      const response = await fetch('/api/functions/v1/process-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProcessedImage(result.processedImageBase64);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Procesando...</p>}
      {processedImage && <img src={processedImage} alt="Procesada" />}
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div>
    <button @click="processImage" :disabled="loading">
      {{ loading ? 'Procesando...' : 'Procesar Imagen' }}
    </button>
    <img v-if="processedImage" :src="processedImage" alt="Procesada" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      processedImage: null,
      loading: false
    }
  },
  methods: {
    async processImage() {
      this.loading = true;
      try {
        const response = await fetch('/api/functions/v1/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: 'https://ejemplo.com/imagen.jpg' 
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.processedImage = result.processedImageBase64;
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

## Soporte y Contacto

Para reportar problemas o solicitar nuevas funcionalidades, por favor contacta al equipo de desarrollo.

---

**Versión de la API:** 1.0  
**Última actualización:** 2025  
**Estado:** Producción
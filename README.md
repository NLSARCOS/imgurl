# 🎨 Procesador de Imágenes sRGB

Aplicación web PHP para procesar imágenes y aplicar automáticamente el perfil de color sRGB. Perfecta para integrar con herramientas de automatización como n8n, Make, Zapier, etc.

## ✨ Características

- 🔄 Convierte imágenes al perfil de color sRGB automáticamente
- 🌐 API REST para integraciones
- 📤 Interfaz web para subida manual de imágenes
- 🐳 Fácil despliegue con Docker
- 📱 Interfaz responsive y moderna
- 🔒 Configuración de seguridad incluida

## 🚀 Despliegue en EasyPanel

### Método 1: Desde GitHub (Recomendado)

1. **Sube este código a tu repositorio de GitHub**
2. **En EasyPanel:**
   - Ve a "Projects" → "Create Project"
   - Selecciona "GitHub Repository"
   - Conecta tu repositorio
   - EasyPanel detectará automáticamente el Dockerfile

3. **Configuración:**
   - **Port:** 80
   - **Domain:** tu-dominio.com (opcional)
   - Deja las demás configuraciones por defecto

4. **Deploy:** Haz clic en "Deploy"

### Método 2: Docker Compose

1. **Crea un nuevo proyecto en EasyPanel**
2. **Selecciona "Docker Compose"**
3. **Pega este docker-compose.yml:**

```yaml
version: '3.8'
services:
  srgb-processor:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./processed:/var/www/html/processed
      - ./uploads:/var/www/html/uploads
    restart: unless-stopped
```

## 🔌 Uso de la API

### Endpoint Principal
```
POST http://tu-dominio.com/api.php
Content-Type: application/json

{
  "image_url": "https://ejemplo.com/imagen.jpg"
}
```

### Respuesta Exitosa
```json
{
  "success": true,
  "processed_image_url": "http://tu-dominio.com/processed/imagen_srgb.jpg",
  "original_url": "https://ejemplo.com/imagen.jpg",
  "message": "Imagen procesada correctamente"
}
```

## 🛠️ Integraciones

### n8n
1. Usa el nodo "HTTP Request"
2. **Method:** POST
3. **URL:** http://tu-dominio.com/api.php
4. **Body:** `{"image_url": "{{$json.image_url}}"}`
5. **Headers:** `Content-Type: application/json`

### Make (Zapier)
1. Módulo "HTTP Request"
2. **URL:** http://tu-dominio.com/api.php
3. **Method:** POST
4. **Body Type:** JSON
5. **Body:** `{"image_url": "URL_DE_IMAGEN"}`

### cURL Ejemplo
```bash
curl -X POST http://tu-dominio.com/api.php \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://ejemplo.com/imagen.jpg"}'
```

## 📁 Estructura del Proyecto

```
/
├── Dockerfile              # Configuración Docker
├── docker-compose.yml      # Compose para desarrollo local
├── index.php              # Interfaz web principal
├── api.php                # API REST para automatización
├── upload.php             # Manejo de uploads directos
├── .htaccess             # Configuración Apache
├── processed/            # Imágenes procesadas (creado automáticamente)
└── uploads/              # Uploads temporales (creado automáticamente)
```

## 🔧 Características Técnicas

- **PHP 8.2** con ImageMagick y GD
- **Apache** con mod_rewrite habilitado
- **Formatos soportados:** JPEG, PNG, WebP, AVIF
- **Límite de archivo:** 50MB
- **Tiempo de ejecución:** 5 minutos máximo
- **Perfil de color:** sRGB automático

## 🛡️ Seguridad

- Headers de seguridad configurados
- Validación de tipos de archivo
- Protección contra XSS
- Límites de subida configurados
- CORS configurado para APIs

## 📊 Monitoreo

- Logs de Apache disponibles en EasyPanel
- Métricas de uso en el dashboard
- Estado de la aplicación visible

## ❓ Solución de Problemas

### Error: "ImageMagick no disponible"
- Verifica que el container se haya construido correctamente
- Revisa los logs en EasyPanel

### Error: "No se pudo descargar imagen"
- Verifica que la URL sea accesible públicamente
- La imagen debe estar en formato soportado

### Error 413: "Archivo muy grande"
- El límite actual es 50MB
- Para archivos más grandes, modifica el Dockerfile

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en EasyPanel
2. Verifica que el dominio esté correctamente configurado
3. Prueba la API con curl primero

---

¡Tu procesador de imágenes sRGB está listo para usar! 🎉
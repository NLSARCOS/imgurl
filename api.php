<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos JSON del cuerpo de la petición
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['image_url'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'URL de imagen requerida']);
    exit();
}

$imageUrl = $data['image_url'];

// Validar URL
if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'URL inválida']);
    exit();
}

try {
    // Crear directorio si no existe
    $processedDir = __DIR__ . '/processed';
    if (!file_exists($processedDir)) {
        mkdir($processedDir, 0755, true);
    }

    // Descargar imagen
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'sRGB Image Processor 1.0'
        ]
    ]);
    
    $imageData = file_get_contents($imageUrl, false, $context);
    if ($imageData === false) {
        throw new Exception('No se pudo descargar la imagen');
    }

    // Detectar tipo de imagen
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($imageData);
    
    $allowedTypes = [
        'image/jpeg' => '.jpg',
        'image/png' => '.png',
        'image/webp' => '.webp',
        'image/avif' => '.avif'
    ];
    
    if (!isset($allowedTypes[$mimeType])) {
        throw new Exception('Formato de imagen no soportado');
    }

    // Generar nombre único para la imagen procesada
    $originalFilename = basename(parse_url($imageUrl, PHP_URL_PATH));
    $pathInfo = pathinfo($originalFilename);
    $baseName = $pathInfo['filename'] ?: 'image_' . time();
    $extension = $allowedTypes[$mimeType];
    $processedFilename = $baseName . '_srgb' . $extension;
    $processedPath = $processedDir . '/' . $processedFilename;

    // Procesar imagen con ImageMagick
    if (extension_loaded('imagick')) {
        $imagick = new Imagick();
        $imagick->readImageBlob($imageData);
        
        // Aplicar perfil de color sRGB
        $srgbProfile = $imagick->getColorProfile('icc');
        if ($srgbProfile === null || empty($srgbProfile)) {
            // Si no tiene perfil ICC, aplicar sRGB
            $imagick->setColorspace(Imagick::COLORSPACE_SRGB);
        }
        
        // Forzar perfil sRGB
        $imagick->setColorspace(Imagick::COLORSPACE_SRGB);
        
        // Mejorar calidad
        $imagick->setImageCompressionQuality(90);
        
        // Guardar imagen procesada
        if ($mimeType === 'image/jpeg') {
            $imagick->setImageFormat('JPEG');
        } elseif ($mimeType === 'image/png') {
            $imagick->setImageFormat('PNG');
        } elseif ($mimeType === 'image/webp') {
            $imagick->setImageFormat('WEBP');
        }
        
        $imagick->writeImage($processedPath);
        $imagick->clear();
        
    } else {
        throw new Exception('ImageMagick no está disponible');
    }

    // Generar URL de la imagen procesada
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $processedUrl = $protocol . '://' . $host . '/processed/' . $processedFilename;

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'processed_image_url' => $processedUrl,
        'original_url' => $imageUrl,
        'message' => 'Imagen procesada correctamente',
        'file_size' => filesize($processedPath),
        'mime_type' => $mimeType
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error procesando imagen: ' . $e->getMessage()
    ]);
}
?>
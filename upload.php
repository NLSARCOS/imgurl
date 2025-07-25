<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se recibió ninguna imagen válida']);
    exit();
}

try {
    $uploadedFile = $_FILES['image'];
    
    // Validar tipo de archivo
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($uploadedFile['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Formato de imagen no soportado');
    }

    // Crear directorios si no existen
    $uploadsDir = __DIR__ . '/uploads';
    $processedDir = __DIR__ . '/processed';
    
    if (!file_exists($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }
    if (!file_exists($processedDir)) {
        mkdir($processedDir, 0755, true);
    }

    // Generar nombres únicos
    $originalName = pathinfo($uploadedFile['name'], PATHINFO_FILENAME);
    $extension = pathinfo($uploadedFile['name'], PATHINFO_EXTENSION);
    $timestamp = time();
    
    $uploadedFilename = $originalName . '_' . $timestamp . '.' . $extension;
    $processedFilename = $originalName . '_' . $timestamp . '_srgb.' . $extension;
    
    $uploadedPath = $uploadsDir . '/' . $uploadedFilename;
    $processedPath = $processedDir . '/' . $processedFilename;

    // Mover archivo subido
    if (!move_uploaded_file($uploadedFile['tmp_name'], $uploadedPath)) {
        throw new Exception('Error al guardar archivo subido');
    }

    // Procesar imagen con ImageMagick
    if (extension_loaded('imagick')) {
        $imagick = new Imagick($uploadedPath);
        
        // Aplicar perfil de color sRGB
        $srgbProfile = $imagick->getColorProfile('icc');
        if ($srgbProfile === null || empty($srgbProfile)) {
            $imagick->setColorspace(Imagick::COLORSPACE_SRGB);
        }
        
        // Forzar perfil sRGB
        $imagick->setColorspace(Imagick::COLORSPACE_SRGB);
        
        // Mejorar calidad
        $imagick->setImageCompressionQuality(90);
        
        // Guardar imagen procesada
        $imagick->writeImage($processedPath);
        $imagick->clear();
        
    } else {
        throw new Exception('ImageMagick no está disponible');
    }

    // Generar URLs
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $processedUrl = $protocol . '://' . $host . '/processed/' . $processedFilename;

    // Limpiar archivo original subido (opcional)
    unlink($uploadedPath);

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'processed_image_url' => $processedUrl,
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
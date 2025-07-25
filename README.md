# sRGB Image Processor

A complete web application for processing images with sRGB color profile, designed for easy deployment on EasyPanel and integration with automation tools like n8n, Make, and Zapier.

## Features

- **Web Interface**: Upload images via drag-and-drop or file selection
- **URL Processing**: Process images directly from URLs
- **REST API**: Complete API for automation integrations
- **sRGB Conversion**: Automatic conversion to sRGB color profile
- **Auto Cleanup**: Automatic cleanup of processed files after 1 hour
- **Docker Ready**: Containerized for easy deployment

## Quick Start with EasyPanel

### 1. Deploy to EasyPanel

1. **Create New Service** in your EasyPanel dashboard
2. **Choose "Docker Compose"** as the source
3. **Upload this `docker-compose.yml`** file or copy its contents
4. **Set Environment Variables** (optional):
   - `PORT=3001` (default)
   - `NODE_ENV=production`
5. **Deploy** the service

### 2. EasyPanel Configuration

```yaml
# In EasyPanel, use this docker-compose.yml configuration:
version: '3.8'
services:
  srgb-processor:
    image: srgb-image-processor:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - processed_images:/app/backend/processed
    restart: unless-stopped

volumes:
  processed_images:
```

### 3. Manual Docker Build (Alternative)

If you prefer to build manually:

```bash
# Clone and build
docker build -t srgb-image-processor .

# Run container
docker run -d \
  --name srgb-processor \
  -p 3001:3001 \
  -v processed_images:/app/backend/processed \
  srgb-image-processor
```

## API Endpoints

### Upload Image File
```bash
POST /api/upload
Content-Type: multipart/form-data

# Field name: "image"
# Returns: { success: true, processedUrl: "...", processedAt: "..." }
```

### Process Image from URL
```bash
POST /api/process-url
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg"
}

# Returns: { success: true, processedUrl: "...", processedAt: "..." }
```

### Health Check
```bash
GET /health
# Returns: { status: "OK", timestamp: "..." }
```

## Integration Examples

### n8n Integration

1. **HTTP Request Node**:
   - Method: POST
   - URL: `https://your-domain.com/api/process-url`
   - Headers: `Content-Type: application/json`
   - Body: `{ "imageUrl": "{{$json.imageUrl}}" }`

2. **Response**: Use `{{$json.processedUrl}}` for the processed image URL

### Make (Integromat) Integration

1. **HTTP Module**:
   - URL: `https://your-domain.com/api/process-url`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{"imageUrl": "{{imageUrl}}"}`

### Zapier Integration

1. **Webhooks by Zapier**:
   - Event: POST
   - URL: `https://your-domain.com/api/process-url`
   - Payload Type: JSON
   - Data: `{"imageUrl": "{{inputData.imageUrl}}"}`

### cURL Example

```bash
# Process image from URL
curl -X POST https://your-domain.com/api/process-url \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}'

# Upload file
curl -X POST https://your-domain.com/api/upload \
  -F "image=@/path/to/your/image.jpg"
```

## Technical Details

### Supported Image Formats
- JPEG/JPG
- PNG
- WebP
- TIFF

### File Size Limits
- Maximum upload: 10MB per image
- Auto cleanup: Files older than 1 hour are automatically removed

### sRGB Processing
- Uses Sharp library for high-quality image processing
- Converts images to sRGB color space
- Maintains 95% JPEG quality for optimal balance

### Security Features
- File type validation
- File size limits
- Input sanitization
- CORS enabled for web integrations

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (production/development)

## Monitoring

The application includes:
- Health check endpoint at `/health`
- Docker health check configuration
- Automatic file cleanup logging
- Error handling and logging

## Troubleshooting

### Common Issues

1. **"Sharp installation failed"**:
   - The Docker image includes proper Sharp dependencies for Alpine Linux
   - If building locally, ensure you have the required system dependencies

2. **"Failed to process image"**:
   - Check that the image URL is publicly accessible
   - Verify the image format is supported
   - Check file size limits

3. **"API not responding"**:
   - Verify the container is running: `docker ps`
   - Check health endpoint: `curl http://your-domain.com/health`

### Logs

```bash
# View container logs
docker logs srgb-processor

# Follow logs in real-time
docker logs -f srgb-processor
```

## Development

### Local Development

```bash
# Install dependencies
npm install
cd backend && npm install

# Start backend (in backend directory)
npm run dev

# Start frontend (in root directory)
npm run dev
```

### Build for Production

```bash
# Build Docker image
docker build -t srgb-image-processor .

# Or use docker-compose
docker-compose up --build
```

## License

MIT License - feel free to use this in your projects!
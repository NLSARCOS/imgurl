# 🚀 Guía de Despliegue - Aplicación sRGB

## 📋 Opciones de Despliegue

### 🔵 **Opción 1: Con Supabase (Recomendado)**

#### **Ventajas:**
- ✅ Configuración súper rápida (5 minutos)
- ✅ Escalabilidad automática
- ✅ Plan gratuito generoso
- ✅ Edge Functions globales
- ✅ Sin mantenimiento de servidor

#### **Pasos:**
1. **Crear cuenta gratuita:** [supabase.com](https://supabase.com)
2. **Crear nuevo proyecto**
3. **En Bolt:** Click "Connect to Supabase" (esquina superior derecha)
4. **Ingresar credenciales** del dashboard de Supabase
5. **¡Listo!** Tu API estará funcionando automáticamente

#### **Límites del plan gratuito:**
- 500MB de base de datos
- 5GB de ancho de banda
- 2 millones de invocaciones de Edge Functions
- Más que suficiente para empezar

---

### 🟢 **Opción 2: Servidor Propio (Node.js)**

#### **Ventajas:**
- ✅ Control total
- ✅ Sin dependencias externas
- ✅ Datos en tu servidor
- ✅ Personalización completa

#### **Requisitos del servidor:**
- Node.js 18+ 
- 1GB RAM mínimo
- Soporte para Canvas (librerías nativas)

#### **Instalación en tu servidor:**

```bash
# 1. Clonar archivos del servidor
mkdir srgb-processor
cd srgb-processor

# 2. Copiar archivos server/package.json y server/server.js

# 3. Instalar dependencias
npm install

# 4. Construir aplicación React
npm run build

# 5. Iniciar servidor
npm start
```

#### **Configuración en diferentes sistemas:**

##### **Ubuntu/Debian:**
```bash
# Instalar dependencias del sistema para Canvas
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar aplicación
npm install
npm start
```

##### **CentOS/RHEL:**
```bash
# Instalar dependencias
sudo yum groupinstall "Development Tools"
sudo yum install cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

# Instalar Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar aplicación
npm install
npm start
```

##### **Docker:**
```dockerfile
FROM node:18-alpine

# Instalar dependencias para Canvas
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    gif-dev \
    librsvg-dev \
    python3 \
    make \
    g++

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

---

## 🌐 **Configuración de Producción**

### **Variables de Entorno:**
```bash
# .env
PORT=3001
NODE_ENV=production
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_ORIGINS=https://tudominio.com
```

### **Nginx (Proxy Reverso):**
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Aumentar límites para imágenes grandes
        client_max_body_size 10M;
        proxy_read_timeout 60s;
    }
}
```

### **PM2 (Gestor de Procesos):**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start server.js --name "srgb-processor"

# Configurar inicio automático
pm2 startup
pm2 save
```

---

## 📊 **Comparación de Opciones**

| Característica | Supabase | Servidor Propio |
|----------------|----------|-----------------|
| **Tiempo de setup** | 5 minutos | 30-60 minutos |
| **Costo inicial** | Gratis | Servidor + tiempo |
| **Escalabilidad** | Automática | Manual |
| **Mantenimiento** | Ninguno | Actualizaciones, seguridad |
| **Control** | Limitado | Total |
| **Rendimiento** | Excelente | Depende del servidor |
| **Backup** | Automático | Manual |

---

## 🔧 **Solución de Problemas**

### **Errores comunes en servidor propio:**

#### **Error: Canvas no se puede instalar**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

#### **Error: Puerto en uso**
```bash
# Cambiar puerto en server.js o matar proceso
sudo lsof -ti:3001 | xargs kill -9
```

#### **Error: Memoria insuficiente**
```bash
# Aumentar memoria para Node.js
node --max-old-space-size=2048 server.js
```

### **Monitoreo y logs:**
```bash
# Ver logs en tiempo real
pm2 logs srgb-processor

# Monitorear recursos
pm2 monit

# Reiniciar si hay problemas
pm2 restart srgb-processor
```

---

## 🚀 **Recomendación**

### **Para empezar rápido:** Usa **Supabase**
- Setup en 5 minutos
- Sin configuración de servidor
- Escalabilidad automática

### **Para control total:** Usa **servidor propio**
- Más trabajo inicial
- Control completo
- Ideal para empresas

### **Híbrido:** 
- Empieza con Supabase
- Migra a servidor propio cuando necesites más control

---

## 📞 **Soporte**

Si tienes problemas con cualquiera de las opciones:

1. **Supabase:** Revisa la documentación oficial
2. **Servidor propio:** Verifica logs con `pm2 logs`
3. **Ambos:** Asegúrate de que las dependencias estén instaladas correctamente

¡La aplicación está lista para producción en cualquiera de las dos opciones!
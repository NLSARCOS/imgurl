
# Usando una imagen base de Node.js
FROM node:16

# Crear y cambiar al directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente al contenedor
COPY . .

# Compilar si es necesario (si existe un script build)
RUN npm run build

# Exponer el puerto (ajustar si es necesario)
EXPOSE 3001

# Iniciar la aplicación
CMD ["npm", "start"]

FROM php:8.2-apache

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libmagickwand-dev \
    imagemagick \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    libavif-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp --with-avif
RUN docker-php-ext-install gd
RUN pecl install imagick && docker-php-ext-enable imagick

# Configurar Apache
RUN a2enmod rewrite
RUN sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 50M/' /usr/local/etc/php/php.ini-production \
    && sed -i 's/post_max_size = 8M/post_max_size = 50M/' /usr/local/etc/php/php.ini-production \
    && sed -i 's/max_execution_time = 30/max_execution_time = 300/' /usr/local/etc/php/php.ini-production \
    && cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini

# Crear directorio para imágenes procesadas
RUN mkdir -p /var/www/html/processed && chown -R www-data:www-data /var/www/html/processed
RUN mkdir -p /var/www/html/uploads && chown -R www-data:www-data /var/www/html/uploads

# Copiar archivos de la aplicación
COPY . /var/www/html/

# Establecer permisos
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

EXPOSE 80
# Proxy Gemini para Render

Proxy simple para la API de Gemini desplegado en Render.

## Variables de Entorno Requeridas

En Render, configura estas variables de entorno:

- `GEMINI_API_KEY`: Tu clave de API de Google Gemini
- `ALLOWED_ORIGINS`: Dominios permitidos (opcional, por defecto incluye Firebase)

## Endpoints

- `POST /api/gemini`: Proxy principal para Gemini
- `GET /health`: Health check

## Despliegue en Render

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Render detectará automáticamente que es Node.js
4. El servicio estará disponible en la URL que te proporcione Render 
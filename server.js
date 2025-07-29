const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'https://react-personal-website-f59ef.web.app', 
        'https://react-personal-website-f59ef.firebaseapp.com', 
        'https://hassirlastre.com',
        'http://localhost:4173',
        'http://localhost:5173'
    ];

console.log('🌍 CORS - Orígenes permitidos:', allowedOrigins);

// CORS configurado con debugging
const corsOptions = {
    origin: function (origin, callback) {
        console.log(`🔍 CORS Origin Check - Received: "${origin}"`);
        
        // Permitir requests sin origin (ej: aplicaciones móviles, Postman)
        if (!origin) {
            console.log('✅ CORS - Sin origin, permitido');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS - Origin "${origin}" permitido`);
            callback(null, true);
        } else {
            console.log(`❌ CORS - Origin "${origin}" NO permitido`);
            console.log(`📋 Orígenes válidos: ${allowedOrigins.join(', ')}`);
            callback(null, false); // Rechazar sin error
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middleware de debugging para ver headers
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - Origin: "${req.get('Origin') || 'sin origin'}"`);
    next();
});

app.use(express.json({ limit: '1mb' }));

// Validar configuración
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY no está configurada en las variables de entorno');
    process.exit(1);
}

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0'
    });
});

// CORS test endpoint - para debugging
app.get('/cors-test', (req, res) => {
    const origin = req.get('Origin');
    console.log(`🧪 CORS Test - Origin: "${origin}"`);
    res.json({ 
        message: 'CORS test successful',
        receivedOrigin: origin || 'sin origin',
        allowedOrigins: allowedOrigins,
        timestamp: new Date().toISOString()
    });
});

// OPTIONS test para debugging preflight
app.options('/cors-test', (req, res) => {
    console.log('🔧 OPTIONS preflight para /cors-test');
    res.status(204).send();
});

// Endpoint principal de Gemini
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Validaciones
        if (!prompt) {
            return res.status(400).json({ 
                error: "Falta el prompt",
                message: "El campo 'prompt' es requerido"
            });
        }

        if (typeof prompt !== 'string') {
            return res.status(400).json({ 
                error: "Prompt inválido",
                message: "El prompt debe ser una cadena de texto"
            });
        }

        if (prompt.length > 10000) {
            return res.status(400).json({ 
                error: "Prompt demasiado largo",
                message: "El prompt no puede exceder 10,000 caracteres"
            });
        }

        // Llamar a Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Validar respuesta
        if (!text) {
            throw new Error('Respuesta vacía de Gemini');
        }

        // Log de éxito (sin mostrar el prompt completo por seguridad)
        console.log(`✅ Gemini API exitosa - Prompt length: ${prompt.length} chars`);

        res.json({ 
            text: text,
            model: "gemini-2.0-flash",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en Gemini API:', error.message);
        
        // Manejar errores específicos
        if (error.message.includes('API key')) {
            return res.status(401).json({ 
                error: 'Error de autenticación',
                message: 'Clave de API inválida o no autorizada'
            });
        }

        if (error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'Cuota excedida',
                message: 'Se ha excedido el límite de uso de la API'
            });
        }

        // Error genérico
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'Ocurrió un error inesperado'
        });
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        message: 'La ruta solicitada no existe'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Proxy Gemini de Render iniciado en puerto ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'production'}`);
    console.log(`📊 Health check disponible en: http://localhost:${PORT}/health`);
}); 
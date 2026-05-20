const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Configurar CORS explícitamente
const corsOptions = {
    origin: '*',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range'],
    credentials: false,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.send('healthy'));

// Manejar HEAD requests
app.head('/stream', (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).send('Falta el ID del vídeo');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.send();
});

// Manejar GET requests - Usar piped.ai o similares
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        res.status(400).setHeader('Access-Control-Allow-Origin', '*').send('Falta el ID del vídeo');
        return;
    }

    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    try {
        // Usar piped.ai - servicio confiable de YouTube proxy
        const pipedUrl = `https://piped.kavin.rocks/api/v1/streams/${videoId}`;
        
        const response = await fetch(pipedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Piped API error: ${response.status}`);
        }

        const data = await response.json();

        // Buscar el mejor stream de video
        if (!data.videoStreams || data.videoStreams.length === 0) {
            throw new Error('No video streams available');
        }

        // Buscar un stream MP4 de buena calidad
        const videoStream = data.videoStreams
            .filter(s => s.mimeType && s.mimeType.includes('mp4'))
            .sort((a, b) => b.quality - a.quality)[0];

        if (!videoStream || !videoStream.url) {
            throw new Error('No MP4 stream found');
        }

        // Hacer proxy del stream
        const streamResponse = await fetch(videoStream.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!streamResponse.ok) {
            throw new Error(`Stream fetch error: ${streamResponse.status}`);
        }

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', streamResponse.headers.get('content-length') || '');
        
        streamResponse.body.pipe(res);

        streamResponse.body.on('error', (error) => {
            console.error('Stream pipe error:', error);
            if (!res.headersSent) {
                res.status(500).send('Error streaming');
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        
        if (!res.headersSent) {
            res.status(503).json({
                error: 'Service temporarily unavailable',
                message: error.message
            });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor proxy corriendo en puerto ${PORT}`);
});

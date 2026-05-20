const express = require('express');
const cors = require('cors');
const axios = require('axios');

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

// Manejar GET requests - Proxy directo a YouTube
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        res.status(400).setHeader('Access-Control-Allow-Origin', '*').send('Falta el ID del vídeo');
        return;
    }

    // Headers CORS antes de procesar
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        // Obtener información del video de YouTube
        const infoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Usar un user agent real
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        // Intentar obtener el stream directo
        const response = await axios.get(infoUrl, {
            headers,
            responseType: 'stream',
            timeout: 15000
        });

        response.data.pipe(res);

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).send('Error streaming video');
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        
        // Intentar con proxy alternativo
        try {
            const altUrl = `https://invidious.nerdvpn.com/api/v1/videos/${videoId}?fields=formatStreams`;
            
            const altResponse = await axios.get(altUrl, { 
                timeout: 10000
            });

            if (altResponse.data.formatStreams && altResponse.data.formatStreams.length > 0) {
                const stream = altResponse.data.formatStreams.find(s => s.container === 'mp4');
                
                if (stream && stream.url) {
                    const videoResponse = await axios.get(stream.url, {
                        responseType: 'stream',
                        timeout: 15000
                    });

                    videoResponse.data.pipe(res);
                    return;
                }
            }

            throw new Error('No stream found');
        } catch (altError) {
            console.error('Alternative stream error:', altError.message);
            if (!res.headersSent) {
                res.status(503).send('No se pudo obtener el video');
            }
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor proxy corriendo en puerto ${PORT}`);
});

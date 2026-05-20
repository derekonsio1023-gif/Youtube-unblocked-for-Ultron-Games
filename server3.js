const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

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

// Manejar GET requests - Proxy a Invidious
app.get('/stream', (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        res.status(400).setHeader('Access-Control-Allow-Origin', '*').send('Falta el ID del vídeo');
        return;
    }

    // Headers CORS antes de procesar
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');

    // Usar múltiples instancias de Invidious
    const invidiousInstances = [
        'https://invidious.nerdvpn.com',
        'https://iv.nboeck.de',
        'https://invidious.protokolla.fi'
    ];

    const attemptDownload = (instanceIndex) => {
        if (instanceIndex >= invidiousInstances.length) {
            if (!res.headersSent) {
                res.status(503).send('No se puede acceder al servidor de video');
            }
            return;
        }

        const instance = invidiousInstances[instanceIndex];
        const url = `${instance}/latest_version?id=${videoId}&itag=18`;

        const protocol = instance.startsWith('https') ? https : http;

        protocol.get(url, { timeout: 10000 }, (proxyRes) => {
            // Si la respuesta es exitosa, hacer proxy
            if (proxyRes.statusCode === 200) {
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Access-Control-Allow-Origin': '*'
                });
                proxyRes.pipe(res);
            } else {
                // Intentar con la siguiente instancia
                attemptDownload(instanceIndex + 1);
            }
        }).on('error', (error) => {
            console.error(`Error con ${instance}:`, error.message);
            // Intentar con la siguiente instancia
            attemptDownload(instanceIndex + 1);
        });
    };

    attemptDownload(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor proxy corriendo en puerto ${PORT}`);
});

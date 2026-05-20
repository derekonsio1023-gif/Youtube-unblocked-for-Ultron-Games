const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');

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
    res.setHeader('Transfer-Encoding', 'chunked');
    res.send();
});

// Manejar GET requests
app.get('/stream', (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        res.status(400).setHeader('Access-Control-Allow-Origin', '*').send('Falta el ID del vídeo');
        return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Headers CORS antes de procesar
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        // Usar yt-dlp para descargar
        const ytdlp = spawn('yt-dlp', [
            '-f', 'best[ext=mp4]/best',
            '-o', '-',
            '--no-warnings',
            '--quiet',
            videoUrl
        ]);

        let isError = false;

        ytdlp.stdout.pipe(res);

        ytdlp.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            if (!isError) {
                isError = true;
                res.status(500).send('Error al procesar el vídeo');
            }
        });

        ytdlp.on('error', (error) => {
            console.error('Error:', error);
            if (!res.headersSent) {
                res.status(500).send('Error al descargar el vídeo');
            }
        });

        ytdlp.on('close', (code) => {
            if (code !== 0 && !isError) {
                console.error(`yt-dlp exited with code ${code}`);
                if (!res.headersSent) {
                    res.status(500).send('Error al procesar el vídeo');
                }
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al procesar el vídeo');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor proxy corriendo en puerto ${PORT}`);
});

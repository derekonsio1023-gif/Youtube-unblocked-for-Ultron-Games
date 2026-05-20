const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();

// Configurar CORS explícitamente
const corsOptions = {
    origin: '*', // Permitir todas las orígenes
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false
};

app.use(cors(corsOptions));

app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.send('healthy'));

app.get('/stream', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).send('Falta el ID del vídeo');
    }

    const videoUrl = `https://youtube.com/watch?v=${videoId}`;

    try {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');

        ytdl(videoUrl, {
            filter: 'audioandvideo',
            quality: 'highest'
        }).pipe(res);

    } catch (error) {
        console.error(error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).send('Error al procesar el vídeo');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor proxy corriendo en puerto ${PORT}`);
});

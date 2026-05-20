const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    next();
});

/*
|--------------------------------------------------------------------------
| Rutas básicas
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

app.get('/health', (req, res) => {
    res.send('healthy');
});

/*
|--------------------------------------------------------------------------
| STREAM
|--------------------------------------------------------------------------
*/

app.get('/stream', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).send('Falta el ID del vídeo');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {

        // Verifica si el vídeo existe
        const info = await ytdl.getInfo(videoUrl);

        console.log('Reproduciendo:', info.videoDetails.title);

        res.setHeader('Content-Type', 'video/mp4');

        const stream = ytdl(videoUrl, {
            filter: 'audioandvideo',
            quality: 'highest'
        });

        /*
        |--------------------------------------------------------------------------
        | Error del stream
        |--------------------------------------------------------------------------
        */

        stream.on('error', (err) => {
            console.error('Error del stream:', err);

            if (!res.headersSent) {
                res.status(503).send('No se pudo obtener el vídeo');
            } else {
                res.destroy();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Pipe
        |--------------------------------------------------------------------------
        */

        stream.pipe(res);

    } catch (error) {

        console.error('ERROR GENERAL:', error);

        if (!res.headersSent) {
            res.status(503).send('Error al procesar el vídeo');
        }
    }
});

/*
|--------------------------------------------------------------------------
| Puerto
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});

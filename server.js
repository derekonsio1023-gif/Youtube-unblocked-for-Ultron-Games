const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core'); // Librería actualizada para extraer vídeos de YT
const app = express();

app.use(cors()); // Permite que tu web de githack acceda sin bloqueo CORS

app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('Falta el ID del vídeo');

    const videoUrl = `https://youtube.com{videoId}`;

    try {
        // Cabeceras HTTP para transmitir vídeo de forma progresiva en fragmentos
        res.setHeader('Content-Type', 'video/mp4');

        // Descarga el vídeo temporalmente y lo transmite en vivo (stream) al navegador
        ytdl(videoUrl, {
            filter: 'audioandvideo',
            quality: 'highestvideo',
        }).pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar el vídeo');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor proxy corriendo en puerto ${PORT}`));

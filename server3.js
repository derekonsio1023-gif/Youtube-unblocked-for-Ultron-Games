// server.js (Node/Express + ytdl-core)
const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

// Middleware CORS: permitir todos los orígenes (ajustar según necesidad)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Endpoint para transmitir video de YouTube
app.get('/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).send('Falta ID de video');
  }
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Verificar que el video es accesible (opcionalmente se podría comprobar con ytdl-core)
    if (!ytdl.validateID(videoId)) {
      return res.status(400).send('ID de video inválido');
    }

    // Iniciar la descarga/stream del video
    const videoStream = ytdl(url, {
      filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio,
      quality: 'highest'
    });

    // Propagar cabecera de tipo de contenido (se espera que sea MP4)
    res.setHeader('Content-Type', 'video/mp4');
    // Permitir rangos (útil para reproducir y buscar en el video)
    res.setHeader('Accept-Ranges', 'bytes');

    // Manejar errores de ytdl
    videoStream.on('error', err => {
      console.error('Error en ytdl-stream:', err.message || err);
      // Responder con 500 o 503 según el error
      res.sendStatus(500);
    });

    // Pipe: enviar los datos de video al cliente
    videoStream.pipe(res);
  } catch (error) {
    console.error('Error en /stream:', error);
    res.sendStatus(500);
  }
});

// Iniciar servidor en el puerto indicado por Render (env PORT) o 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de streaming escuchando en puerto ${PORT}`);
});

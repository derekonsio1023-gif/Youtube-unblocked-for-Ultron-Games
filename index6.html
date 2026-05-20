import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const VIDEOS = {
  "M7lc1UVf-VE": {
    id: "M7lc1UVf-VE",
    title: "Demo video 1",
    channel: "Mi canal",
    description: "Video de prueba.",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  "2JwfBKrMwnw": {
    id: "2JwfBKrMwnw",
    title: "Demo video 2",
    channel: "Mi canal",
    description: "Segundo video de prueba.",
    thumbnail: "https://i.ytimg.com/vi/2JwfBKrMwnw/hqdefault.jpg",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  }
};

app.get("/api/videos", (req, res) => {
  res.json(Object.values(VIDEOS));
});

app.get("/api/videos/:id", (req, res) => {
  const video = VIDEOS[req.params.id];
  if (!video) return res.status(404).json({ error: "Video no encontrado" });
  res.json(video);
});

app.get("/stream", (req, res) => {
  const id = req.query.id;
  const video = VIDEOS[id];

  if (!id) {
    return res.status(400).json({ error: "Falta el parámetro id" });
  }

  if (!video) {
    return res.status(404).json({ error: "Video no encontrado" });
  }

  return res.redirect(302, video.streamUrl);
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Servidor listo en el puerto ${port}`);
});

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
========================================
CONFIG
========================================
*/

const PORT = process.env.PORT || 10000;

/*
========================================
CORS
========================================
*/

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

/*
========================================
STATIC FILES
========================================
*/

app.use(express.static(path.join(__dirname, "public")));

/*
========================================
VIDEOS
Pon tus mp4 dentro de:
public/videos/
========================================
*/

const VIDEOS = [
    {
        id: "video1",
        title: "Big Buck Bunny",
        channel: "MyTube",
        description: "Video demo.",
        thumbnail: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
        file: path.join(__dirname, "public", "videos", "video1.mp4")
    },

    {
        id: "video2",
        title: "Demo 2",
        channel: "MyTube",
        description: "Segundo video demo.",
        thumbnail: "https://dummyimage.com/1280x720/222/fff.jpg&text=Demo+2",
        file: path.join(__dirname, "public", "videos", "video2.mp4")
    }
];

/*
========================================
API
========================================
*/

app.get("/api/videos", (req, res) => {

    const cleanVideos = VIDEOS.map(v => ({
        id: v.id,
        title: v.title,
        channel: v.channel,
        description: v.description,
        thumbnail: v.thumbnail
    }));

    res.json(cleanVideos);
});

/*
========================================
VIDEO STREAM
========================================
*/

app.get("/stream", (req, res) => {

    const id = req.query.id;

    if (!id) {
        return res.status(400).json({
            error: "Missing video id"
        });
    }

    const video = VIDEOS.find(v => v.id === id);

    if (!video) {
        return res.status(404).json({
            error: "Video not found"
        });
    }

    if (!fs.existsSync(video.file)) {
        return res.status(404).json({
            error: "Video file missing"
        });
    }

    const stat = fs.statSync(video.file);
    const fileSize = stat.size;
    const range = req.headers.range;

    /*
    ========================================
    RANGE STREAMING
    ========================================
    */

    if (range) {

        const parts = range.replace(/bytes=/, "").split("-");

        const start = parseInt(parts[0], 10);

        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

        const chunkSize = (end - start) + 1;

        const stream = fs.createReadStream(video.file, {
            start,
            end
        });

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*"
        });

        stream.pipe(res);

    } else {

        /*
        ========================================
        FULL VIDEO
        ========================================
        */

        res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*"
        });

        fs.createReadStream(video.file).pipe(res);
    }
});

/*
========================================
INDEX.HTML
========================================
*/

app.get("*", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

/*
========================================
START
========================================
*/

app.listen(PORT, () => {

    console.log(`
========================================
SERVER RUNNING
========================================

PORT: ${PORT}

OPEN:
https://tuapp.onrender.com

========================================
`);
});

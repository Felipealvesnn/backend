import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import * as tensoor from '../tensorflow';

import instagram from './intasgramRouters';  // Certifique-se que você tem esse arquivo e ele está configurado corretamente.

const routes = Router();

routes.use(express.static(path.join(__dirname, '../../', 'src', 'views')));
routes.use('/data', express.static(path.join(__dirname, '../../', 'src', 'data')));

routes.use(bodyParser.json({ limit: '50mb' }));  // Para lidar com grandes payloads de imagem
routes.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

routes.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../', 'src', 'views', 'index.html'));
});

routes.get('/video', (req, res) => {
    const videoPath = path.join(__dirname, '../../', 'src', 'data', 'videos', 'sample.mp4');
    fs.access(videoPath, fs.constants.R_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json({ videoPath: '/data/videos/sample.mp4' });
    });
});

// Simulação de resultado de detecção no servidor
routes.post('/process-frame', async (req, res) => {
    const { imageData } = req.body;
    try {
        const results = await tensoor.detectObjectFromframeVideo(imageData);
        // Suponha que results seja algo como { label: 'Lapis', probability: 0.99, x: 100, y: 150, width: 50, height: 30 }
        res.json({ boxes: [results] });
    } catch (error) {
        console.error('Error during object detection:', error);
        res.status(500).json({ error: 'Error processing image with Brain.js' });
    }
});


routes.get('/images', (req, res) => {
    const imagesDir = path.join(__dirname, '../../', 'src', 'data');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read images directory' });
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
        res.json(imageFiles);
    });
});

routes.use("/instagram", instagram);

export default routes;

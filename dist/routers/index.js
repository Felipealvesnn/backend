"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const body_parser_1 = __importDefault(require("body-parser"));
const tensoor = __importStar(require("../tensorflow"));
const intasgramRouters_1 = __importDefault(require("./intasgramRouters")); // Certifique-se que você tem esse arquivo e ele está configurado corretamente.
const routes = (0, express_1.Router)();
routes.use(express_1.default.static(path_1.default.join(__dirname, '../../', 'src', 'views')));
routes.use('/data', express_1.default.static(path_1.default.join(__dirname, '../../', 'src', 'data')));
routes.use(body_parser_1.default.json({ limit: '50mb' })); // Para lidar com grandes payloads de imagem
routes.use(body_parser_1.default.urlencoded({ extended: true, limit: '50mb' }));
routes.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../', 'src', 'views', 'index.html'));
});
routes.get('/video', (req, res) => {
    const videoPath = path_1.default.join(__dirname, '../../', 'src', 'data', 'videos', 'sample.mp4');
    fs_1.default.access(videoPath, fs_1.default.constants.R_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json({ videoPath: '/data/videos/sample.mp4' });
    });
});
// Simulação de resultado de detecção no servidor
routes.post('/process-frame', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { imageData } = req.body;
    try {
        const results = yield tensoor.detectObjectFromframeVideo(imageData);
        // Suponha que results seja algo como { label: 'Lapis', probability: 0.99, x: 100, y: 150, width: 50, height: 30 }
        res.json({ boxes: [results] });
    }
    catch (error) {
        console.error('Error during object detection:', error);
        res.status(500).json({ error: 'Error processing image with Brain.js' });
    }
}));
routes.get('/images', (req, res) => {
    const imagesDir = path_1.default.join(__dirname, '../../', 'src', 'data');
    fs_1.default.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read images directory' });
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
        res.json(imageFiles);
    });
});
routes.use("/instagram", intasgramRouters_1.default);
exports.default = routes;
//# sourceMappingURL=index.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainModel = exports.detectObject = exports.detectObjectFromframeVideo = void 0;
const brain = __importStar(require("brain.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jimp = __importStar(require("jimp"));
// Carregar imagens da pasta especificada
function loadImagesFromFolder(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs.readdirSync(folderPath);
        return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file)).map(file => path.join(folderPath, file));
    });
}
// Pré-processar uma imagem
function preprocessImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const image = yield jimp.read(imagePath);
        const targetSize = 30; // Reduzir a resolução para 30x30
        image.resize(targetSize, targetSize);
        const imageData = new Float32Array(targetSize * targetSize * 3);
        let index = 0;
        image.scan(0, 0, targetSize, targetSize, function (x, y, idx) {
            imageData[index++] = this.bitmap.data[idx] / 255;
            imageData[index++] = this.bitmap.data[idx + 1] / 255;
            imageData[index++] = this.bitmap.data[idx + 2] / 255;
        });
        return imageData;
    });
}
// Criar conjunto de treinamento
function createTrainingSet(folderPath, objectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const imagePaths = yield loadImagesFromFolder(folderPath);
        const trainingSet = [];
        for (const imagePath of imagePaths) {
            const imageData = yield preprocessImage(imagePath);
            trainingSet.push({
                input: imageData,
                output: { [objectName]: 1 },
            });
        }
        return trainingSet;
    });
}
// Treinar modelo de rede neural
function trainModel(folderPath, objectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const modelPath = './src/model/datamodel.json';
        const trainingSet = yield createTrainingSet(folderPath, objectName);
        let net = new brain.NeuralNetwork();
        if (fs.existsSync(modelPath)) {
            console.log('Modelo existente encontrado. Carregando...');
            const modelJson = fs.readFileSync(modelPath, 'utf-8');
            net.fromJSON(JSON.parse(modelJson));
        }
        else {
            console.log('Nenhum modelo existente encontrado. Criando um novo modelo...');
        }
        const batchSize = 5; // Reduzir tamanho do lote para evitar travamentos
        const iterations = 100; // Reduzir número de iterações para evitar travamentos
        const numBatches = Math.ceil(trainingSet.length / batchSize);
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < numBatches; j++) {
                const start = j * batchSize;
                const end = Math.min(start + batchSize, trainingSet.length);
                const batch = trainingSet.slice(start, end);
                net.train(batch, {
                    iterations: 1,
                    log: true,
                    logPeriod: 10, // Reduzir logPeriod para ver logs com mais frequência
                });
            }
        }
        try {
            fs.writeFileSync(modelPath, JSON.stringify(net.toJSON()));
        }
        catch (error) {
            console.error('Erro ao salvar o modelo:', error);
        }
        console.log(`Modelo treinado e salvo como ${modelPath}`);
    });
}
exports.trainModel = trainModel;
// Detectar objetos em novas imagens
function detectObject(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const modelPath = './src/model/datamodel.json';
        const net = new brain.NeuralNetwork();
        if (fs.existsSync(modelPath)) {
            const modelJson = fs.readFileSync(modelPath, 'utf-8');
            net.fromJSON(JSON.parse(modelJson));
        }
        else {
            throw new Error('Modelo não encontrado. Treine o modelo antes de tentar detectar objetos.');
        }
        const imagePaths = yield loadImagesFromFolder(imagePath);
        for (const imagePath of imagePaths) {
            const imageData = yield preprocessImage(imagePath);
            const result = net.run(imageData);
            console.log('Resultados da inferência:', result);
        }
    });
}
exports.detectObject = detectObject;
function detectObjectFromframeVideo(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const net = new brain.NeuralNetwork();
        // Supondo que o modelo já esteja treinado e salvo
        const modelPath = './src/model/datamodel.json';
        if (fs.existsSync(modelPath)) {
            const modelJson = fs.readFileSync(modelPath, 'utf-8');
            net.fromJSON(JSON.parse(modelJson));
        }
        else {
            throw new Error('Modelo não encontrado. Treine o modelo antes de tentar detectar objetos.');
        }
        const result = net.run(imagePath);
        return result;
    });
}
exports.detectObjectFromframeVideo = detectObjectFromframeVideo;
// Treinamento do modelo com quadros salvos
// trainModel('./src/data/frames', 'objectName')
//   .then(() => console.log('Treinamento concluído'))
//   .catch(error => console.error('Erro no treinamento:', error));
//# sourceMappingURL=train.js.map
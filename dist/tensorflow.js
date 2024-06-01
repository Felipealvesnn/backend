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
const tf = __importStar(require("@tensorflow/tfjs-node"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jimp = __importStar(require("jimp"));
const modelDir = "./src/model/datamodelTensor";
const modelPatch = `file://${path.resolve(modelDir)}/model.json`;
const labels = ["Cenoura", "Lápis"]; // Mapeamento de labels
// Carregar imagens da pasta especificada
function loadImagesFromFolder(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs.readdirSync(folderPath);
        return files
            .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
            .map((file) => path.join(folderPath, file));
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
        return tf.tensor3d(imageData, [targetSize, targetSize, 3]);
    });
}
// Criar conjunto de treinamento
function createTrainingSet(folderPath, objectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const imagePaths = yield loadImagesFromFolder(folderPath);
        const trainingSet = [];
        for (const imagePath of imagePaths) {
            const imageData = yield preprocessImage(imagePath);
            const labelIndex = labels.indexOf(objectName);
            const outputTensor = tf.oneHot(labelIndex, labels.length); // Usando o índice da label
            trainingSet.push({
                input: imageData,
                output: outputTensor,
            });
        }
        return trainingSet;
    });
}
// Treinar modelo de rede neural
function trainModel(folderPath, objectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const trainingSet = yield createTrainingSet(folderPath, objectName);
        let model;
        if (fs.existsSync(modelDir) &&
            fs.existsSync(path.join(modelDir, "model.json"))) {
            console.log("Modelo existente encontrado. Carregando...");
            model = (yield tf.loadLayersModel(modelPatch));
            // Recompilando o modelo
            model.compile({
                optimizer: tf.train.adam(),
                loss: "categoricalCrossentropy", // Alterar conforme necessário para classificação multi-classe
                metrics: ["accuracy"],
            });
        }
        else {
            console.log("Nenhum modelo existente encontrado. Criando um novo modelo...");
            model = tf.sequential();
            model.add(tf.layers.conv2d({
                inputShape: [30, 30, 3],
                kernelSize: 3,
                filters: 32,
                activation: "relu",
            }));
            model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
            model.add(tf.layers.flatten());
            model.add(tf.layers.dense({ units: labels.length, activation: "softmax" })); // Alterar conforme necessário para classificação multi-classe
            model.compile({
                optimizer: tf.train.adam(),
                loss: "categoricalCrossentropy", // Alterar conforme necessário para classificação multi-classe
                metrics: ["accuracy"],
            });
        }
        const inputs = tf.concat(trainingSet.map((item) => item.input.expandDims(0)));
        const labelsTensor = tf.concat(trainingSet.map((item) => item.output.expandDims(0)));
        yield model.fit(inputs, labelsTensor, {
            batchSize: 5,
            epochs: 100,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs === null || logs === void 0 ? void 0 : logs.loss}, accuracy = ${logs === null || logs === void 0 ? void 0 : logs.acc}`);
                },
            },
        });
        yield model.save(`file://${path.resolve(modelDir)}`);
        console.log(`Modelo treinado e salvo como ${modelDir}`);
    });
}
exports.trainModel = trainModel;
// Detectar objetos em novas imagens
function detectObject(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const imagePaths = yield loadImagesFromFolder(folderPath);
        const model = yield tf.loadLayersModel(modelPatch);
        for (const imagePath of imagePaths) {
            const imageData = yield preprocessImage(imagePath);
            const result = model.predict(imageData.expandDims(0));
            const output = result.dataSync();
            console.log("Resultados da inferência:", output);
            // Encontrar a classe com a maior probabilidade
            const maxIndex = output.indexOf(Math.max(...output));
            // Mapeia o índice para a label correspondente
            const detectedLabel = labels[maxIndex];
            // Exibir a label detectada e a probabilidade
            console.log(`Imagem: ${imagePath} - Objeto detectado: ${detectedLabel} (Probabilidade: ${output[maxIndex]})`);
        }
    });
}
exports.detectObject = detectObject;
let model = null;
function loadModel() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!model) {
            model = yield tf.loadLayersModel(modelPatch);
            console.log("Modelo carregado com sucesso");
            model.compile({
                optimizer: tf.train.adam(),
                loss: "categoricalCrossentropy",
                metrics: ["accuracy"],
            });
        }
    });
}
function detectObjectFromframeVideo(imageData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadModel();
        if (!model) {
            throw new Error("Modelo não carregado");
        }
        if (!Array.isArray(imageData) || imageData.length !== 30 * 30 * 3) {
            throw new Error("imageData deve ser um array de números com 2700 elementos");
        }
        const inputTensor = tf.tensor3d(imageData, [30, 30, 3]).expandDims(0);
        const prediction = model.predict(inputTensor);
        const result = prediction.dataSync();
        // Encontrar a classe com a maior probabilidade
        const maxIndex = result.indexOf(Math.max(...result));
        // Mapeia o índice para a label correspondente
        const detectedLabel = labels[maxIndex];
        // Retornar a label detectada e a probabilidade
        return [
            {
                label: detectedLabel,
                probability: result[maxIndex],
                x: 50, // Coordenadas de exemplo
                y: 50,
                width: 100,
                height: 100,
            },
        ];
    });
}
exports.detectObjectFromframeVideo = detectObjectFromframeVideo;
// Treinamento do modelo com quadros salvos
// trainModel('./src/data/frames', 'Cenoura')
//   .then(() => console.log('Treinamento concluído'))
//   .catch(error => console.error('Erro no treinamento:', error));
//# sourceMappingURL=tensorflow.js.map
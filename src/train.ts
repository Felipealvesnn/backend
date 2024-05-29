import * as tf from '@tensorflow/tfjs';  // Usar a versão Node.js do TensorFlow.js
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage } from 'canvas';

interface TrainingData {
  images: tf.Tensor[];
  labels: number[];
}

// Define o caminho absoluto para a pasta 'model' dentro de 'src'
const modelDir = path.join(__dirname, 'model');
const modelPath = path.join(modelDir, 'model.json');

// Função para criar o modelo
const createModel = () => {
  const model = tf.sequential();

  model.add(tf.layers.conv2d({
    inputShape: [64, 64, 3],
    filters: 16,
    kernelSize: 3,
    activation: 'relu'
  }));

  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};

// Função para carregar os dados de treinamento
const loadTrainingData = async (): Promise<TrainingData> => {
  const images: tf.Tensor[] = [];
  const labels: number[] = [];

  const imagePath = path.join(__dirname, 'data', 'lapis.png');
  const image = await loadImage(imagePath);
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);
  const data = new Uint8Array(imgData.data.buffer);
  const imgTensor = tf.tensor3d(data, [64, 64, 4]).slice([0, 0, 0], [64, 64, 3]);

  images.push(imgTensor);
  labels.push(1); // Exemplo de rótulo, ajuste conforme necessário

  return { images, labels };
};

// Função para treinar o modelo
const trainModel = async () => {
  // Verificar se a pasta 'model' existe, caso contrário, criar
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir);
  }

  // Verificar se o modelo já existe
  if (fs.existsSync(modelPath)) {
    console.log('Modelo já existe. Carregando modelo existente.');
    const model = await tf.loadLayersModel(`file://${modelPath}`);
    console.log('Modelo carregado.');
    return model;
  } else {
    console.log('Modelo não encontrado. Criando e treinando um novo modelo.');
    const model = createModel();
    await model.save('downloads://my-model');

    const { images, labels } = await loadTrainingData();

    const xs = tf.stack(images);
    const ys = tf.tensor1d(labels);

    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss' })
    });

    // Salvar o modelo no sistema de arquivos usando tf.io.fileSystem
    //tf.io.fileSystem(modelPath, model.toJSON());
    await model.save(`file://${modelDir}`);
    console.log(`Modelo salvo em: ${modelPath}`);
    return model;
  }
};

export default trainModel;

import * as tf from '@tensorflow/tfjs';
import { createCanvas, loadImage, Image } from 'canvas';

interface TrainingData {
  images: tf.Tensor[];
  labels: number[];
}

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

const loadTrainingData = async (): Promise<TrainingData> => {
  const images: tf.Tensor[] = [];
  const labels: number[] = [];

  const image = await loadImage('path/to/your/image.png');
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

const trainModel = async () => {
  const model = createModel();
  const { images, labels } = await loadTrainingData();

  const xs = tf.stack(images);
  const ys = tf.tensor1d(labels);

  await model.fit(xs, ys, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss' })
  });

  const savePath = 'file://./model';
  await model.save(savePath);
  console.log(`Modelo salvo em: ${savePath}`);
};

export default trainModel ;


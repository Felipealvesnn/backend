import * as brain from 'brain.js';
import * as fs from 'fs';
import * as path from 'path';
import * as jimp from 'jimp';

async function loadImagesFromFolder(folderPath: string): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file)).map(file => path.join(folderPath, file));
}

async function preprocessImage(imagePath: string): Promise<Float32Array> {
  const image = await jimp.read(imagePath);
  const targetSize = 64; // Reduzir a resolução para 64x64
  image.resize(targetSize, targetSize);

  const imageData = new Float32Array(targetSize * targetSize * 3);
  let index = 0;
  image.scan(0, 0, targetSize, targetSize, function (x, y, idx) {
    imageData[index++] = this.bitmap.data[idx] / 255;
    imageData[index++] = this.bitmap.data[idx + 1] / 255;
    imageData[index++] = this.bitmap.data[idx + 2] / 255;
  });

  return imageData;
}

async function createTrainingSet(folderPath: string): Promise<{ input: Float32Array; output: { Lapis: number } }[]> {
  const imagePaths = await loadImagesFromFolder(folderPath);
  const trainingSet: { input: Float32Array; output: { Lapis: number } }[] = [];

  for (const imagePath of imagePaths) {
    const imageData = await preprocessImage(imagePath);
    trainingSet.push({
      input: imageData,
      output: { Lapis: 1 },
    });
  }

  return trainingSet;
}

async function trainModel(folderPath: string, modelPath: string) {
  const trainingSet = await createTrainingSet(folderPath);

  let net = new brain.NeuralNetwork();

  if (fs.existsSync(modelPath)) {
    console.log('Modelo existente encontrado. Carregando...');
    const modelJson = fs.readFileSync(modelPath, 'utf-8');
    net.fromJSON(JSON.parse(modelJson));
  } else {
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
  } catch (error) {
    console.error('Erro ao salvar o modelo:', error);
  }
  console.log(`Modelo treinado e salvo como ${modelPath}`);
}

async function detectObject(imagePath: string, modelPath: string) {
  const net = new brain.NeuralNetwork();
  if (fs.existsSync(modelPath)) {
    const modelJson = fs.readFileSync(modelPath, 'utf-8');
    net.fromJSON(JSON.parse(modelJson));
  } else {
    throw new Error('Modelo não encontrado. Treine o modelo antes de tentar detectar objetos.');
  }

  const imageData = await preprocessImage(imagePath);
  const result = net.run(imageData);

  console.log('Resultados da inferência:', result);
  return result;
}

export { detectObject, trainModel };

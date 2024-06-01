import * as tf from "@tensorflow/tfjs-node";
import * as fs from "fs";
import * as path from "path";
import * as jimp from "jimp";

const modelDir = "./src/model/datamodelTensor";
const modelPatch = `file://${path.resolve(modelDir)}/model.json`;

const labels = ["Cenoura", "Lápis"]; // Mapeamento de labels

// Carregar imagens da pasta especificada
async function loadImagesFromFolder(folderPath: string): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  return files
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
    .map((file) => path.join(folderPath, file));
}

// Pré-processar uma imagem
async function preprocessImage(imagePath: string): Promise<tf.Tensor3D> {
  const image = await jimp.read(imagePath);
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
}

// Criar conjunto de treinamento
async function createTrainingSet(
  folderPath: string,
  objectName: string
): Promise<{ input: tf.Tensor3D; output: tf.Tensor }[]> {
  const imagePaths = await loadImagesFromFolder(folderPath);
  const trainingSet: { input: tf.Tensor3D; output: tf.Tensor }[] = [];

  for (const imagePath of imagePaths) {
    const imageData = await preprocessImage(imagePath);
    const labelIndex = labels.indexOf(objectName);
    const outputTensor = tf.oneHot(labelIndex, labels.length); // Usando o índice da label
    trainingSet.push({
      input: imageData,
      output: outputTensor,
    });
  }

  return trainingSet;
}

// Treinar modelo de rede neural
async function trainModel(folderPath: string, objectName: string) {
  const trainingSet = await createTrainingSet(folderPath, objectName);

  let model: tf.Sequential;

  if (
    fs.existsSync(modelDir) &&
    fs.existsSync(path.join(modelDir, "model.json"))
  ) {
    console.log("Modelo existente encontrado. Carregando...");
    model = (await tf.loadLayersModel(modelPatch)) as tf.Sequential;

    // Recompilando o modelo
    model.compile({
      optimizer: tf.train.adam(),
      loss: "categoricalCrossentropy", // Alterar conforme necessário para classificação multi-classe
      metrics: ["accuracy"],
    });
  } else {
    console.log(
      "Nenhum modelo existente encontrado. Criando um novo modelo..."
    );
    model = tf.sequential();
    model.add(
      tf.layers.conv2d({
        inputShape: [30, 30, 3],
        kernelSize: 3,
        filters: 32,
        activation: "relu",
      })
    );
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
  const labelsTensor = tf.concat(
    trainingSet.map((item) => item.output.expandDims(0))
  );

  await model.fit(inputs, labelsTensor, {
    batchSize: 5,
    epochs: 100,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`
        );
      },
    },
  });

  await model.save(`file://${path.resolve(modelDir)}`);
  console.log(`Modelo treinado e salvo como ${modelDir}`);
}

// Detectar objetos em novas imagens
async function detectObject(folderPath: string) {
  const imagePaths = await loadImagesFromFolder(folderPath);

  const model = await tf.loadLayersModel(modelPatch);
  for (const imagePath of imagePaths) {
    const imageData = await preprocessImage(imagePath);
    const result = model.predict(imageData.expandDims(0)) as tf.Tensor;
    const output = result.dataSync();
    console.log("Resultados da inferência:", output);

    // Encontrar a classe com a maior probabilidade
    const maxIndex = output.indexOf(Math.max(...output));

    // Mapeia o índice para a label correspondente
    const detectedLabel = labels[maxIndex];

    // Exibir a label detectada e a probabilidade
    console.log(`Imagem: ${imagePath} - Objeto detectado: ${detectedLabel} (Probabilidade: ${output[maxIndex]})`);
  }
}

let model: tf.LayersModel | null = null;

async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel(modelPatch);
    console.log("Modelo carregado com sucesso");
    model.compile({
      optimizer: tf.train.adam(),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });
  }
}

export async function detectObjectFromframeVideo(imageData: number[]) {
  await loadModel();
  if (!model) {
    throw new Error("Modelo não carregado");
  }

  if (!Array.isArray(imageData) || imageData.length !== 30 * 30 * 3) {
    throw new Error(
      "imageData deve ser um array de números com 2700 elementos"
    );
  }

  const inputTensor = tf.tensor3d(imageData, [30, 30, 3]).expandDims(0);
  const prediction = model.predict(inputTensor) as tf.Tensor;
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
}

export { detectObject, trainModel };

// Treinamento do modelo com quadros salvos
// trainModel('./src/data/frames', 'Cenoura')
//   .then(() => console.log('Treinamento concluído'))
//   .catch(error => console.error('Erro no treinamento:', error));

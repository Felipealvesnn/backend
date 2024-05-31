import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';

// Função para carregar uma imagem e converter para tensor
const loadAndPreprocessImage = (imagePath: string): tf.Tensor<tf.Rank> => {
    const imageBuffer = fs.readFileSync(imagePath);
    const tfImage = tf.node.decodeImage(imageBuffer, 3) as tf.Tensor3D;
    const resizedImage = tf.image.resizeBilinear(tfImage, [224, 224]);
    const normalizedImage = resizedImage.div(tf.scalar(255.0));
    return normalizedImage.expandDims();
}

// Carregar imagens da pasta especificada
const loadImagesFromFolder = async (folderPath: string): Promise<tf.Tensor<tf.Rank>[]> => {
    const imageFiles = fs.readdirSync(folderPath).filter(file => /\.(jpg|jpeg|png)$/i.test(file));
    const images = imageFiles.map(file => loadAndPreprocessImage(path.join(folderPath, file)));
    return Promise.all(images);
}

// Criar um modelo simples para classificação
const createModel = (): tf.Sequential => {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
    }));
    model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 1, activation: 'sigmoid'})); // Para classificação binária

    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

// Função para treinar o modelo
export const trainModel = async (folderPath: string): Promise<void> => {
    const images = await loadImagesFromFolder(folderPath);
    const labels = images.map(() => 1); // Dummy labels: substitua por seus reais labels

    const xs = tf.concat(images);
    const ys = tf.tensor1d(labels, 'int32');

    const model = createModel();
    await model.fit(xs, ys, {
        epochs: 10,
        batchSize: 2
    });

    await model.save('file://model-path'); // Salvar o modelo treinado
}

// Função para inferência
 const predictImage = async (imagePath: string): Promise<Float32Array> => {
    const model = await tf.loadLayersModel('file://model-path/model.json');
    const image = await loadAndPreprocessImage(imagePath); // Certifique-se de que esta função também é async
    const prediction = model.predict(image) as tf.Tensor;

    // Garantir que o tensor está em float32 antes de chamar dataSync
    const predictionFloat32 = prediction.cast('float32');
    return predictionFloat32.dataSync() as Float32Array;
}


// Usar as funções
(async () => {
    const folderPath = './data'; // Substitua pelo caminho para suas imagens
    await trainModel(folderPath);
    const prediction = await predictImage('./data/example.jpg'); // Substitua pelo caminho para uma imagem de teste
    console.log('Prediction:', prediction);
})();

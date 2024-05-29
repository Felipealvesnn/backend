"use strict";
// import * as tf from '@tensorflow/tfjs';
// import * as fs from 'fs';
// import * as path from 'path';
// import { createCanvas, loadImage, Image } from 'canvas';
//  const loadModelAndInfer = async (imagePath: string) => {
//   const modelPath = 'file://./model/model.json';
//   const model = await tf.loadLayersModel(modelPath);
//   const image = await loadImage(imagePath);
//   const canvas = createCanvas(64, 64);
//   const ctx = canvas.getContext('2d');
//   ctx.drawImage(image, 0, 0, 64, 64);
//   const imgData = ctx.getImageData(0, 0, 64, 64);
//   const data = new Uint8Array(imgData.data.buffer);
//   const imgTensor = tf.tensor3d(data, [64, 64, 4]).slice([0, 0, 0], [64, 64, 3]);
//   const batchedImage = imgTensor.expandDims(0);
//   const predictions = model.predict(batchedImage) as tf.Tensor;
//   predictions.print();
// };
// const imagePath = path.join(__dirname, 'path_to_your_image.png');
// export default loadModelAndInfer;
//# sourceMappingURL=infer.js.map
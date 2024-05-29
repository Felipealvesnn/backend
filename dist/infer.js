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
const tf = __importStar(require("@tensorflow/tfjs"));
const path = __importStar(require("path"));
const canvas_1 = require("canvas");
const loadModelAndInfer = (imagePath) => __awaiter(void 0, void 0, void 0, function* () {
    const modelPath = 'file://./model/model.json';
    const model = yield tf.loadLayersModel(modelPath);
    const image = yield (0, canvas_1.loadImage)(imagePath);
    const canvas = (0, canvas_1.createCanvas)(64, 64);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, 64, 64);
    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = new Uint8Array(imgData.data.buffer);
    const imgTensor = tf.tensor3d(data, [64, 64, 4]).slice([0, 0, 0], [64, 64, 3]);
    const batchedImage = imgTensor.expandDims(0);
    const predictions = model.predict(batchedImage);
    predictions.print();
});
const imagePath = path.join(__dirname, 'path_to_your_image.png');
exports.default = loadModelAndInfer;
//# sourceMappingURL=infer.js.map
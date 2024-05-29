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
const fs = __importStar(require("fs/promises"));
const nj = __importStar(require("numjs"));
const maxlen = 30;
const step = 3;
function readFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs.readFile(filePath, 'utf8');
            return data.toString();
        }
        catch (error) {
            throw new Error(`Error reading file: ${error}`);
        }
    });
}
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }
    let max = arr[0];
    let maxIndex = 0;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex;
}
function sample(preds, temperature) {
    preds = nj.array(preds, 'float64');
    preds = nj.log(preds).divide(temperature);
    const exp_preds = nj.exp(preds);
    preds = exp_preds.divide(nj.sum(exp_preds));
    //const arr = preds.tolist();
    return indexOfMax(preds);
}
function createModel(text) {
    return __awaiter(this, void 0, void 0, function* () {
        /* data prep */
        text = text.toLowerCase();
        console.log('corpus length:', text.length);
        let words = text.replace(/(\r\n\t|\n|\r\t)/gm, " ").split(" ");
        words = words.filter(onlyUnique);
        words = words.sort();
        words = words.filter(String);
        console.log("total number of unique words: " + words.length);
        const word_indices = {};
        const indices_word = {};
        for (let [idx, word] of words.entries()) {
            word_indices[word] = idx;
            indices_word[idx] = word;
        }
        console.log("maxlen: " + maxlen, " step: " + step);
        const sentences = [];
        const next_words = [];
        const list_words = text.toLowerCase().replace(/(\r\n\t|\n|\r\t)/gm, " ").split(" ").filter(String);
        console.log('list_words ' + list_words.length);
        for (let i = 0; i < (list_words.length - maxlen); i += step) {
            const sentences2 = list_words.slice(i, i + maxlen).join(" ");
            sentences.push(sentences2);
            next_words.push(list_words[i + maxlen]);
        }
        console.log('nb sequences (length of sentences):', sentences.length);
        console.log("length of next_word", next_words.length);
        console.log('Vectorization...');
        let X = nj.zeros([sentences.length, maxlen, words.length]);
        console.log('X shape: ' + X.shape);
        let y = nj.zeros([sentences.length, words.length]);
        console.log('y shape: ' + y.shape);
        for (let [i, sentence] of sentences.entries()) {
            for (let [t, word] of sentence.split(" ").entries()) {
                X.set(i, t, word_indices[word], 1);
            }
            y.set(i, word_indices[next_words[i]], 1);
        }
        console.log('Creating model... Please wait.');
        console.log("MAXLEN " + maxlen + ", words.length " + words.length);
        const model = tf.sequential();
        model.add(tf.layers.lstm({
            units: 128,
            returnSequences: true,
            inputShape: [maxlen, words.length]
        }));
        model.add(tf.layers.dropout(0.2));
        model.add(tf.layers.lstm({
            units: 128,
            returnSequences: false
        }));
        model.add(tf.layers.dropout(0.2));
        model.add(tf.layers.dense({ units: words.length, activation: 'softmax' }));
        model.compile({ loss: 'categoricalCrossentropy', optimizer: tf.train.rmsprop(0.002) });
        const x_tensor = tf.tensor3d(X.tolist(), [sentences.length, maxlen, words.length]);
        const y_tensor = tf.tensor2d(y.tolist(), [sentences.length, words.length]);
        /* training */
        yield model.fit(x_tensor, y_tensor, {
            epochs: 100,
            batchSize: 32,
            callbacks: {
                onEpochEnd: (epoch, logs) => __awaiter(this, void 0, void 0, function* () {
                    console.log((logs === null || logs === void 0 ? void 0 : logs.loss) + ",");
                })
            }
        });
    });
}
// Replace '<file>' with the actual path to your text file
const filePath = '<file>';
readFile(filePath)
    .then(text => createModel(text))
    .catch(error => console.error(error));
//# sourceMappingURL=tensor.js.map
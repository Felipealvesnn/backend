import express, { Request, Response } from 'express';
import * as path from 'path';
import Router from './routers/index';
//import * as brains from './train';
//import loadModelAndInfer from './infer';
 import * as tensor from './tensorflow';
// tensor.main();

var i = 0;

  // while (i < 40) {
  //   console.log('treinando');
  //    brains.trainModel('./src/data/cenoura', 'cenoura');
  //   console.log('treinado');
  //   i++
  //   //brains.detectObject('./src/data/cenoura');
  // }

//brains.trainModel('./src/data/cenoura','cenoura');
//tensor.trainModel('./src/data/cenoura', 'Cenoura');
tensor.detectObject('./src/data/cenoura');






const app = express();
const port = 3000;

app.use(Router);



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

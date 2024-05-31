import express, { Request, Response } from 'express';
import * as path from 'path';

//import loadModelAndInfer from './infer';
import * as brains from './train';

var i = 0;

  // while (i < 40) {
  //   console.log('treinando');
  //    brains.trainModel('./src/data/cenoura', 'cenoura');
  //   console.log('treinado');
  //   i++
  //   //brains.detectObject('./src/data/cenoura');
  // }

//brains.trainModel('./src/data/cenoura','cenoura');
//brains.detectObject('./src/data/cenoura');



import Router from './routers/index';



const app = express();
const port = 3000;

app.use(Router);



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

import express, { Request, Response } from 'express';
import * as path from 'path';

//import loadModelAndInfer from './infer';
import { trainModel } from './train';



trainModel('./src/data', path.join('./src/model/datamodel.json'));


import  Router  from './routers/index';



const app = express();
const port = 3000;

app.use(Router);



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

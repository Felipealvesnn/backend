import { Router } from "express";
import instagram from "./intasgramRouters";

const routes = Router();

routes.get('/', (req, res) => {
    res.send('Hello World!');
});



routes.use("/instagram", instagram);





export default routes;


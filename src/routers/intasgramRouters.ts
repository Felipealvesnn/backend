import express from "express";
import * as instagramController from "../controllers/instagramController"; 


const instagram = express.Router();

instagram.get("/", instagramController.indexUsers);



export default instagram;
import { Request, Response } from "express";


export const indexUsers = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
   
    
    return res.json({ message: "Hello, World!" });
  };
import { Request, Response, NextFunction } from "express";

export default async (req: Request, res:Response, next: NextFunction) => {
    try {
        let time = new Date();
        console.log(`Method : ${req.method}, Path : ${req.path}, Time : ${time.getHours()}h ${time.getMinutes()}m ${time.getSeconds()}s `);
        next();
    } catch (e){
        res.status(500).json({ error: "error" });
    }
  };
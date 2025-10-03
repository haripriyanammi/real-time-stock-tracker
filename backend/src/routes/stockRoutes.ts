import express from "express";
import type { Request, Response } from "express";
import Stock from "../models/stocks.js"; // Assuming you have a Stock model defined
const router=express.Router();
//get all stocks
router.get("/", async (req: Request, res: Response) => {
    try {
        const stocks = await Stock.find();
        res.json(stocks);
    } catch (error) {
        console.error("Error fetching stocks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//create a new stock
router.post("/", async (req: Request, res: Response) => {
    try{
        const{symbol,targetprice} = req.body;
        const newStock = new Stock({
            symbol,
            targetprice,
    });
    await newStock.save();
    res.status(201).json(newStock);
    }catch(error){
        console.error("Error creating stock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//get a stock by symbol
router.get("/:symbol", async (req: Request, res: Response) => {
    try{
        const stock=await Stock.findOne({ symbol: req.params.symbol });
        if (!stock) {
            return res.status(404).json({ error: "Stock not found" });
        }
        res.json(stock);    
    } catch (error) {
        console.error("Error fetching stock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
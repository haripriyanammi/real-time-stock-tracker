import express  from 'express';
import  type {Request, Response} from 'express';
import Stock from '../models/stocks.js'; // Assuming you have a Stock model defined
//add a new stock
export const addStock = async (req: Request, res: Response) => {
    try {
        //extract stock details from the request body
        const {symbol,targetprice,currentprice,status} = req.body;
        //create a new stock instance
        const newStock = new Stock({
            symbol,
            targetprice,
            currentprice,
            status,
        });

        //save the stock to the database
        await newStock.save();
        
        //send a response back to the client
        res.status(201).json({
            message: 'Stock created successfully',
            stock: newStock,
        });
    } catch (error) {
        console.error("Error creating stock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
//get all stocks
export const getStocks=async (_req: Request, res: Response) => {
    try {
        const stocks = await Stock.find();
        //send the stocks as a response
        res.status(200).json(stocks);
    } catch (error) {
        console.error("Error fetching stocks:", error);
        res.status(500).json({ error: "Internal server error",details:error });
    }
};

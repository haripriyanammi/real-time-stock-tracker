import mongoose,{Schema,Document} from "mongoose";
// Define the Stock interface
export interface IStock extends Document {
    symbol: string;//stock symbol, e.g., "AAPL"
    targetprice: number;//the target price for the stock
    currentprice:number;//latest market price of the stock
    status:string;//pending,hit, or miss
    createdAt: Date;//timestamp when the stock was created

}
//create a mongoose schema for the stock
const StockSchema:Schema= new Schema({
symbol: 
{
    type: String,
    required: true
},
targetprice: 
{
    type: Number,
    required: true
},
currentprice: 
{
    type: Number,
    required: true
},
status: { type: String, default: "pending" },

createdAt: 
{
    type: Date,
    default: Date.now
},
});
//create a mongoose model for the stock
const StockModel= mongoose.model<IStock>("Stock", StockSchema);
export default StockModel;
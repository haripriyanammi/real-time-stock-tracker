import axios from 'axios';

export const getCurrentPrice = async (symbol: string): Promise<number> => {
    try {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const response = await axios.get(url);
        const priceStr= response.data['Global Quote']['05. price'];
        if(!priceStr) {
            throw new Error(`Price not found for symbol: ${symbol}`);
        }
        const price = parseFloat(priceStr);
        if (isNaN(price)) {
            throw new Error(`Invalid price for symbol: ${symbol}`);
        }
        return price;
    } catch (error) {
        console.error(`Error fetching current price for ${symbol}:`, error);
        throw error;
    }
};

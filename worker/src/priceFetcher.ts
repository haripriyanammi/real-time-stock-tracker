import fetch from "node-fetch";

export async function fetchPrice(symbol: string): Promise<number> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY; // from .env
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching price for ${symbol}: ${response.status} ${response.statusText}`);
  }

  // Tell TS this is an object
  const data = (await response.json()) as Record<string, any>;

  // Alpha Vantage nests price here:
  const priceStr = data["Global Quote"]?.["05. price"];

  if (!priceStr) {
    throw new Error(`Unexpected response for ${symbol}: ${JSON.stringify(data)}`);
  }

  const price = Number(priceStr);
  if (Number.isNaN(price)) {
    throw new Error(`Invalid price value for ${symbol}: ${priceStr}`);
  }

  return price;
}

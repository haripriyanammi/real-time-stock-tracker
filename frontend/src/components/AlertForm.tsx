import { useState } from 'react';//to store form data

//click on submit button this function will be called as the props will take the values of symbol and target price
type Props = {
  onSubmit: (symbol: string, target: number) => void;
};
//set symbol a function to update the symbol state
export default function AlertForm({ onSubmit }: Props) {
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !target) return;
    onSubmit(symbol.toUpperCase(), parseFloat(target));
    //clears the input fields after submission
    setSymbol('');
    setTarget('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Stock Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Target Price"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}

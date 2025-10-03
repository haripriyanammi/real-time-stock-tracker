import { useState } from 'react';

type Props = {
  onSubmit: (symbol: string, target: number) => void;
};

export default function AlertForm({ onSubmit }: Props) {
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !target) return;
    onSubmit(symbol.toUpperCase(), parseFloat(target));
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

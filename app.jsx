import { useState } from 'react';

function App() {
  const [stockPrice, setStockPrice] = useState('');
  const [desiredProfit, setDesiredProfit] = useState(100);

  // Calculate investment needed
  const calculateInvestment = () => {
    if (!stockPrice || isNaN(stockPrice) || stockPrice <= 0) return 'Invalid input';
    const priceInDollars = parseFloat(stockPrice);
    const sharesNeeded = desiredProfit / 0.01; // Profit per 1-cent gain
    const investment = priceInDollars * sharesNeeded;
    return investment.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Stock Investment Calculator</h1>
        <p className="text-gray-600 mb-4 text-center">
          Calculate how much to invest to earn a specific profit per 1-cent gain in stock price.
        </p>
        
        <div className="mb-4">
          <label htmlFor="stockPrice" className="block text-sm font-medium text-gray-700">
            Stock Price ($)
          </label>
          <input
            type="number"
            id="stockPrice"
            step="0.01"
            min="0"
            value={stockPrice}
            onChange={(e) => setStockPrice(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 3.03"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="desiredProfit" className="block text-sm font-medium text-gray-700">
            Desired Profit per 1-Cent Gain
          </label>
          <select
            id="desiredProfit"
            value={desiredProfit}
            onChange={(e) => setDesiredProfit(parseFloat(e.target.value))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>$1</option>
            <option value={10}>$10</option>
            <option value={100}>$100</option>
          </select>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Investment Needed: <span className="text-blue-600">{calculateInvestment()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
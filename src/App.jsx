import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [stockPrice, setStockPrice] = useState('')
  const [desiredProfit, setDesiredProfit] = useState(1)
  const [customProfit, setCustomProfit] = useState('')
  const [useCustomProfit, setUseCustomProfit] = useState(false)
  const [investment, setInvestment] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [calculationHistory, setCalculationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')

  const calculateInvestment = async (forceStockPrice = null, forceProfit = null) => {
    const currentStockPrice = forceStockPrice || stockPrice
    const currentProfit = forceProfit || (useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit)
    
    console.log('calculateInvestment called with:', {
      currentStockPrice,
      currentProfit,
      forceStockPrice,
      forceProfit,
      stockPrice,
      desiredProfit,
      useCustomProfit,
      customProfit
    })
    
    if (!currentStockPrice || isNaN(currentStockPrice) || currentStockPrice <= 0) {
      setError('Please enter a valid stock price')
      return
    }

    if (!currentProfit || currentProfit <= 0) {
      setError('Please enter a valid profit amount')
      return
    }

    setIsLoading(true)
    setError('')

    console.log('Sending to backend:', {
      stockPrice: parseFloat(currentStockPrice),
      desiredProfit: currentProfit
    })

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockPrice: parseFloat(currentStockPrice),
          desiredProfit: currentProfit
        })
      })

      if (!response.ok) {
        throw new Error('Calculation failed')
      }

      const data = await response.json()
      console.log('Received from backend:', data)
      console.log('About to set investment to:', data.investment)
      console.log('Current investment state before update:', investment)
      setInvestment(data.investment)
      console.log('Investment state should now be:', data.investment)
      
      // Add to calculation history
      const newCalculation = {
        id: Date.now(),
        stockPrice: parseFloat(currentStockPrice),
        profit: currentProfit,
        investment: data.investment,
        timestamp: new Date().toLocaleString()
      }
      setCalculationHistory(prev => [newCalculation, ...prev.slice(0, 9)]) // Keep last 10
      
    } catch (err) {
      setError('Failed to calculate investment. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockPriceChange = (e) => {
    setStockPrice(e.target.value)
    setError('')
    // Auto-calculate when both values are available
    if (e.target.value && !isNaN(e.target.value) && e.target.value > 0) {
      setTimeout(calculateInvestment, 100)
    }
  }

  const handleProfitChange = (e) => {
    console.log('handleProfitChange called with:', e.target.value)
    console.log('Current investment before change:', investment)
    const newProfit = parseFloat(e.target.value)
    setDesiredProfit(newProfit)
    setUseCustomProfit(false)
    setInvestment(null) // Clear previous result to force recalculation
    console.log('Investment cleared, about to recalculate')
    // Auto-calculate when stock price is available
    if (stockPrice && !isNaN(stockPrice) && stockPrice > 0) {
      setTimeout(() => calculateInvestment(stockPrice, newProfit), 100)
    }
  }

  const handleCustomProfitChange = (e) => {
    setCustomProfit(e.target.value)
    setUseCustomProfit(true)
    setInvestment(null) // Clear previous result to force recalculation
    // Auto-calculate when stock price is available
    if (stockPrice && !isNaN(stockPrice) && stockPrice > 0 && e.target.value) {
      setTimeout(calculateInvestment, 100)
    }
  }

  const clearHistory = () => {
    setCalculationHistory([])
  }

  const exportCalculations = () => {
    const dataStr = JSON.stringify(calculationHistory, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'investment-calculations.json'
    link.click()
  }

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to calculate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        calculateInvestment()
      }
      // Ctrl/Cmd + D to toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setDarkMode(prev => !prev)
      }
      // Ctrl/Cmd + H to toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setShowHistory(prev => !prev)
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowChat(false)
        setShowHistory(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load saved preferences
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
    
    const savedHistory = localStorage.getItem('calculationHistory')
    if (savedHistory) {
      setCalculationHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory))
  }, [calculationHistory])

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatQuery.trim()) return

    setIsChatLoading(true)
    setChatResponse('')

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: chatQuery,
          stockPrice: parseFloat(stockPrice) || null,
          desiredProfit: desiredProfit,
          investment: investment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      setChatResponse(data.response)
    } catch (err) {
      setChatResponse('Sorry, I couldn\'t process your question. Please make sure your OpenAI API key is configured properly.')
      console.error('Chat error:', err)
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } flex items-center justify-center p-4 sm:p-8`}>
      {/* Dark/Light Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-4 right-4 z-20 p-3 rounded-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-white/10 text-white hover:bg-white/20' 
            : 'bg-black/10 text-gray-800 hover:bg-black/20'
        }`}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      >
        {darkMode ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Glassmorphism container */}
      <div className={`relative backdrop-blur-2xl backdrop-blur-fallback border rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-16 w-full max-w-lg sm:max-w-2xl shadow-2xl ${
        darkMode 
          ? 'bg-white/10 border-white/20' 
          : 'bg-white/80 border-white/40'
      }`}>
        {/* Subtle inner glow */}
        <div className={`absolute inset-1 rounded-[1.75rem] sm:rounded-[2.75rem] pointer-events-none ${
          darkMode 
            ? 'bg-gradient-to-br from-white/10 to-transparent' 
            : 'bg-gradient-to-br from-white/30 to-transparent'
        }`}></div>
        
        <div className="relative z-10">
          {/* Header */}
                <div className="text-center mb-8 sm:mb-16">
                <div className="w-24 h-24 sm:w-36 sm:h-36 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl mx-auto mb-8 sm:mb-12 flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className={`text-6xl sm:text-8xl font-extrabold mb-4 sm:mb-8 tracking-tight drop-shadow-xl ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Investment
                </h1>
                <p className={`font-light text-sm sm:text-lg tracking-wide ${
                  darkMode ? 'text-white/60' : 'text-black-600'
                }`}>
                  Calculate your strategy with the <b className={darkMode ? "text-white" : "text-gray-900"}>Mathing</b> App
                </p>
                </div>

                {/* Explainer Section */}
          <div className={`mb-8 sm:mb-16 backdrop-blur-sm border rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20' 
              : 'bg-gradient-to-br from-blue-100/50 to-purple-100/50 border-blue-200/50'
          }`}>
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className={`w-2 h-2 sm:w-3 sm:h-3 ${darkMode ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={`text-lg sm:text-2xl font-semibold tracking-wide ${
                darkMode ? 'text-white/90' : 'text-gray-800'
              }`}>How It Works</h2>
            </div>
            <div className={`space-y-3 sm:space-y-4 font-light text-sm sm:text-lg leading-relaxed ${
              darkMode ? 'text-white/70' : 'text-gray-700'
            }`}>
              <p>
                This calculator determines <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>how many shares you need to buy</span> to earn a specific profit when the stock price increases by just 1¢.
              </p>
              <p>
                <span className="text-blue-600 font-medium">Example:</span> If you want to earn $10 for every 1¢ the stock goes up, you need to buy 1,000 shares. 
                When the price increases from $5.00 to $5.01, you profit $10.
              </p>
              <p className={`text-xs sm:text-base italic ${
                darkMode ? 'text-white/50' : 'text-gray-500'
              }`}>
                Formula: Shares needed = Desired profit ÷ $0.01 • Investment = Shares × Stock price
              </p>
            </div>
          </div>
          
          <div className="space-y-6 sm:space-y-12">
            {/* Stock Price Input */}
            <div>
              <label htmlFor="stockPrice" className={`block text-sm sm:text-lg font-medium mb-3 sm:mb-6 tracking-wide ${
                darkMode ? 'text-white/80' : 'text-gray-700'
              }`}>
                Stock Price
              </label>
              <div className="relative">
                <span className={`absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-2xl sm:text-4xl font-light ${
                  darkMode ? 'text-white/60' : 'text-gray-500'
                }`}>$</span>
                <input
                  id="stockPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter stock price"
                  value={stockPrice}
                  onChange={handleStockPriceChange}
                  className={`w-full pl-14 sm:pl-20 pr-6 sm:pr-12 py-7 sm:py-14 backdrop-blur-sm border-2 rounded-3xl sm:rounded-[2.5rem] outline-none transition-all duration-300 text-2xl sm:text-4xl font-light shadow-inner ${
                    darkMode 
                      ? 'bg-white/5 border-white/20 focus:bg-white/10 focus:border-white/40 text-white placeholder-white/40' 
                      : 'bg-white/50 border-gray-200/50 focus:bg-white/70 focus:border-gray-300/50 text-gray-800 placeholder-gray-400'
                  }`}
                  aria-describedby="stockPrice-help"
                />
              </div>
              <div id="stockPrice-help" className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                Enter the current price per share
              </div>
            </div>

            {/* Profit Selection */}
            <div>
              <label htmlFor="profit" className={`block text-sm sm:text-lg font-medium mb-3 sm:mb-6 tracking-wide ${
                darkMode ? 'text-white/80' : 'text-gray-700'
              }`}>
                Profit per 1¢ Gain
              </label>
              
              {/* Preset Options */}
              <div className="relative mb-4">
                <select
                  id="profit"
                  value={useCustomProfit ? 'custom' : desiredProfit}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomProfit(true)
                    } else {
                      handleProfitChange(e)
                    }
                  }}
                  className={`w-full px-6 sm:px-12 py-7 sm:py-14 backdrop-blur-sm border-2 rounded-3xl sm:rounded-[2.5rem] outline-none transition-all duration-300 text-2xl sm:text-4xl font-light appearance-none cursor-pointer shadow-inner pr-12 sm:pr-16 ${
                    darkMode 
                      ? 'bg-white/5 border-white/20 focus:bg-white/10 focus:border-white/40 text-white' 
                      : 'bg-white/50 border-gray-200/50 focus:bg-white/70 focus:border-gray-300/50 text-gray-800'
                  }`}
                  aria-describedby="profit-help"
                >
                  <option value={1} className={darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-800"}>$1</option>
                  <option value={10} className={darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-800"}>$10</option>
                  <option value={100} className={darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-800"}>$100</option>
                  <option value="custom" className={darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-800"}>Custom Amount</option>
                </select>
              </div>

              {/* Custom Profit Input */}
              {useCustomProfit && (
                <div className="relative">
                  <span className={`absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-xl sm:text-2xl font-light ${
                    darkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter custom amount"
                    value={customProfit}
                    onChange={handleCustomProfitChange}
                    className={`w-full pl-12 sm:pl-16 pr-6 sm:pr-12 py-5 sm:py-8 backdrop-blur-sm border-2 rounded-2xl sm:rounded-3xl outline-none transition-all duration-300 text-lg sm:text-2xl font-light shadow-inner ${
                      darkMode 
                        ? 'bg-white/5 border-white/20 focus:bg-white/10 focus:border-white/40 text-white placeholder-white/40' 
                        : 'bg-white/50 border-gray-200/50 focus:bg-white/70 focus:border-gray-300/50 text-gray-800 placeholder-gray-400'
                    }`}
                    aria-label="Custom profit amount"
                  />
                </div>
              )}
              
              <div id="profit-help" className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                How much profit you want for each 1¢ price increase
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className={`backdrop-blur-sm border rounded-2xl sm:rounded-3xl px-4 sm:px-8 py-3 sm:py-6 font-light text-sm sm:text-lg ${
                darkMode 
                  ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                  : 'bg-red-100/80 border-red-200/50 text-red-700'
              }`} role="alert" aria-live="polite">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-6 sm:py-12" aria-live="polite" aria-label="Calculating investment">
                <div className={`inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 sm:border-3 ${
                  darkMode 
                    ? 'border-white/20 border-t-white/80' 
                    : 'border-gray-300 border-t-gray-700'
                }`}></div>
                <p className={`mt-3 text-sm ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>
                  Calculating your investment...
                </p>
              </div>
            )}

            {/* Result Display */}
            {investment !== null && !isLoading && (
              <div className={`backdrop-blur-sm border-2 rounded-3xl sm:rounded-[2.5rem] p-10 sm:p-20 text-center shadow-2xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/30' 
                  : 'bg-gradient-to-br from-white/80 to-white/60 border-white/50'
              }`}>
                <h3 className={`text-2xl sm:text-4xl font-semibold mb-6 sm:mb-12 tracking-wide ${
                  darkMode ? 'text-white/90' : 'text-gray-800'
                }`}>Required Investment</h3>
                <p className={`text-4xl sm:text-6xl font-extrabold mb-6 sm:mb-12 tracking-tight break-all ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  ${investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                
                {/* Calculation Breakdown */}
                <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/30 border-white/30'
                }`}>
                  <div className={`text-base sm:text-xl font-medium mb-3 ${
                    darkMode ? 'text-white/90' : 'text-gray-800'
                  }`}>
                    Calculation Breakdown
                  </div>
                  <div className={`space-y-2 text-sm sm:text-lg font-light ${
                    darkMode ? 'text-white/70' : 'text-gray-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span>Shares needed:</span>
                      <span className="font-medium">
                        {((useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit) / 0.01).toLocaleString('en-US')} shares
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Price per share:</span>
                      <span className="font-medium">${parseFloat(stockPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Profit per 1¢ gain:</span>
                      <span className="font-medium">${useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit}</span>
                    </div>
                    <hr className={`my-2 ${darkMode ? 'border-white/20' : 'border-gray-300'}`} />
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Investment (calculated):</span>
                      <span className={darkMode ? 'text-green-400' : 'text-green-600'}>
                        ${(((useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit) / 0.01) * parseFloat(stockPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Investment (from backend):</span>
                      <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                        ${investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What If Scenario Calculator */}
                <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20' 
                    : 'bg-gradient-to-br from-purple-100/50 to-blue-100/50 border-purple-200/50'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h4 className={`text-base sm:text-xl font-medium ${
                      darkMode ? 'text-white/90' : 'text-gray-800'
                    }`}>
                      What If Calculator
                    </h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs sm:text-sm font-medium mb-2 ${
                        darkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>
                        If stock price reaches:
                      </label>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-light ${
                          darkMode ? 'text-white/60' : 'text-gray-500'
                        }`}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Target price"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className={`w-full pl-8 pr-4 py-3 backdrop-blur-sm border rounded-xl outline-none transition-all duration-300 text-lg font-light ${
                            darkMode 
                              ? 'bg-white/5 border-white/20 focus:bg-white/10 focus:border-white/40 text-white placeholder-white/40' 
                              : 'bg-white/50 border-gray-200/50 focus:bg-white/70 focus:border-gray-300/50 text-gray-800 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    {targetPrice && parseFloat(targetPrice) > 0 && (
                      <div className={`p-3 rounded-xl border space-y-2 text-sm ${
                        darkMode 
                          ? 'bg-white/5 border-white/10 text-white/80' 
                          : 'bg-white/30 border-white/30 text-gray-700'
                      }`}>
                        <div className="flex justify-between">
                          <span>Price change:</span>
                          <span className={`font-medium ${
                            (parseFloat(targetPrice) - parseFloat(stockPrice)) > 0 
                              ? (darkMode ? 'text-green-400' : 'text-green-600')
                              : (darkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {(parseFloat(targetPrice) - parseFloat(stockPrice)) > 0 ? '+' : ''}
                            ${(parseFloat(targetPrice) - parseFloat(stockPrice)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>New investment value:</span>
                          <span className="font-medium">
                            ${(((useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit) / 0.01) * parseFloat(targetPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total profit/loss:</span>
                          <span className={`font-bold ${
                            (parseFloat(targetPrice) - parseFloat(stockPrice)) > 0 
                              ? (darkMode ? 'text-green-400' : 'text-green-600')
                              : (darkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {(parseFloat(targetPrice) - parseFloat(stockPrice)) > 0 ? '+' : ''}
                            ${(((useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit) / 0.01) * (parseFloat(targetPrice) - parseFloat(stockPrice))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className={`text-lg sm:text-2xl font-light tracking-wide ${
                  darkMode ? 'text-white/60' : 'text-gray-600'
                }`}>
                  Buy {((useCustomProfit && customProfit ? parseFloat(customProfit) : desiredProfit) / 0.01).toLocaleString('en-US')} shares at ${stockPrice} each
                </p>
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                      darkMode 
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                        : 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30'
                    }`}
                  >
                    View History
                  </button>
                  <button
                    onClick={exportCalculations}
                    disabled={calculationHistory.length === 0}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                        : 'bg-green-500/20 text-green-700 hover:bg-green-500/30'
                    }`}
                  >
                    Export Data
                  </button>
                </div>
              </div>
            )}

            {/* Calculation History */}
            {showHistory && calculationHistory.length > 0 && (
              <div className={`backdrop-blur-sm border rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 ${
                darkMode 
                  ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
                  : 'bg-gradient-to-br from-purple-100/50 to-pink-100/50 border-purple-200/50'
              }`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className={`text-lg sm:text-2xl font-semibold ${
                    darkMode ? 'text-white/90' : 'text-gray-800'
                  }`}>Calculation History</h3>
                  <button
                    onClick={clearHistory}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      darkMode 
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                        : 'bg-red-500/20 text-red-700 hover:bg-red-500/30'
                    }`}
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {calculationHistory.map((calc) => (
                    <div key={calc.id} className={`p-3 sm:p-4 rounded-xl border ${
                      darkMode 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white/50 border-white/30'
                    }`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className={`text-sm sm:text-base font-medium ${
                            darkMode ? 'text-white/90' : 'text-gray-800'
                          }`}>
                            ${calc.stockPrice} stock → ${calc.profit} profit
                          </div>
                          <div className={`text-lg sm:text-xl font-bold ${
                            darkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            ${calc.investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-white/50' : 'text-gray-500'
                        }`}>
                          {calc.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Chat Section */}
            <div className={`border-t pt-6 sm:pt-12 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowChat(!showChat)}
                className={`w-full flex items-center justify-center gap-4 sm:gap-8 px-8 sm:px-16 py-6 sm:py-12 backdrop-blur-sm border-2 rounded-3xl sm:rounded-[2.5rem] transition-all duration-300 font-semibold tracking-wide text-xl sm:text-3xl shadow-xl ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/90' 
                    : 'bg-white/50 hover:bg-white/70 border-white/40 text-gray-800'
                }`}
                aria-expanded={showChat}
                aria-controls="chat-section"
              >
                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showChat ? 'Hide' : 'Ask'} AI Assistant
              </button>

              {showChat && (
                <div id="chat-section" className="mt-4 sm:mt-8 space-y-4 sm:space-y-8">
                  <form onSubmit={handleChatSubmit} className="space-y-4 sm:space-y-8">
                    <div>
                      <label htmlFor="chatQuery" className={`block text-sm sm:text-lg font-medium mb-3 sm:mb-6 tracking-wide ${
                        darkMode ? 'text-white/80' : 'text-gray-700'
                      }`}>
                        Your Question
                      </label>
                      <textarea
                        id="chatQuery"
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="What would you like to know about this investment?"
                        className={`w-full px-8 sm:px-16 py-6 sm:py-12 backdrop-blur-sm border-2 rounded-3xl sm:rounded-[2.5rem] outline-none transition-all duration-300 resize-none h-32 sm:h-48 font-light text-xl sm:text-2xl shadow-inner ${
                          darkMode 
                            ? 'bg-white/5 border-white/20 focus:bg-white/10 focus:border-white/40 text-white placeholder-white/40' 
                            : 'bg-white/50 border-gray-200/50 focus:bg-white/70 focus:border-gray-300/50 text-gray-800 placeholder-gray-400'
                        }`}
                        aria-describedby="chat-help"
                      />
                      <div id="chat-help" className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                        Ask about investment strategies, risks, or calculations
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!chatQuery.trim() || isChatLoading}
                      className={`w-full px-8 sm:px-16 py-6 sm:py-12 bg-gradient-to-r font-semibold rounded-3xl sm:rounded-[2.5rem] transition-all duration-300 disabled:cursor-not-allowed shadow-2xl backdrop-blur-sm text-xl sm:text-3xl ${
                        darkMode 
                          ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-white/10 disabled:to-white/5 text-white' 
                          : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white disabled:text-gray-500'
                      }`}
                      aria-describedby={isChatLoading ? "loading-status" : undefined}
                    >
                      {isChatLoading ? 'Thinking...' : 'Ask Assistant'}
                    </button>
                  </form>

                  {isChatLoading && (
                    <div className="text-center py-4 sm:py-8" id="loading-status" aria-live="polite">
                      <div className={`inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 ${
                        darkMode ? 'border-white/20 border-t-white/80' : 'border-gray-300 border-t-gray-700'
                      }`}></div>
                      <p className={`mt-2 text-sm ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        AI is thinking...
                      </p>
                    </div>
                  )}

                  {chatResponse && (
                    <div className={`backdrop-blur-sm border rounded-2xl sm:rounded-3xl p-4 sm:p-8 ${
                      darkMode 
                        ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' 
                        : 'bg-gradient-to-br from-green-100/80 to-emerald-100/80 border-green-200/50'
                    }`} role="region" aria-label="AI Response">
                      <h4 className={`font-light mb-3 sm:mb-6 flex items-center gap-2 sm:gap-4 tracking-wide text-sm sm:text-xl ${
                        darkMode ? 'text-white/90' : 'text-gray-800'
                      }`}>
                        <svg className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Insights
                      </h4>
                      <p className={`leading-relaxed whitespace-pre-wrap font-light text-sm sm:text-lg ${
                        darkMode ? 'text-white/80' : 'text-gray-700'
                      }`}>{chatResponse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-16 text-center">
            <p className={`text-xs sm:text-sm font-light tracking-widest uppercase ${
              darkMode ? 'text-white/40' : 'text-gray-500'
            }`}>
              Investment = Price × (Profit ÷ 0.01)
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`text-xs ${darkMode ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                aria-label="Scroll to top"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

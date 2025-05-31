import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Home from './components/Pages/Home'
import Vaults from './components/Pages/Vaults'
import Portfolio from './components/Pages/Portfolio'
import { useMockData } from './hooks/useMockData'
import './App.css'

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { navigationItems } = useMockData();

  const handleWalletConnect = () => {
    setIsWalletConnected(!isWalletConnected);
  };

  return (
    <Router>
      <div className="App">
        <Header 
          navigationItems={navigationItems}
          onWalletConnect={handleWalletConnect}
          isWalletConnected={isWalletConnected}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

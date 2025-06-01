import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Home from "./components/Pages/Home";
import Vaults from "./components/Pages/Vaults";
import VaultDetail from "./components/Pages/VaultDetail";
import Portfolio from "./components/Pages/Portfolio";
import { useMockData } from "./hooks/useMockData";
import "./App.css";

function App() {
  const { navigationItems } = useMockData();

  return (
    <Router>
      <div className="App">
        <Header navigationItems={navigationItems} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/vault/:vaultId" element={<VaultDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

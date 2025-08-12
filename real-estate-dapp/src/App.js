import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ethers, Contract, BrowserProvider } from 'ethers';

import realEstateContractData from './contracts/RealEstate.json';
import daoContractData from './contracts/DAO.json';

import Header from './components/Header';
import PropertyList from './components/PropertyList';
import MintProperty from './components/MintProperty';
import Portfolio from './components/Portfolio';
import History from './components/History';
import DaoDashboard from './components/DaoDashboard';
import MintingStatus from './components/MintingStatus';
import { PINATA_GATEWAY_URL } from './pinata-config';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [realEstateContract, setRealEstateContract] = useState(null);
  const [daoContract, setDaoContract] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [userPortfolio, setUserPortfolio] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return alert('Por favor, instala MetaMask.');
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const realEstateContractInstance = new Contract(realEstateContractData.address, realEstateContractData.abi, signer);
      const daoContractInstance = new Contract(daoContractData.address, daoContractData.abi, signer);

      setWalletAddress(address);
      setRealEstateContract(realEstateContractInstance);
      setDaoContract(daoContractInstance);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, []);

  const loadBlockchainData = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    try {
      const totalSupply = await realEstateContract.totalSupply();
      let properties = [];
      for (let i = 1; i <= totalSupply; i++) {
        try {
            const uri = await realEstateContract.tokenURI(i);
            const owner = await realEstateContract.ownerOf(i);
            const response = await fetch(`${PINATA_GATEWAY_URL}/${uri.split('//')[1]}`);
            const metadata = await response.json();

            properties.push({ 
                tokenId: i, 
                owner, 
                name: metadata.name, 
                description: metadata.description, 
                imageUrl: `${PINATA_GATEWAY_URL}/${metadata.image.split('//')[1]}`,
                location: metadata.attributes.find(a => a.trait_type === 'Location').value,
                price: metadata.attributes.find(a => a.trait_type === 'Price').value,
                fractions: metadata.attributes.find(a => a.trait_type === 'Fractions').value
            });
        } catch (e) {
            console.error(`Error al cargar el token ${i}:`, e);
        }
      }
      setAllProperties(properties);

      const portfolio = properties.filter(p => p.owner.toLowerCase() === walletAddress.toLowerCase());
      setUserPortfolio(portfolio);

    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  }, [realEstateContract, walletAddress]);

  const loadPurchaseHistory = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    try {
      const filter = realEstateContract.filters.FractionsPurchased(null, walletAddress);
      const events = await realEstateContract.queryFilter(filter);
      const history = events.map(event => ({
        tokenId: event.args.tokenId.toString(),
        fractions: event.args.count.toString(),
        cost: ethers.formatEther(event.args.totalCost),
      }));
      setPurchaseHistory(history);
    } catch (error) {
      console.error("Error loading purchase history:", error);
    }
  }, [realEstateContract, walletAddress]);

  useEffect(() => {
    if (realEstateContract && walletAddress) {
      loadBlockchainData();
      loadPurchaseHistory();
    }
  }, [realEstateContract, walletAddress, loadBlockchainData, loadPurchaseHistory]);

  const handleMintSubmit = async (tokenUri) => {
    if (!realEstateContract) return alert('Por favor, conecta tu billetera.');
    try {
        setTransactionStatus({ status: 'Minting...', message: 'Subiendo metadata a IPFS...' });
        const tx = await realEstateContract.safeMint(walletAddress, tokenUri);
        setTransactionStatus({ status: 'Mining...', message: `Transacción enviada. Hash: ${tx.hash}` });
        const receipt = await tx.wait();
        const tokenId = receipt.logs[0].args[2]; // El tokenId es el tercer argumento en el evento Transfer
        setTransactionStatus({ status: 'Success!', message: `Propiedad minteada con éxito. Token ID: ${tokenId.toString()}` });
        loadBlockchainData();
        setTimeout(() => setTransactionStatus(null), 3000);
    } catch (error) {
      console.error('Error al mintear la propiedad:', error);
      setTransactionStatus({ status: 'Error', message: 'Error al mintear la propiedad.' });
    }
  };

  // ... el resto de los handlers ...

  const AppContent = () => {
    const navigate = useNavigate();
    return (
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header 
          connectWallet={connectWallet} 
          walletAddress={walletAddress}
          onNavigate={navigate}
        />
        <main className="container mx-auto p-8">
          <Routes>
            <Route path="/" element={<PropertyList properties={allProperties} />} />
            <Route path="/mint" element={<MintProperty onMint={handleMintSubmit} />} />
            <Route path="/portfolio" element={<Portfolio properties={userPortfolio} />} />
            <Route path="/history" element={<History history={purchaseHistory} />} />
            <Route path="/dao" element={<DaoDashboard daoContract={daoContract} walletAddress={walletAddress} />} />
          </Routes>
          {transactionStatus && <MintingStatus status={transactionStatus} />}
        </main>
      </div>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

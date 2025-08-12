import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ethers, parseEther, toBigInt } from 'ethers';
import RealEstate from './contracts/RealEstate.json';
import PropertyList from './components/PropertyList';
import PropertyDetail from './components/PropertyDetail';
import MintProperty from './components/MintProperty';
import TransactionStatus from './components/TransactionStatus';
import './index.css';

const getAttribute = (attributes, traitType) => {
  const attr = attributes?.find(a => a.trait_type === traitType);
  return attr ? attr.value : null;
};

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [realEstateContract, setRealEstateContract] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [discoverProperties, setDiscoverProperties] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState({ status: '', message: '' });
  const [provider, setProvider] = useState(null);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        const accounts = await newProvider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);
        const signer = await newProvider.getSigner();
        const contract = new ethers.Contract(RealEstate.address, RealEstate.abi, signer);
        setRealEstateContract(contract);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        setTransactionStatus({ status: 'error', message: 'Error al conectar la billetera.' });
      }
    } else {
      setTransactionStatus({ status: 'error', message: 'MetaMask no está instalado.' });
    }
  }, []);

  const loadBlockchainData = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    try {
      const totalSupply = await realEstateContract.totalSupply();
      const tokenIds = Array.from({ length: Number(totalSupply) }, (_, i) => i + 1);
      
      const properties = await Promise.all(tokenIds.map(async (id) => {
        try {
          const tokenUri = await realEstateContract.tokenURI(id);
          const owner = await realEstateContract.ownerOf(id);
          const gatewayUrl = process.env.REACT_APP_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
          const response = await fetch(tokenUri.replace('ipfs://', gatewayUrl));
          if (!response.ok) return null;
          const metadata = await response.json();
          
          return {
            tokenId: toBigInt(id),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image.replace('ipfs://', gatewayUrl),
            owner: owner,
            attributes: metadata.attributes || []
          };
        } catch (error) {
          console.error(`Error al cargar el token ${id}:`, error);
          return null;
        }
      }));

      const validProperties = properties.filter(p => p !== null);
      setAllProperties(validProperties);
      setMyProperties(validProperties.filter(p => p.owner.toLowerCase() === walletAddress.toLowerCase()));
      setDiscoverProperties(validProperties.filter(p => p.owner.toLowerCase() !== walletAddress.toLowerCase()));
    } catch (error) {
      console.error("Error al cargar los datos de la blockchain:", error);
    }
  }, [realEstateContract, walletAddress]);

  useEffect(() => {
    connectWallet();
  }, [connectWallet]);

  useEffect(() => {
    if (realEstateContract && walletAddress) {
      loadBlockchainData();
    }
  }, [realEstateContract, walletAddress, loadBlockchainData]);

  const handleMint = async (tokenUri) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Enviando transacción de minteo...' });
      const transaction = await realEstateContract.safeMint(walletAddress, tokenUri);
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡Propiedad minteada con éxito!' });
      loadBlockchainData();
    } catch (error) {
      console.error("Error en handleMint:", error);
      setTransactionStatus({ status: 'error', message: `Error en la transacción: ${error.message}` });
    }
  };

  const handlePurchaseFractions = async (tokenId, fractionsToBuy) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Procesando la compra...' });
      const property = allProperties.find(p => p.tokenId.toString() === tokenId.toString());
      if (!property) throw new Error('Propiedad no encontrada.');
      
      const priceEth = getAttribute(property.attributes, 'Price (ETH)');
      const totalFractions = getAttribute(property.attributes, 'Fractions');
      if (!priceEth || !totalFractions) throw new Error('Metadatos de precio o fracciones inválidos.');

      const priceInWei = parseEther(priceEth);
      const fractionsToBuyBigInt = toBigInt(fractionsToBuy);
      const totalFractionsBigInt = toBigInt(Number(totalFractions));

      const amountInWei = (priceInWei * fractionsToBuyBigInt) / totalFractionsBigInt;

      const transaction = await realEstateContract.purchaseFractions(tokenId, fractionsToBuy, { value: amountInWei });
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡Fracciones compradas con éxito!' });
      loadBlockchainData();
    } catch (error) {
      console.error("Error al comprar fracciones:", error);
      setTransactionStatus({ status: 'error', message: `Error en la compra: ${error.reason || error.message}` });
    }
  };
  
  const handleListForRent = async (tokenId, pricePerDay) => {
    if (!realEstateContract) return;
    try {
        const priceInWei = parseEther(pricePerDay.toString());
        const transaction = await realEstateContract.listForRent(tokenId, priceInWei);
        await transaction.wait();
        loadBlockchainData();
    } catch (error) {
        console.error("Error al listar para alquilar:", error);
    }
  };

  const handleRentProperty = async (tokenId, durationInDays) => {
      if (!realEstateContract) return;
      try {
          const rentalInfo = await realEstateContract.rentalInfo(tokenId);
          const pricePerDay = rentalInfo.pricePerDay;
          const totalCostWei = pricePerDay * toBigInt(durationInDays);
          const transaction = await realEstateContract.rentProperty(tokenId, durationInDays, { value: totalCostWei });
          await transaction.wait();
          loadBlockchainData();
      } catch (error) {
          console.error("Error al alquilar la propiedad:", error);
      }
  };

  const handleWithdrawRent = async (tokenId) => {
      if (!realEstateContract) return;
      try {
          const transaction = await realEstateContract.withdrawRent(tokenId);
          await transaction.wait();
          loadBlockchainData();
      } catch (error) {
          console.error("Error al retirar la renta:", error);
      }
  };

  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <Link to="/" className="text-2xl font-bold text-blue-600">Realichain</Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link to="/discover" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Descubrir</Link>
                  <Link to="/mint" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Mintear</Link>
                  <Link to="/portfolio" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Mi Portafolio</Link>
                </div>
              </div>
              <div className="ml-4 md:ml-6">
                <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                  {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Conectar Wallet'}
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <TransactionStatus status={transactionStatus.status} message={transactionStatus.message} />
          <Routes>
            <Route path="/" element={<PropertyList title="Todas las Propiedades" properties={allProperties} getAttribute={getAttribute} />} />
            <Route path="/discover" element={<PropertyList title="Descubrir Propiedades" properties={discoverProperties} getAttribute={getAttribute} />} />
            <Route path="/portfolio" element={<PropertyList title="Mi Portafolio" properties={myProperties} getAttribute={getAttribute} />} />
            <Route path="/mint" element={<MintProperty onMint={handleMint} setTransactionStatus={setTransactionStatus} />} />
            <Route path="/property/:id" element={
              <PropertyDetail 
                properties={allProperties} 
                onPurchase={handlePurchaseFractions} 
                walletAddress={walletAddress}
                contract={realEstateContract}
                onListForRent={handleListForRent}
                onRent={handleRentProperty}
                onWithdrawRent={handleWithdrawRent}
                getAttribute={getAttribute}
              />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
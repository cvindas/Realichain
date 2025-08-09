import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ethers, BrowserProvider, Contract } from 'ethers';

import Header from './components/Header';
import Filters from './components/Filters';
import PropertyCard from './components/PropertyCard';
import PropertyDetail from './components/PropertyDetail';
import TransactionStatus from './components/TransactionStatus';
import MintProperty from './components/MintProperty';
import Portfolio from './components/Portfolio';
import DaoCard from './components/DaoCard';
import History from './components/History';

import realEstateAbi from './contracts/RealEstate.json';
import daoAbi from './contracts/DAO.json';
import { PINATA_GATEWAY } from './pinata-config';
import './index.css';

const contractAddresses = {
  realEstate: '0x7969c5eD335650692Bc04293B07F5BF2e7A673C0',
  dao: '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575'
};

function App() {
  const [realEstateContract, setRealEstateContract] = useState(null);
  const [daoContract, setDaoContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [currentView, setCurrentView] = useState('discover');
  const [portfolio, setPortfolio] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const navigateToView = (view) => {
    setCurrentView(view);
    setSelectedProperty(null); 
  };

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return alert('Por favor, instala MetaMask.');
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const realEstateContractInstance = new Contract(contractAddresses.realEstate, realEstateAbi, signer);
      const daoContractInstance = new Contract(contractAddresses.dao, daoAbi, signer);

      setWalletAddress(address);
      setRealEstateContract(realEstateContractInstance);
      setDaoContract(daoContractInstance);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new BrowserProvider(window.ethereum);

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setRealEstateContract(null);
        setDaoContract(null);
      } else {
        connectWallet(); // Reconectar con la nueva cuenta
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // Comprobar si ya hay una conexión autorizada al cargar la página
    const checkExistingConnection = async () => {
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        connectWallet();
      }
    };

    checkExistingConnection();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet]);

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const loadBlockchainData = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    setLoading(true);
    try {
      const allFetchedProperties = [];
      const userPortfolio = [];

      const items = [];
      const totalSupply = await realEstateContract.totalSupply();

      for (let i = 0; i < totalSupply; i++) {
        const tokenId = await realEstateContract.tokenByIndex(i);
        const promise = (async () => {
          try {
            const tokenUri = await realEstateContract.tokenURI(tokenId);
            if (!tokenUri) throw new Error(`Token URI para el token ${tokenId} no encontrado.`);

            const metadataUrl = tokenUri.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`);
            
            const response = await fetch(metadataUrl);
            if (!response.ok) {
              throw new Error(`Error al obtener metadatos de ${metadataUrl}`);
            }
            const meta = await response.json();

            const owner = await realEstateContract.ownerOf(tokenId);

            const propertyData = {
              tokenId: tokenId,
              id: tokenId.toString(),
              price: meta.price,
              name: meta.name,
              city: meta.city,
              propertyType: meta.propertyType,
              image: meta.image,
              description: meta.description,
              fractions: 0,
              fractionsAvailable: 1000,
            };

            allFetchedProperties.push(propertyData);
          } catch (error) {
            console.error(`Error procesando el token ${tokenId}:`, error);
            return null;
          }
        })();
        items.push(promise);
      }

      await Promise.all(items);

      // Filtrar las propiedades: las que son del usuario van al portafolio,
      // las que no, a la lista de propiedades en venta.
      const validProperties = allFetchedProperties.filter(p => p != null);
      const availableProperties = [];

      for (const property of validProperties) {
          const owner = await realEstateContract.ownerOf(property.tokenId);
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              userPortfolio.push(property);
          } else {
              availableProperties.push(property);
          }
      }

      setAllProperties(availableProperties);
      setFilteredProperties(availableProperties);
      setPortfolio(userPortfolio);

    } catch (error) {
      console.error("Error loading data from blockchain:", error);
    } finally {
      setLoading(false);
    }
  }, [realEstateContract, walletAddress]);

  const loadPurchaseHistory = async () => {
    if (!realEstateContract) return;
    try {
      const filter = realEstateContract.filters.FractionsPurchased();
      const events = await realEstateContract.queryFilter(filter);
      
      const historyData = events.map(event => ({
        tokenId: event.args.tokenId.toString(),
        buyer: event.args.buyer,
        count: event.args.count.toString(),
        totalCost: ethers.formatEther(event.args.totalCost)
      })).reverse(); // Mostrar las más recientes primero

      setPurchaseHistory(historyData);
    } catch (error) {
      console.error("Error loading purchase history:", error);
    }
  };

  useEffect(() => {
    if (realEstateContract) {
      loadBlockchainData();
      loadPurchaseHistory();
    }
  }, [realEstateContract, walletAddress, loadBlockchainData]);

  const handleSearch = (filters) => {
    let filtered = allProperties.filter(prop => {
      const priceAsNumber = parseInt(String(prop.price).replace(/\$|,/g, ''));
      const filterPrice = parseInt(filters.price);

      // Helper to remove accents and convert to lower case for robust comparison
      const normalizeText = (text) => 
        text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

      const normalizedPropCity = normalizeText(prop.city);
      const normalizedFilterLocation = normalizeText(filters.location);

      // Check if the city in the property data is included in the filter text
      const locationMatch = !filters.location || normalizedPropCity === normalizedFilterLocation;
      const typeMatch = !filters.propertyType || prop.type === filters.propertyType;
      const priceMatch = !filters.price || (priceAsNumber && priceAsNumber <= filterPrice);

      if (prop.type === 'Renta Vacacional' && filters.price) {
        return false;
      }
      return locationMatch && typeMatch && priceMatch;
    });
    setFilteredProperties(filtered);
  };

  const handleSelectProperty = (property) => {
    setSelectedProperty(property);
  };

  const handleBackToList = () => {
    setSelectedProperty(null);
  };

  const handleOfferSubmitted = async (offerDetails) => {
    if (!realEstateContract) return alert('Por favor, conecta tu wallet primero.');
    try {
        const { property, offerAmount } = offerDetails;
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            return alert('Por favor, ingresa un monto de oferta válido.');
        }
        // Se asume una tasa de conversión fija. Para un entorno de producción, se debería usar un oráculo de precios.
        const USD_TO_ETH_RATE = 3000; // 1 ETH = 3000 USD
        const offerInEth = parseFloat(offerAmount) / USD_TO_ETH_RATE;
        const offerInWei = ethers.parseEther(offerInEth.toString());
        setActiveTransaction({ property, status: 'Enviando oferta a MetaMask...' });
        const tx = await realEstateContract.makeOffer(property.tokenId, { value: offerInWei });
        setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));
        await tx.wait();
        setActiveTransaction(prev => ({ ...prev, status: '¡Oferta realizada con éxito!' }));
        setTimeout(() => {
            setActiveTransaction(null);
            setSelectedProperty(null);
        }, 3000);
    } catch (error) {
        console.error("Error submitting offer:", error);
        const errorMessage = error.reason || 'La transacción fue rechazada o falló.';
        setActiveTransaction({ property: offerDetails.property, status: 'Error en la transacción', message: errorMessage });
    }
  };

  const handleInvest = async (property, fractions) => {
    if (!realEstateContract) return alert('Por favor, conecta tu wallet primero.');
    const numFractions = parseInt(fractions, 10);
    if (!numFractions || numFractions <= 0) {
        return alert('Por favor, ingresa un número válido de fracciones.');
    }
    try {
        const pricePerFractionInWei = await realEstateContract.fractionPriceInWei();
        const totalCostInWei = window.BigInt(pricePerFractionInWei) * window.BigInt(numFractions);

        setActiveTransaction({ property, fractions: numFractions, status: 'Enviando inversión a MetaMask...' });

        const tx = await realEstateContract.purchaseFractions(property.tokenId, numFractions, { value: totalCostInWei });

        setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            await loadBlockchainData(); // Recargar datos para reflejar la compra
        }

        setActiveTransaction(prev => ({ ...prev, status: '¡Inversión realizada con éxito!' }));

        setTimeout(() => {
            setActiveTransaction(null);
            setSelectedProperty(null);
            setCurrentView('portfolio');
        }, 3000);
    } catch (error) {
        console.error("Error investing:", error);
        const errorMessage = error.reason || 'La transacción fue rechazada o falló.';
        setActiveTransaction({ property, status: 'Error en la transacción', message: errorMessage });
    }
  };

  const handleMint = async (metadataUri, navigate) => {
    if (!realEstateContract || !walletAddress) return alert('Por favor, conecta tu wallet primero.');
    try {
      setActiveTransaction({ property: { type: 'Minting' }, status: 'Enviando transacción a MetaMask...' });
      const tx = await realEstateContract.safeMint(walletAddress, metadataUri);
      setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));
      await tx.wait();
      setActiveTransaction(prev => ({ ...prev, status: '¡Propiedad minteada con éxito!' }));
      await loadBlockchainData();
      setTimeout(() => {
        setActiveTransaction(null);
        navigate('/'); // Navegar de vuelta a la página principal
        navigateToView('portfolio'); // Establecer la vista de portafolio
      }, 3000);
    } catch (error) {
      console.error("Error minting property:", error);
      setActiveTransaction({ property: { type: 'Error' }, status: `Error: ${error.reason || error.message}` });
      setTimeout(() => setActiveTransaction(null), 5000);
    }
  };

  const handleCloseTransaction = () => {
    setActiveTransaction(null);
  };

  const MainContent = () => {
    if (selectedProperty) {
      return <PropertyDetail 
                property={selectedProperty} 
                contract={realEstateContract} 
                onBack={handleBackToList} 
                onOfferSubmit={handleOfferSubmitted} 
                onInvest={handleInvest} 
             />;
    }

    return (
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Columna Izquierda */}
        <div className="w-full lg:w-2/3">
          <div className="w-full">
            <Filters onSearch={handleSearch} />
          </div>
          <div className="w-full mt-8">
            {currentView === 'discover' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Descubre propiedades</h2>
                {loading ? (
                  <p className="text-center text-xl">Cargando propiedades...</p>
                ) : (
                  filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredProperties.map(property => (
                        <PropertyCard key={property.tokenId} property={property} onSelect={handleSelectProperty} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 mt-8">No hay propiedades disponibles en este momento.</p>
                  )
                )}
              </div>
            )}
            {currentView === 'portfolio' && (
              <Portfolio 
                  portfolio={portfolio} 
                  onSelect={handleSelectProperty} 
              />
            )}
            {currentView === 'history' && (
              <History history={purchaseHistory} properties={allProperties} />
            )}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="hidden lg:block lg:w-1/3">
          <DaoCard daoContract={daoContract} realEstateContract={realEstateContract} walletAddress={walletAddress} />
        </div>
      </div>
    );
  };

  const MintPropertyWithRouter = () => {
    const navigate = useNavigate();
    return <MintProperty contract={realEstateContract} onMint={(metadataUri) => handleMint(metadataUri, navigate)} />;
  };

  return (
    <Router>
      <div className="bg-slate-100 text-gray-900 min-h-screen font-sans">
        <Header 
          walletAddress={walletAddress} 
          onConnect={connectWallet} 
          currentView={currentView}
          onNavigate={navigateToView} 
        />
        <main className="container mx-auto p-8">
          <Routes>
            <Route path="/mint" element={<MintPropertyWithRouter />} />
            <Route path="/" element={<MainContent />} />
          </Routes>
        </main>
        {activeTransaction && (
          <TransactionStatus 
            transaction={activeTransaction} 
            onClose={handleCloseTransaction} 
          />
        )}
      </div>
    </Router>
  );
}

export default App;

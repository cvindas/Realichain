import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ethers, BrowserProvider, Contract } from 'ethers';
import contractConfig from './contract-address.json';
import contractArtifact from './RealEstate.json';
import Header from './components/Header';
import Filters from './components/Filters';
import PropertyCard from './components/PropertyCard';
import PropertyDetail from './components/PropertyDetail';
import TransactionStatus from './components/TransactionStatus';
import MintProperty from './components/MintProperty';
import Portfolio from './components/Portfolio';

function App() {
  const [contract, setContract] = useState(null);
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

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setContract(null);
        setAllProperties([]);
        setFilteredProperties([]);
      } else {
        setWalletAddress(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    const checkAndSwitchNetwork = async () => {
      const HARDHAT_CHAIN_ID = '0x7a69';
      try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== HARDHAT_CHAIN_ID) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID }],
          });
        }
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: HARDHAT_CHAIN_ID,
                  chainName: 'Hardhat Localhost',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: { name: 'GoerliETH', symbol: 'gETH', decimals: 18 },
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add the Hardhat network:', addError);
          }
        }
      }
    };

    const connectOnLoad = async () => {
      if (window.connectionAttempted) return;
      window.connectionAttempted = true;
      try {
        await checkAndSwitchNetwork();
        const newProvider = new BrowserProvider(window.ethereum);

        let accounts = await newProvider.send('eth_accounts', []);

        if (accounts.length === 0) {
          accounts = await newProvider.send('eth_requestAccounts', []);
        }

        if (accounts.length > 0) {
          const signer = await newProvider.getSigner();
          const address = await signer.getAddress();
          const newContract = new Contract(contractConfig.address, contractArtifact.abi, signer);
          setWalletAddress(address);
          setContract(newContract);
        }
      } catch (error) {
        if (error.code !== -32002) {
          console.error("Error connecting to MetaMask on load:", error);
        }
      }
    };

    connectOnLoad();

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const loadBlockchainData = useCallback(async () => {
    if (!contract || !walletAddress) return;
    setLoading(true);
    try {
      const totalSupply = await contract.totalSupply();
      const properties = [];
      const userPortfolio = [];


      const totalSupplyNumber = Number(totalSupply);
      for (let i = 0; i < totalSupplyNumber; i++) {
        const tokenId = await contract.tokenByIndex(i);
        const uri = await contract.tokenURI(tokenId);
        
        // Use the dedicated Infura gateway for reliability. Replace 'YOUR_INFURA_PROJECT_ID' with your actual ID.
        // Note: For a production app, this ID should come from an environment variable.
        try {
          const gatewayUrl = 'https://gateway.pinata.cloud'; // Using Pinata's public gateway
          const ipfsUrl = `${gatewayUrl}/ipfs/${uri}`;
          const response = await fetch(ipfsUrl);

          if (response.ok) {
            const metadata = await response.json();
            const propertyData = {
              tokenId: Number(tokenId),
              ipfsHash: uri,
              ...metadata
            };
            properties.push(propertyData);

            const userFractionBalance = await contract.getFractionsOwned(tokenId, walletAddress);
            if (userFractionBalance > 0) {
              userPortfolio.push({
                ...propertyData,
                fractionsOwned: userFractionBalance.toString(),
              });
            }


          } else {
            console.warn(`Could not fetch metadata for token ${tokenId}. Status: ${response.status}`);
          }
        } catch (e) {
          console.error(`Error processing token ${tokenId}:`, e);
        }
        await delay(200); // Add a small delay to avoid rate-limiting
      }
      
      setAllProperties(properties);
      setFilteredProperties(properties); // FIX: Mostrar todas las propiedades al cargar
      setPortfolio(userPortfolio);

      const purchaseFilter = contract.filters.FractionsPurchased(null, walletAddress);
      const purchaseEvents = await contract.queryFilter(purchaseFilter);
      const history = purchaseEvents.map(event => ({
        tokenId: event.args.tokenId.toString(),
        fractions: event.args.count.toString(),
        cost: ethers.formatEther(event.args.totalCost),
        txHash: event.transactionHash,
      }));
      setPurchaseHistory(history);

    } catch (error) {
      console.error("Error loading data from blockchain:", error);
    } finally {
      setLoading(false);
    }
  }, [contract, walletAddress]);

  useEffect(() => {
    if (contract && walletAddress) {
      loadBlockchainData();
    }
  }, [contract, walletAddress, loadBlockchainData]);

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
    if (!contract) return alert('Por favor, conecta tu wallet primero.');
    try {
        const { property, offerAmount } = offerDetails;
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            return alert('Por favor, ingresa un monto de oferta válido.');
        }
        const offerInEth = parseFloat(offerAmount) * 0.0003;
        const offerInWei = ethers.parseEther(offerInEth.toFixed(18).toString());
        setActiveTransaction({ property, status: 'Enviando oferta a MetaMask...' });
        const tx = await contract.makeOffer(property.tokenId, { value: offerInWei });
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
    if (!contract) return alert('Por favor, conecta tu wallet primero.');
    const numFractions = parseInt(fractions, 10);
    if (!numFractions || numFractions <= 0) {
        return alert('Por favor, ingresa un número válido de fracciones.');
    }
    try {
        const pricePerFractionInWei = await contract.fractionPriceInWei();
                const totalCostInWei = window.BigInt(pricePerFractionInWei) * window.BigInt(numFractions);
        setActiveTransaction({ property, fractions: numFractions, status: 'Enviando inversión a MetaMask...' });
        const tx = await contract.purchaseFractions(property.tokenId, numFractions, { value: totalCostInWei });
        setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            await loadBlockchainData();
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
    if (!contract || !walletAddress) return alert('Por favor, conecta tu wallet primero.');
    try {
      setActiveTransaction({ property: { type: 'Minting' }, status: 'Enviando transacción a MetaMask...' });
      const tx = await contract.safeMint(walletAddress, metadataUri);
      setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));
      await tx.wait();
      setActiveTransaction(prev => ({ ...prev, status: '¡Propiedad minteada con éxito!' }));
      await loadBlockchainData();
      setTimeout(() => {
        setActiveTransaction(null);
        navigate('/');
      }, 5000);
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
                contract={contract} 
                onBack={handleBackToList} 
                onOfferSubmit={handleOfferSubmitted} 
                onInvest={handleInvest} 
             />;
    }

    return (
      <>
        <div className="w-full">
          <Filters onSearch={handleSearch} />
        </div>
        <div className="w-full">
          {currentView === 'discover' && (
            <div>
              <h2 className="text-4xl font-bold mb-8">Descubre propiedades</h2>
              {loading ? <p className="text-center text-xl">Cargando propiedades...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProperties.map(property => (
                    <PropertyCard key={property.tokenId} property={property} onSelect={handleSelectProperty} />
                  ))}
                </div>
              )}
            </div>
          )}
          {currentView === 'portfolio' && (
            <Portfolio properties={portfolio} purchaseHistory={purchaseHistory} />
          )}
        </div>
      </>
    );
  };

  const MintPropertyWithRouter = () => {
    const navigate = useNavigate();
    return <MintProperty contract={contract} onMint={(metadataUri) => handleMint(metadataUri, navigate)} />;
  };

  return (
    <Router>
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <Header walletAddress={walletAddress} onNavigate={navigateToView} />
        <main className="container mx-auto p-12 flex flex-col gap-12 max-w-7xl">
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

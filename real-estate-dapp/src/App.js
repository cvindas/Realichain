import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import contractConfig from './contract-address.json';
import contractArtifact from './RealEstate.json';
import Header from './components/Header';
import Filters from './components/Filters';
import PropertyCard from './components/PropertyCard';
import DaoPanel from './components/DaoPanel';
import PropertyDetail from './components/PropertyDetail';
import TransactionStatus from './components/TransactionStatus';




// Simulación de metadatos que se obtendrían de IPFS
const propertyMetadata = {
  'Qm...a1b2': {
    price: '$350,000',
    type: 'Casa de Montaña',
    city: 'La Fortuna',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
  },
  'Qm...c3d4': {
    price: '$850,000',
    type: 'Villa de Lujo',
    city: 'Tamarindo',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
  },
  'Qm...e5f6': {
    price: '$275,000',
    type: 'Apartamento',
    city: 'San José',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  },
  'Qm...g7h8': {
    price: '$4,000/mes',
    type: 'Renta Vacacional',
    city: 'Manuel Antonio',
    image: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
  }
};

function App() {
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [allProperties, setAllProperties] = useState([]); // Almacenará todas las propiedades
  const [filteredProperties, setFilteredProperties] = useState([]); // Para mostrar en la UI
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [currentView, setCurrentView] = useState('discover'); // 'discover' or 'portfolio'
  const [portfolio, setPortfolio] = useState([]);
  const [userOffers, setUserOffers] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

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
      const HARDHAT_CHAIN_ID = '0x7a69'; // 31337 en hexadecimal
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

        // Primero, intentar obtener cuentas existentes sin abrir MetaMask
        let accounts = await newProvider.send('eth_accounts', []);

        // Si no hay cuentas conectadas, solicitar conexión
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

  const loadBlockchainData = useCallback(async () => {
    if (!contract || !walletAddress) return;
    setLoading(true);
    try {
      console.log('Fetching properties and portfolio from blockchain...');
      const totalSupply = await contract.totalSupply();
      const properties = [];
      const userPortfolio = [];
      const userOffersData = [];

      const totalSupplyNumber = Number(totalSupply);
      for (let i = 0; i < totalSupplyNumber; i++) {
        const tokenId = await contract.tokenByIndex(i);
        const uri = await contract.tokenURI(tokenId);
        const metadata = propertyMetadata[uri]; // Simulación de fetch a IPFS
        
        if (metadata) {
          const propertyData = {
            tokenId: Number(tokenId),
            ipfsHash: uri,
            ...metadata
          };
          properties.push(propertyData);

          // Comprobar si el usuario es dueño de fracciones de esta propiedad
          const userFractionBalance = await contract.getFractionsOwned(tokenId, walletAddress);
          if (userFractionBalance > 0) {
            userPortfolio.push({
              ...propertyData,
              fractionsOwned: userFractionBalance.toString(),
            });
          }

          // Comprobar si el usuario tiene la oferta más alta
          const offer = await contract.highestOffer(tokenId);
          if (offer.offerer.toLowerCase() === walletAddress.toLowerCase() && offer.isActive) {
            userOffersData.push({
              ...propertyData,
              offerAmount: ethers.formatEther(offer.amount),
            });
          }
        }
      }
      
      console.log(`Found ${properties.length} total properties.`);
      console.log(`Found ${userPortfolio.length} properties in portfolio.`);
      setAllProperties(properties);
      setFilteredProperties(properties);
      setPortfolio(userPortfolio);
      setUserOffers(userOffersData); // Establecer el estado del portafolio

      // Cargar historial de compras
      const purchaseFilter = contract.filters.FractionsPurchased(null, walletAddress);
      const purchaseEvents = await contract.queryFilter(purchaseFilter);
      const history = purchaseEvents.map(event => ({
        tokenId: event.args.tokenId.toString(),
        fractions: event.args.count.toString(),
        cost: ethers.formatEther(event.args.totalCost),
        txHash: event.transactionHash,
      }));
      setPurchaseHistory(history); // Establecer el estado del portafolio

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
      const priceAsNumber = parseInt(prop.price.replace(/\$|,/g, ''));
      const filterPrice = parseInt(filters.price);

      const locationMatch = !filters.location || prop.city === filters.location;
      const typeMatch = !filters.propertyType || prop.type === filters.propertyType;
      const priceMatch = !filters.price || (priceAsNumber && priceAsNumber <= filterPrice);

      // Excluir propiedades de renta del filtro de precio de compra
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
    if (!contract) { return alert('Por favor, conecta tu wallet primero.'); }

    try {
        const { property, offerAmount } = offerDetails;
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            return alert('Por favor, ingresa un monto de oferta válido.');
        }
        
        // Placeholder conversion: 1 USD = 0.0003 ETH. Adjust as needed.
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

  const navigate = (view) => {
    setCurrentView(view);
    setActiveTransaction(null);
  };

  const handleUpdateTransactionStatus = (newStatus) => {
    setActiveTransaction(prev => ({ ...prev, status: newStatus }));
  };

  const handleCloseTransaction = () => {
    setActiveTransaction(null);
  };

  const handleInvest = async (property, fractions) => {
    if (!contract) { return alert('Por favor, conecta tu wallet primero.'); }

    const numFractions = parseInt(fractions, 10);
    if (!numFractions || numFractions <= 0) {
        return alert('Por favor, ingresa un número válido de fracciones.');
    }

    try {
        const pricePerFractionInWei = await contract.fractionPriceInWei();
        const totalCostInWei = window.BigInt(pricePerFractionInWei) * window.BigInt(numFractions);

        setActiveTransaction({
            property,
            fractions: numFractions,
            status: 'Enviando inversión a MetaMask...'
        });

        const tx = await contract.purchaseFractions(property.tokenId, numFractions, {
            value: totalCostInWei
        });

        setActiveTransaction(prev => ({ ...prev, status: 'Procesando transacción...' }));

        const receipt = await tx.wait();

        // Forzar la recarga de datos después de que la transacción se haya minado
        if (receipt.status === 1) {
            console.log('Transaction successful, reloading blockchain data...');
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

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header className="w-full" walletAddress={walletAddress} onNavigate={navigate} />

      <main className="container mx-auto p-12 flex flex-col gap-12 max-w-7xl">
        
        <div className="w-full">
          <Filters onSearch={handleSearch} />
        </div>

        <div className="w-full">
          {currentView === 'portfolio' ? (
            <div>
                  <h2 className="text-4xl font-bold mb-8">Mis Inversiones</h2>
                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {portfolio.map(property => (
                        <PropertyCard key={`investment-${property.tokenId}`} property={property} onSelect={handleSelectProperty} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No tienes inversiones activas.</p>
                  )}

                  <h2 className="text-4xl font-bold mt-12 mb-8">Mis Ofertas</h2>
                  {userOffers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {userOffers.map(property => (
                        <PropertyCard key={`offer-${property.tokenId}`} property={property} onSelect={handleSelectProperty} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No tienes ofertas activas.</p>
                  )}

                  <h2 className="text-4xl font-bold mt-12 mb-8">Historial de Compras</h2>
                  {purchaseHistory.length > 0 ? (
                    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                      <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                          <tr>
                            <th scope="col" className="py-3 px-6">ID Propiedad</th>
                            <th scope="col" className="py-3 px-6">Fracciones Compradas</th>
                            <th scope="col" className="py-3 px-6">Costo (ETH)</th>
                            <th scope="col" className="py-3 px-6">Transacción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseHistory.map((item, index) => (
                            <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                              <td className="py-4 px-6">{item.tokenId}</td>
                              <td className="py-4 px-6">{item.fractions}</td>
                              <td className="py-4 px-6">{item.cost}</td>
                              <td className="py-4 px-6">
                                <a 
                                  href={`https://etherscan.io/tx/${item.txHash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-500 hover:underline"
                                >
                                  Ver en Etherscan
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400">No tienes compras registradas.</p>
                  )}
                </div>
          ) : activeTransaction ? (
            <TransactionStatus transaction={activeTransaction} onUpdateStatus={handleUpdateTransactionStatus} onClose={handleCloseTransaction} />
          ) : selectedProperty ? (
            <PropertyDetail property={selectedProperty} onBack={handleBackToList} onOfferSubmit={handleOfferSubmitted} onInvest={handleInvest} />
          ) : loading ? (
            <p className="text-center text-xl">Cargando propiedades desde la blockchain...</p>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-8">Descubre propiedades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map(property => (
                  <PropertyCard key={property.tokenId} property={property} onSelect={handleSelectProperty} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full">
          <DaoPanel />
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';
import Header from './components/Header';
import Filters from './components/Filters';
import PropertyCard from './components/PropertyCard';
import DaoPanel from './components/DaoPanel';
import PropertyDetail from './components/PropertyDetail';
import TransactionStatus from './components/TransactionStatus';
import Portfolio from './components/Portfolio';

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
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [allProperties, setAllProperties] = useState([]); // Almacenará todas las propiedades
  const [filteredProperties, setFilteredProperties] = useState([]); // Para mostrar en la UI
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [currentView, setCurrentView] = useState('discover'); // 'discover' or 'portfolio'
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    if (walletAddress) {
      loadBlockchainData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (window.ethereum) {
      // Detecta si el usuario cambia de cuenta en MetaMask
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
          setFilteredProperties([]); // Limpiar propiedades si se desconecta
          setAllProperties([]);
        }
      });

      // Detecta si el usuario cambia de red
      window.ethereum.on('chainChanged', (_chainId) => {
        // Simplemente recarga la página para forzar una reconexión y chequeo de red
        window.location.reload();
      });
    }

    // Cleanup listeners al desmontar el componente
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Primero, nos aseguramos de que el usuario esté en la red correcta
        await checkAndSwitchNetwork();

        // Luego, solicitamos la cuenta
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        alert("Hubo un error al conectar con MetaMask. Por favor, asegúrate de haber aceptado la solicitud.");
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert('MetaMask no está instalado. Por favor, instálalo para usar esta DApp.');
    }
  };

  const checkAndSwitchNetwork = async () => {
    const HARDHAT_CHAIN_ID = '0x7a69'; // 31337 en hexadecimal
    if (window.ethereum) {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChainId !== HARDHAT_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID }],
          });
        } catch (switchError) {
          // Este error (4902) significa que la red no ha sido agregada a MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: HARDHAT_CHAIN_ID,
                    chainName: 'Hardhat Localhost',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                      name: 'GoerliETH',
                      symbol: 'gETH',
                      decimals: 18,
                    },
                  },
                ],
              });
            } catch (addError) {
              console.error('Failed to add the Hardhat network:', addError);
              throw addError;
            }
          } else {
            throw switchError;
          }
        }
      }
    }
  };

  const loadBlockchainData = async () => {
    setLoading(true);
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      setProvider(provider);
      setContract(contract);

      try {
        console.log('Fetching properties from blockchain...');
        const totalSupply = await contract.totalSupply();
        const properties = [];

        for (let i = 0; i < totalSupply; i++) {
          const uri = await contract.tokenURI(i);
          const metadata = propertyMetadata[uri]; // Simulación de fetch a IPFS
          if (metadata) {
            properties.push({
              tokenId: i,
              ipfsHash: uri,
              ...metadata
            });
          }
        }
        
        console.log(`Found ${properties.length} properties.`);
        setAllProperties(properties);
        setFilteredProperties(properties);
        setLoading(false);

      } catch (error) {
        console.error("Error loading properties from blockchain:", error);
        setLoading(false); // También detener la carga en caso de error
      }
    } else {
      console.log('Please install MetaMask!');
    }
  };

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

  const handleOfferSubmitted = (offerDetails) => {
    setActiveTransaction({
      ...offerDetails,
      status: 'Oferta Realizada' // Initial status
    });
    setSelectedProperty(null); // Hide the detail view
  };

  const handleUpdateTransactionStatus = (newStatus) => {
    setActiveTransaction(prev => {
      const updatedTransaction = { ...prev, status: newStatus };
      
      if (newStatus === 'Propiedad Transferida') {
        // Add the property with full ownership to the portfolio
        setPortfolio(currentPortfolio => [
          ...currentPortfolio,
          { ...updatedTransaction.property, ownership: { type: 'full' } }
        ]);
        // After a delay, clear the transaction and switch to portfolio
        setTimeout(() => {
          setActiveTransaction(null);
          setCurrentView('portfolio');
        }, 2000);
      }
      
      return updatedTransaction;
    });
  };

  const handleInvest = (property, fractions) => {
    const numFractions = parseInt(fractions, 10);
    if (!numFractions || numFractions <= 0) {
      alert('Por favor, ingresa un número válido de fracciones.');
      return;
    }

    setPortfolio(currentPortfolio => {
      const existingInvestment = currentPortfolio.find(p => p.tokenId === property.tokenId);

      if (existingInvestment) {
        // Update existing investment
        return currentPortfolio.map(p => 
          p.tokenId === property.tokenId 
            ? { ...p, ownership: { ...p.ownership, amount: p.ownership.amount + numFractions } } 
            : p
        );
      } else {
        // Add new investment
        return [
          ...currentPortfolio,
          { ...property, ownership: { type: 'fractional', amount: numFractions } }
        ];
      }
    });

    const fractionPrice = parseInt(property.price.replace(/\$|,/g, '')) / 1000;
    const totalCost = fractionPrice * numFractions;
    alert(`Simulación: Inversión de $${totalCost.toFixed(2)} por ${numFractions} fracciones del Token ID: ${property.tokenId} realizada.`);
  };

  const navigate = (view) => {
    setCurrentView(view);
    // Reset other states when navigating
    setSelectedProperty(null);
    setActiveTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header onConnectWallet={connectWallet} walletAddress={walletAddress} onNavigate={navigate} />

      <main className="container mx-auto p-12 flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="w-full lg:w-1/4">
          <Filters onSearch={handleSearch} />
          <DaoPanel />
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {currentView === 'portfolio' ? (
            <Portfolio properties={portfolio} />
          ) : activeTransaction ? (
            <TransactionStatus transaction={activeTransaction} onUpdateStatus={handleUpdateTransactionStatus} />
          ) : selectedProperty ? (
            <PropertyDetail property={selectedProperty} onBack={handleBackToList} onOfferSubmit={handleOfferSubmitted} onInvest={handleInvest} />
          ) : loading ? (
            <p className="text-center text-gray-500">Cargando propiedades desde la blockchain...</p>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Descubre propiedades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map(property => (
                  <PropertyCard key={property.tokenId} property={property} onSelect={handleSelectProperty} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

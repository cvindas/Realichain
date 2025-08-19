/* global BigInt */
import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RealEstate from './contracts/RealEstate.json';
import DAOArtifact from './contracts/DAO.json';
import contractAddresses from './contracts/contract-addresses.json';
import Home from './components/Home'; // Importar Home
import PropertyCard from './components/PropertyCard';
import PropertyDetail from './components/PropertyDetail';
import MintProperty from './components/MintProperty';
import TransactionStatus from './components/TransactionStatus';
import DAOManager from './components/DAOManager';
import FractionalizeModal from './components/FractionalizeModal'; // Importar el modal
import FractionContractArtifact from './contracts/Fraction.json'; // Importar el ABI de Fraction
import './index.css';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [realEstateContract, setRealEstateContract] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState({ status: 'idle', message: '' });
  const [pendingWithdrawals, setPendingWithdrawals] = useState('0');
  const [daoContract, setDaoContract] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isFractionalizeModalOpen, setIsFractionalizeModalOpen] = useState(false);
  const [propertyToFractionalize, setPropertyToFractionalize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const hardhatChainId = '31337';

        if (network.chainId.toString() !== hardhatChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${Number(hardhatChainId).toString(16)}` }],
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${Number(hardhatChainId).toString(16)}`,
                    chainName: 'Hardhat',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  }],
                });
              } catch (addError) {
                throw new Error(`Error al agregar la red Hardhat: ${addError.message}`);
              }
            } else {
              throw new Error(`Error al cambiar de red: ${switchError.message}`);
            }
          }
        }

        // Re-check provider and signer after potential network switch
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const accounts = await newProvider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);

        const realEstateAddress = contractAddresses.RealEstate;
        if (!realEstateAddress) {
          throw new Error('Dirección del contrato RealEstate no encontrada. Ejecuta el script de actualización.');
        }
        const realEstate = new ethers.Contract(realEstateAddress, RealEstate.abi, signer);
        setRealEstateContract(realEstate);

        const daoAddress = contractAddresses.DAO;
        if (!daoAddress) {
          throw new Error('Dirección del contrato DAO no encontrada. Ejecuta el script de actualización.');
        }
        const dao = new ethers.Contract(daoAddress, DAOArtifact.abi, signer);
        setDaoContract(dao);

      } catch (error) {
        console.error("Error connecting to wallet:", error);
        setTransactionStatus({ status: 'error', message: `Error al conectar: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    } else {
      setTransactionStatus({ status: 'error', message: 'MetaMask no está instalado o no se detecta. Por favor, instale la extensión y recargue la página.' });
    }
  }, []);

  const loadBlockchainData = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    try {
      const totalSupply = await realEstateContract.totalSupply();
      const indices = Array.from({ length: Number(totalSupply) }, (_, i) => i);

      const propertiesPromises = indices.map(async (index) => {
        let id;
        try {
          id = await realEstateContract.tokenByIndex(index);
          const tokenUri = await realEstateContract.tokenURI(id);
          const owner = await realEstateContract.ownerOf(id);
          const fractionContractAddress = await realEstateContract.fractionContracts(id);
          const highestOffer = await realEstateContract.highestOffer(id);
          const rentalInfo = await realEstateContract.rentalInfo(id);
          let userWithdrawable = ethers.parseEther("0");
          let fractionTotalSupply = null;
          let userFractionBalance = BigInt(0);

          if (fractionContractAddress && fractionContractAddress !== ethers.ZeroAddress) {
            const fractionContract = new ethers.Contract(fractionContractAddress, FractionContractArtifact.abi, provider);
            const totalReceived = await provider.getBalance(fractionContractAddress) + await fractionContract.totalReleased();
            const userBalance = await fractionContract.balanceOf(walletAddress);
            const totalSupply = await fractionContract.totalSupply();
            if (totalSupply > 0) {
                const proportionalShare = (totalReceived * userBalance) / totalSupply;
                const userReleased = await fractionContract.released(walletAddress);
                userWithdrawable = proportionalShare - userReleased;
                fractionTotalSupply = await fractionContract.totalSupply();
            }
            userFractionBalance = await fractionContract.balanceOf(walletAddress);
          }

          let metadata;
          if (tokenUri.startsWith('data:application/json;base64,')) {
            const base64String = tokenUri.split(',')[1];
            const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
            metadata = JSON.parse(jsonString);
          } else {
            const gatewayUrl = process.env.REACT_APP_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
            const response = await fetch(tokenUri.replace('ipfs://', gatewayUrl));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            metadata = await response.json();
          }

          const imageUrl = metadata.image.startsWith('ipfs://')
            ? metadata.image.replace('ipfs://', process.env.REACT_APP_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/')
            : metadata.image;

          return {
            tokenId: id,
            name: metadata.name,
            description: metadata.description,
            image: imageUrl,
            attributes: metadata.attributes,
            owner: owner,
            fractionContractAddress: fractionContractAddress === ethers.ZeroAddress ? null : fractionContractAddress,
            userWithdrawable: userWithdrawable,
            fractionTotalSupply: fractionTotalSupply,
            userFractionBalance: userFractionBalance,
            highestOffer: {
              offerer: highestOffer.offerer,
              amount: highestOffer.amount,
              isActive: highestOffer.isActive
            },
            rentalInfo: {
              tenant: rentalInfo.tenant,
              rentPricePerDay: rentalInfo.rentPricePerDay,
              rentedUntil: rentalInfo.rentedUntil,
              isListed: rentalInfo.isListed
            }
          };
        } catch (error) {
          console.error(`Error al cargar el token con índice ${index} (ID: ${id || 'desconocido'}):`, error);
          return null;
        }
      });

      const properties = (await Promise.all(propertiesPromises)).filter(p => p !== null);
      setAllProperties(properties);

      if (walletAddress) {
        const withdrawals = await realEstateContract.pendingWithdrawals(walletAddress);
        setPendingWithdrawals(ethers.formatEther(withdrawals));
      }
    } catch (error) {
      console.error("Error al cargar los datos de la blockchain:", error);
    }
  }, [realEstateContract, walletAddress]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          connectWallet();
        }
      }
    };
    checkConnection();
  }, [connectWallet]);

  useEffect(() => {
    if (walletAddress && realEstateContract) {
      loadBlockchainData();
    }
  }, [walletAddress, realEstateContract, loadBlockchainData]);

  const handleMint = async (tokenUri) => {
    if (!realEstateContract) return;

    try {
      setTransactionStatus({ status: 'pending', message: 'Enviando transacción para mintear el NFT...' });

      const tx = await realEstateContract.safeMint(walletAddress, tokenUri);
      await tx.wait();

      setTransactionStatus({ status: 'success', message: '¡Propiedad minteada con éxito!' });
      loadBlockchainData(); // Recargar propiedades
    } catch (error) {
      console.error("Error en handleMint:", error);
      setTransactionStatus({ status: 'error', message: `Error al mintear: ${error.message}` });
    }
  };

  const handleMakeOffer = async (tokenId, offerAmount) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Realizando oferta...' });
      const transaction = await realEstateContract.makeOffer(tokenId, { value: ethers.parseEther(offerAmount) });
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡Oferta realizada con éxito!' });
      await loadBlockchainData();
    } catch (error) {
      console.error("Error al realizar la oferta:", error);
      setTransactionStatus({ status: 'error', message: `Error al realizar la oferta: ${error.reason || error.message}` });
    }
  };

  const handleAcceptOffer = async (tokenId) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Aceptando oferta...' });
      const transaction = await realEstateContract.acceptOffer(tokenId);
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡Oferta aceptada y propiedad transferida!' });
      await loadBlockchainData();
    } catch (error) {
      console.error("Error al aceptar la oferta:", error);
      setTransactionStatus({ status: 'error', message: `Error al aceptar oferta: ${error.reason || error.message}` });
    }
  };

  const handlePurchaseFractions = async (fractionContractAddress, amount) => {
    if (!walletAddress || !amount) return;
    try {
        setTransactionStatus({ status: 'pending', message: 'Comprando fracciones...' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const fractionContract = new ethers.Contract(fractionContractAddress, FractionContractArtifact.abi, signer);
        
        // pricePerFraction es una variable pública, ethers.js crea un getter para ella.
        const pricePerFraction = await fractionContract.pricePerFraction();
        // El número de fracciones (la cantidad que el usuario introduce) se usa para calcular el costo total.
        const totalCost = pricePerFraction * BigInt(amount);
        // La cantidad de tokens a comprar debe tener en cuenta los 18 decimales del estándar ERC20.
        const numberOfTokens = BigInt(amount) * (BigInt(10)**BigInt(18));

        const tx = await fractionContract.purchase(numberOfTokens, { value: totalCost });
        await tx.wait();

        setTransactionStatus({ status: 'success', message: '¡Fracciones compradas con éxito!' });
        await loadBlockchainData();
    } catch (error) {
        console.error("Error al comprar fracciones:", error);
        setTransactionStatus({ status: 'error', message: `Error al comprar fracciones: ${error.reason || error.message}` });
    }
  };

  const handleWithdrawRent = async () => {
    if (!realEstateContract) return;
    try {
        setTransactionStatus({ status: 'pending', message: 'Retirando ganancias del alquiler...' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tx = await realEstateContract.connect(signer).withdrawRent();
        await tx.wait();
        setTransactionStatus({ status: 'success', message: '¡Ganancias retiradas con éxito!' });
        await loadBlockchainData(); // Recargar datos
    } catch (error) {
        console.error("Error en handleWithdrawRent:", error);
        setTransactionStatus({ status: 'error', message: `Error al retirar ganancias: ${error.reason || error.message}` });
    }
  };

  const handleFractionalize = async (property, supply, price) => {
    if (!realEstateContract || !walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 1. Desplegar el contrato de fracción (sin inicializar)
      setTransactionStatus({ status: 'pending', message: 'Desplegando contrato de fracción...' });
      const fractionFactory = new ethers.ContractFactory(FractionContractArtifact.abi, FractionContractArtifact.bytecode, signer);
      const fractionContract = await fractionFactory.deploy(
        `Fractions of ${property.name}`,
        `F${property.tokenId}`
      );
      await fractionContract.waitForDeployment();
      const fractionContractAddress = await fractionContract.getAddress();

      // 2. Aprobar que el nuevo contrato de fracción gestione el NFT
      setTransactionStatus({ status: 'pending', message: 'Aprobando transferencia de NFT...' });
      const approveTx = await realEstateContract.approve(fractionContractAddress, property.tokenId);
      await approveTx.wait();

      // 3. Registrar la dirección del contrato de fracción en el contrato principal
      setTransactionStatus({ status: 'pending', message: 'Registrando contrato de fracción...' });
      const setFractionTx = await realEstateContract.setFractionContract(property.tokenId, fractionContractAddress);
      await setFractionTx.wait();

      // 4. Inicializar el contrato de fracción (esto transfiere el NFT)
      setTransactionStatus({ status: 'pending', message: 'Inicializando contrato y transfiriendo NFT...' });
      const priceInWei = ethers.parseEther(price.toString());

      const initializeTx = await fractionContract.initialize(
        realEstateContract.target, // Dirección del contrato RealEstate
        property.tokenId,          // ID del NFT
        supply,                    // Suministro de fracciones
        walletAddress,             // Propietario inicial
        priceInWei                 // Precio por fracción en Wei
      );
      await initializeTx.wait();

      setTransactionStatus({ status: 'success', message: '¡Propiedad fraccionada con éxito!' });
      loadBlockchainData(); // Recargar datos
    } catch (error) {
      console.error("Error en handleFractionalize:", error);
      setTransactionStatus({ status: 'error', message: `Error al fraccionalizar: ${error.message}` });
    }
  };
  const handleWithdraw = async (fractionContractAddress) => {
    if (!fractionContractAddress) return;
    try {
        setTransactionStatus({ status: 'pending', message: 'Retirando ganancias...' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const fractionContract = new ethers.Contract(fractionContractAddress, FractionContractArtifact.abi, signer);

        const tx = await fractionContract.withdraw();
        await tx.wait();

        setTransactionStatus({ status: 'success', message: '¡Ganancias retiradas con éxito!' });
        loadBlockchainData(); // Recargar datos
    } catch (error) {
        console.error("Error en handleWithdraw:", error);
        setTransactionStatus({ status: 'error', message: `Error al aceptar oferta: ${error.reason || error.message}` });
    }
  };

  const handleListForRent = async (tokenId, rentPrice) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Poniendo la propiedad en alquiler...' });
      const priceInWei = ethers.parseEther(rentPrice.toString());
      const transaction = await realEstateContract.listPropertyForRent(tokenId, priceInWei);
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡La propiedad ha sido listada para alquilar!' });
      await loadBlockchainData(); // Recargar datos para reflejar el cambio
    } catch (error) {
      console.error("Error al listar la propiedad para alquilar:", error);
      setTransactionStatus({ status: 'error', message: `Error al listar para alquilar: ${error.reason || error.message}` });
    }
  };

  const handleUnlistForRent = async (tokenId) => {
    if (!realEstateContract) return;
    try {
      setTransactionStatus({ status: 'pending', message: 'Retirando la propiedad del mercado de alquiler...' });
      const transaction = await realEstateContract.unlistPropertyForRent(tokenId);
      await transaction.wait();
      setTransactionStatus({ status: 'success', message: '¡La propiedad ya no está en alquiler!' });
      await loadBlockchainData(); // Recargar datos para reflejar el cambio
    } catch (error) {
      console.error("Error al retirar la propiedad del alquiler:", error);
      setTransactionStatus({ status: 'error', message: `Error al retirar del alquiler: ${error.reason || error.message}` });
    }
  };

  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">RealiChain</Link>
              </div>
              <div className="flex items-center">
                <button onClick={() => setIsMintModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Mintear Propiedad
                </button>
                <div className="ml-4 md:ml-6">
                  <button onClick={connectWallet} className="connect-wallet-btn">{walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Conectar Billetera'}</button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <header className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <TransactionStatus status={transactionStatus.status} message={transactionStatus.message} />
          
          <div className="flex justify-center my-8">
            <div className="flex border-b border-gray-300">
              <Link to="/properties" className="py-2 px-6 text-lg font-semibold text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600 focus:border-b-2 focus:border-blue-600">
                Propiedades
              </Link>
              <Link to="/dao" className="py-2 px-6 text-lg font-semibold text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600 focus:border-b-2 focus:border-blue-600">
                Gobernanza (DAO)
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto pb-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={
              selectedProperty ? (
                <PropertyDetail 
                  property={selectedProperty} 
                  onBack={() => setSelectedProperty(null)}
                  walletAddress={walletAddress}
                  contract={realEstateContract} 
                  onMakeOffer={handleMakeOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onPurchaseFractions={handlePurchaseFractions}
                  onListForRent={handleListForRent}
                  onUnlistForRent={handleUnlistForRent}
                  onWithdrawRent={handleWithdrawRent}
                  pendingWithdrawals={pendingWithdrawals}
                  setTransactionStatus={setTransactionStatus}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProperties.map((property) => (
                    <PropertyCard 
                      key={property.tokenId} 
                      property={property} 
                      onSelectProperty={setSelectedProperty}
                      walletAddress={walletAddress}
                      onFractionalizeClick={(property) => {
                        setPropertyToFractionalize(property);
                        setIsFractionalizeModalOpen(true);
                      }}
                      onWithdrawClick={handleWithdraw}
                    />
                  ))}
                </div>
              )
            } />
            <Route path="/dao" element={
              daoContract ? (
                <DAOManager 
                  daoContract={daoContract}
                  walletAddress={walletAddress}
                  setTransactionStatus={setTransactionStatus}
                  allProperties={allProperties}
                  realEstateContract={realEstateContract}
                />
              ) : (
                <div className="text-center"><p>Conecta tu billetera para ver el DAO.</p></div>
              )
            } />
          </Routes>
        </main>

        <MintProperty 
          isOpen={isMintModalOpen}
          onClose={() => setIsMintModalOpen(false)}
          onMint={handleMint}
          setTransactionStatus={setTransactionStatus}
        />

        <FractionalizeModal 
          isOpen={isFractionalizeModalOpen}
          property={propertyToFractionalize}
          onClose={() => setIsFractionalizeModalOpen(false)}
          onFractionalize={handleFractionalize}
        />
      </div>
    </Router>
  );
}

export default App;
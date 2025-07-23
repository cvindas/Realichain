import React, { useState } from 'react';

const Header = ({ onConnectWallet, walletAddress, onNavigate }) => {
  const [isCopied, setIsCopied] = useState(false);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };
  return (
    <header className="bg-dark-navy text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-5">
        <h1 className="text-3xl font-bold tracking-wider">DApp BIENES RAÍCES</h1>
        <nav>
          <ul className="flex items-center gap-6 text-lg">
            <li><button onClick={() => onNavigate('discover')} className="hover:text-brand-blue transition-colors duration-300 font-semibold">Descubrir</button></li>
            {walletAddress && (
              <li><button onClick={() => onNavigate('portfolio')} className="hover:text-brand-blue transition-colors duration-300 font-semibold">Mi Portafolio</button></li>
            )}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          {walletAddress ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-700 rounded-lg">
                <span className="text-white font-semibold px-4 py-2">{formatAddress(walletAddress)}</span>
                <button onClick={handleCopy} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-2 rounded-r-lg">
                  {isCopied ? '¡Copiado!' : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  }
                </button>
              </div>
              <button onClick={() => alert('Simulación: Iniciando proceso de tokenización...')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
                Tokenizar Propiedad
              </button>
            </div>
          ) : (
            <button 
              onClick={onConnectWallet} 
              className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
            >
              Conectar Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

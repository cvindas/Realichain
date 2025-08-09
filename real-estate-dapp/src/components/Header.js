import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ walletAddress, onConnect, className, currentView, onNavigate }) => {

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className={`bg-slate-900 text-white shadow-lg ${className}`}>
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h1 className="text-2xl font-bold tracking-wide">DApp BIENES RAÍCES</h1>
        </div>

        {walletAddress && (
          <nav className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => onNavigate('discover')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${currentView === 'discover' ? 'bg-sky-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}>
              Descubre
            </button>
            <button 
              onClick={() => onNavigate('portfolio')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${currentView === 'portfolio' ? 'bg-sky-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}>
              Mi Portafolio
            </button>
            <button 
              onClick={() => onNavigate('history')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${currentView === 'history' ? 'bg-sky-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}>
              Historial
            </button>
          </nav>
        )}
        
        <div className="flex items-center gap-4">
          {walletAddress ? (
            <div className="flex items-center gap-4">
              <div className="bg-slate-800 text-white font-mono text-sm py-2 px-4 rounded-lg">
                <span>{formatAddress(walletAddress)}</span>
              </div>
              <Link to="/mint" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                Mintear
              </Link>
            </div>
          ) : (
            <button 
              onClick={onConnect}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Conectar Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);

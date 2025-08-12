import React from 'react';

const Header = ({ connectWallet, walletAddress, onNavigate }) => {
  const displayAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const NavButton = ({ path, children }) => (
    <button 
      onClick={() => onNavigate(path)}
      className="text-gray-600 hover:text-blue-500 font-semibold transition duration-300 ease-in-out"
    >
      {children}
    </button>
  );

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        <img src="/logo.png" alt="Realichain Logo" className="h-10 w-auto cursor-pointer" onClick={() => onNavigate('/')} />
        <h1 className="text-2xl font-bold text-gray-800 ml-4">Realichain</h1>
      </div>
      <nav className="flex items-center space-x-6">
        <NavButton path="/">Descubrir</NavButton>
        <NavButton path="/mint">Mintear</NavButton>
        <NavButton path="/portfolio">Mi Portafolio</NavButton>
        <NavButton path="/dao">DAO</NavButton>
        <NavButton path="/history">Historial</NavButton>
        <button 
          onClick={connectWallet} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
        >
          {walletAddress ? `Conectado: ${displayAddress(walletAddress)}` : 'Conectar Wallet'}
        </button>
      </nav>
    </header>
  );
};

export default Header;

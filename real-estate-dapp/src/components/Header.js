import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ onConnectWallet, walletAddress }) => {
  const displayAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const NavLink = ({ to, children }) => (
    <Link to={to} className="text-gray-600 hover:text-blue-500 font-semibold transition duration-300 ease-in-out">
      {children}
    </Link>
  );

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="Realichain Logo" className="h-10 w-auto" />
        <h1 className="text-2xl font-bold text-gray-800 ml-4">Realichain</h1>
      </Link>
      <nav className="flex items-center space-x-6">
        <NavLink to="/discover">Descubrir</NavLink>
        <NavLink to="/mint">Mintear</NavLink>
        <NavLink to="/portfolio">Mi Portafolio</NavLink>
        <NavLink to="/dao">DAO</NavLink>
        <NavLink to="/history">Historial</NavLink>
        <button 
          onClick={onConnectWallet} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
        >
          {walletAddress ? `Conectado: ${displayAddress(walletAddress)}` : 'Conectar Wallet'}
        </button>
      </nav>
    </header>
  );
};

export default Header;

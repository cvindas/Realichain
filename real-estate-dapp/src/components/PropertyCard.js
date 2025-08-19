import React from 'react';
import { ethers } from 'ethers';
import { PINATA_GATEWAY_URL } from '../pinata-config';

// Helper to extract attributes safely
const getAttribute = (attributes, traitType) => {
  const attr = attributes?.find(a => a.trait_type === traitType);
  return attr ? attr.value : 'N/A';
};

const PropertyCard = ({ property, onSelectProperty, walletAddress, onFractionalizeClick, onWithdrawClick }) => {
  // Construct image URL
  let imageUrl = property.image || '';
  if (imageUrl.startsWith('ipfs://')) {
    imageUrl = `${PINATA_GATEWAY_URL}/ipfs/${imageUrl.split('ipfs://')[1]}`;
  }

  // Extract attributes
  const city = getAttribute(property.attributes, 'Location');
  const propertyType = getAttribute(property.attributes, 'PropertyType');
  const price = getAttribute(property.attributes, 'Price (ETH)');
  const totalFractionsFromMeta = getAttribute(property.attributes, 'Fractions');
  const displayFractions = property.fractionTotalSupply 
    ? `${ethers.formatUnits(property.fractionTotalSupply, 18)} Fracciones`
    : `${totalFractionsFromMeta} Fracciones`;

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'N/A' : numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div onClick={() => onSelectProperty(property)} className="cursor-pointer">
        <div 
          className="relative w-full h-48 bg-cover bg-center flex items-center justify-center p-4"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
          <h3 className="relative text-white text-3xl font-bold text-center z-10">{property.name}</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-blue-600">{formatPrice(price)} ETH</p>
            <p className="text-sm text-gray-600 bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">{propertyType}</p>
          </div>
          <p className="text-md text-gray-700 mt-2 flex-grow">{property.description ? property.description.substring(0, 100) + '...' : ''}</p>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
              <span>{city}</span>
              <span className="font-semibold">{displayFractions}</span>
          </div>
        </div>
      </div>
      <div className="p-4 pt-0 mt-auto">
        <div className="flex flex-col space-y-2">
            <button 
              onClick={() => onSelectProperty(property)}
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
            >
              Ver Detalles
            </button>
            {walletAddress && property.owner.toLowerCase() === walletAddress.toLowerCase() && !property.fractionContractAddress && (
              <button 
                onClick={() => onFractionalizeClick(property)} 
                className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition duration-300"
              >
                Fraccionalizar
              </button>
            )}
            {property.fractionContractAddress && property.userWithdrawable > 0 && (
              <div className="mt-2 text-center">
                  <p className="text-md font-semibold text-green-700">Ganancias: {ethers.formatEther(property.userWithdrawable)} ETH</p>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      onWithdrawClick(property.fractionContractAddress); 
                    }}
                    className="w-full mt-1 bg-teal-500 text-white font-bold py-2 px-4 rounded hover:bg-teal-600 transition duration-300"
                  >
                    Retirar
                  </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

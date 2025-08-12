import React from 'react';
import { Link } from 'react-router-dom';
import { PINATA_GATEWAY_URL } from '../pinata-config';

// Helper to extract attributes safely
const getAttribute = (attributes, traitType) => {
  const attr = attributes?.find(a => a.trait_type === traitType);
  return attr ? attr.value : 'N/A';
};

const PropertyCard = ({ property }) => {
  // Construct image URL
  let imageUrl = property.image || '';
  if (imageUrl.startsWith('ipfs://')) {
    imageUrl = `${PINATA_GATEWAY_URL}/ipfs/${imageUrl.split('ipfs://')[1]}`;
  }

  // Extract attributes
  const city = getAttribute(property.attributes, 'Location');
  const propertyType = getAttribute(property.attributes, 'PropertyType');

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'N/A' : numPrice.toLocaleString('en-US');
  };

  return (
    <Link 
      to={`/property/${property.tokenId}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group"
    >
      <div 
        className="relative w-full h-48 bg-cover bg-center flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
        <h3 className="relative text-white text-3xl font-bold text-center z-10">{property.name}</h3>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold text-gray-900">${formatPrice(property.price)}</p>
          <p className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full font-medium">{propertyType}</p>
        </div>
        <p className="text-md text-gray-700 mt-2">{property.description ? property.description.substring(0, 100) + '...' : ''}</p>
        <p className="text-sm text-gray-500 mt-1">{city}</p>
      </div>
    </Link>
  );
};

export default PropertyCard;

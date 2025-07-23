import React from 'react';

const PropertyCard = ({ property, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
      <img className="w-full h-56 object-cover" src={property.image} alt={`${property.type} in ${property.city}`} />
      <div className="p-6 flex-grow flex flex-col">
        <p className="text-2xl font-bold text-gray-900">{property.price}</p>
        <p className="text-lg text-gray-700 mt-1">{property.type}</p>
        <p className="text-md text-gray-500 mt-1">{property.city}</p>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-mono">Token ID: {property.tokenId}</p>
        </div>
        <div className="mt-auto">
          <button 
            onClick={() => onSelect(property)}
            className="mt-4 w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

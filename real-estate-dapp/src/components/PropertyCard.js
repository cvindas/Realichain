import React from 'react';

const PropertyCard = ({ property, onSelect }) => {
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toLocaleString('en-US');
    }
    if (typeof price === 'string') {
      const num = parseInt(price.replace(/\$|,/g, ''));
      return isNaN(num) ? price : num.toLocaleString('en-US');
    }
    return price;
  };

  return (
    <div 
      onClick={() => onSelect(property)}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group"
    >
      <div 
        className="relative w-full h-48 bg-cover bg-center flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${property.image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
        <h3 className="relative text-white text-3xl font-bold text-center z-10">{property.name}</h3>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold text-gray-900">${formatPrice(property.price)}</p>
          <p className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full font-medium">{property.propertyType}</p>
        </div>
        <p className="text-md text-gray-700 mt-2">{property.description.substring(0, 100)}...</p>
        <p className="text-sm text-gray-500 mt-1">{property.city}</p>
      </div>
    </div>
  );
};

export default PropertyCard;

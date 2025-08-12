import React from 'react';
import PropertyCard from './PropertyCard';

const PropertyList = ({ properties, onSelectProperty, onBuyFractions }) => {
  if (!properties || properties.length === 0) {
    return <p className="text-center text-gray-500">No hay propiedades disponibles en este momento.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map(property => (
        <PropertyCard 
          key={property.tokenId}
          property={property}
          onSelect={() => onSelectProperty(property)}
          onBuyFractions={onBuyFractions}
        />
      ))}
    </div>
  );
};

export default PropertyList;

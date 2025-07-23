import React from 'react';

const Portfolio = ({ properties }) => {
  return (
    <div>
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Mi Portafolio</h2>
      {properties.length === 0 ? (
        <p className="text-gray-600">Aún no tienes propiedades en tu portafolio. ¡Completa una transacción para empezar!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <img src={property.image} alt={property.type} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800">{property.type}</h3>
                <p className="text-gray-600 mt-2">{property.city}</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-md font-semibold text-gray-700">Token ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{property.tokenId}</span></p>
                  {property.ownership.type === 'fractional' ? (
                    <p className="text-md font-semibold text-purple-700 mt-2">Propiedad Fraccionada</p>
                  ) : (
                    <p className="text-md font-semibold text-green-700 mt-2">Propiedad Completa</p>
                  )}
                  {property.ownership.type === 'fractional' && (
                    <p className="text-sm text-gray-600 mt-1">Posees <span className="font-bold">{property.ownership.amount}</span> de 1,000 fracciones</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Portfolio;

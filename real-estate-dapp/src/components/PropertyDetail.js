import React, { useState } from 'react';

const PropertyDetail = ({ property, onBack, onOfferSubmit, onInvest }) => {
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [fractions, setFractions] = useState('');

  const isForSale = property.type !== 'Renta Vacacional';
  const priceAsNumber = isForSale ? parseInt(property.price.replace(/\$|,/g, '')) : 0;
  const fractionPrice = isForSale ? priceAsNumber / 1000 : 0; // Assuming 1000 fractions

  const handleOfferSubmit = () => {
    if (!offerAmount) {
      alert('Por favor, ingresa un monto para la oferta.');
      return;
    }
    onOfferSubmit({ property, offerAmount });
  };

  const handleInvest = () => {
    onInvest(property, fractions);
    setFractions('');
  };
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <button onClick={onBack} className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
        &larr; Volver a la lista
      </button>
      <div className="flex flex-col md:flex-row gap-8">
        <img className="w-full md:w-1/2 h-auto object-cover rounded-lg" src={property.image} alt={`${property.type} in ${property.city}`} />
        <div className="w-full md:w-1/2">
          <h2 className="text-4xl font-bold text-gray-900">{property.type}</h2>
          <p className="text-2xl text-gray-700 mt-2">{property.city}</p>
          <p className="text-3xl font-bold text-brand-blue mt-4">{property.price}</p>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Detalles del Token (NFT)</h3>
            <p className="text-md text-gray-600 font-mono mt-2">
              Token ID: 
              <a 
                href={`https://etherscan.io/token/0x0000000000000000000000000000000000000000?a=${property.tokenId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline ml-1"
              >
                {property.tokenId}
              </a>
            </p>
            <p className="text-md text-gray-600 font-mono mt-1">
              IPFS Hash: 
              <a 
                href={`https://ipfs.io/ipfs/${property.ipfsHash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline ml-1"
              >
                {property.ipfsHash}
              </a>
            </p>
          </div>

          {showOfferForm ? (
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-800">Ingresa tu oferta (USD)</h4>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="number" 
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-brand-blue"
                  placeholder="Ej: 345000"
                />
                <button 
                  onClick={handleOfferSubmit}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap"
                >
                  Enviar Oferta
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowOfferForm(true)}
              className="mt-8 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Hacer una Oferta
            </button>
          )}

          {isForSale && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Inversión Fraccionada</h3>
              <p className="text-md text-gray-600 mt-2">Invierte en una fracción de esta propiedad y sé dueño de una parte.</p>
              
              <div className="mt-4">
                <p className="text-lg font-semibold">Total Fracciones: <span className="font-normal">1,000</span></p>
                <p className="text-lg font-semibold">Precio por Fracción: <span className="font-normal">${fractionPrice.toFixed(2)}</span></p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="number"
                  value={fractions}
                  onChange={(e) => setFractions(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-brand-blue"
                  placeholder="Nº de fracciones"
                />
                <button 
                  onClick={handleInvest}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap"
                >
                  Invertir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

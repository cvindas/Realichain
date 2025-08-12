import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import RentalManager from './RentalManager';
import RentalForm from './RentalForm';
import { PINATA_GATEWAY_URL } from '../pinata-config';

// Helper to extract attributes safely
const getAttribute = (attributes, traitType) => {
  const attr = attributes?.find(a => a.trait_type === traitType);
  return attr ? attr.value : 'N/A';
};

const PropertyDetail = ({ properties, onPurchase, walletAddress, contract, onListForRent, onRent, onWithdrawRent }) => {
    const { id: tokenId } = useParams(); // Renombramos 'id' a 'tokenId' para claridad
  const [property, setProperty] = useState(null);
  const [fractionsToBuy, setFractionsToBuy] = useState(1);

  useEffect(() => {
    if (properties && tokenId) {
      const selectedProperty = properties.find(p => p.tokenId.toString() === tokenId);
      setProperty(selectedProperty);
    }
  }, [properties, tokenId]);

  // Use useMemo to compute derived data only when property changes
  const propertyData = useMemo(() => {
    if (!property) return null;

    const fractions = getAttribute(property.attributes, 'Fractions');
    const location = getAttribute(property.attributes, 'Location');
    const price = property.price || 0;
    const fractionPrice = Number(fractions) > 0 ? price / Number(fractions) : 0;
    
    let imageUrl = property.image || '';
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `${PINATA_GATEWAY_URL}/ipfs/${imageUrl.split('ipfs://')[1]}`;
    }

    return {
      fractions,
      location,
      price,
      fractionPrice,
      imageUrl,
      isOwner: walletAddress && property.owner && walletAddress.toLowerCase() === property.owner.toLowerCase(),
    };
  }, [property, walletAddress]);

  const totalCost = useMemo(() => {
    if (!propertyData) return 0;
    return propertyData.fractionPrice * Number(fractionsToBuy);
  }, [propertyData, fractionsToBuy]);


  if (!property || !propertyData) {
    return <div className="text-center p-8">Cargando propiedad...</div>;
  }

  const handlePurchase = (e) => {
    e.preventDefault();
    if (onPurchase) {
      onPurchase(property.tokenId, fractionsToBuy);
    }
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={propertyData.imageUrl} alt={property.name} className="w-full h-auto object-cover rounded-lg shadow-lg" />
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">{property.name}</h2>
          <p className="text-gray-600 mb-4">{property.description}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-1">
            <p><strong>Ubicación:</strong> {propertyData.location}</p>
            <p><strong>Precio Total:</strong> {Number(propertyData.price).toLocaleString()} ETH</p>
            <p><strong>Fracciones Totales:</strong> {propertyData.fractions}</p>
            <p><strong>Precio por Fracción:</strong> {propertyData.fractionPrice.toFixed(8)} ETH</p>
          </div>

          <form onSubmit={handlePurchase} className="space-y-4">
            <div>
              <label htmlFor="fractions" className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Fracciones a Comprar</label>
              <input 
                type="number" 
                id="fractions" 
                value={fractionsToBuy} 
                onChange={(e) => setFractionsToBuy(e.target.value)} 
                min="1"
                max={property.fractions}
                className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
            <div className="text-xl font-bold">
              Costo Total (ETH): {totalCost.toFixed(8)}
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Comprar Fracciones
            </button>
          </form>

          {/* Rental Management Section */}
          {propertyData.isOwner ? (
            <RentalManager 
              tokenId={property.tokenId}
              contract={contract}
              walletAddress={walletAddress}
              owner={property.owner}
              onListForRent={onListForRent}
              onWithdrawRent={onWithdrawRent}
            />
          ) : (
            <RentalForm 
              tokenId={property.tokenId}
              contract={contract}
              walletAddress={walletAddress}
              owner={property.owner}
              onRent={onRent}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

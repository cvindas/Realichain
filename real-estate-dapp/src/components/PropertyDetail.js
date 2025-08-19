import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import RentalManager from './RentalManager';
import RentalForm from './RentalForm';
import OfferManager from './OfferManager';
import FractionManager from './FractionManager'; // Importar el nuevo componente
import { PINATA_GATEWAY_URL } from '../pinata-config';

// Helper to extract attributes safely
const getAttribute = (attributes, traitType) => {
  const attr = attributes?.find(a => a.trait_type === traitType);
  return attr ? attr.value : 'N/A';
};

const PropertyDetail = ({ property: initialProperty, onBack, walletAddress, contract, onMakeOffer, onAcceptOffer, onPurchaseFractions, onUnlistForRent, onListForRent, onRent, onWithdrawRent, pendingWithdrawals, setTransactionStatus }) => {
  const [property] = useState(initialProperty);

  // Use useMemo to compute derived data only when property changes
  const propertyData = useMemo(() => {
    if (!property) return null;

    const fractions = getAttribute(property.attributes, 'Fractions');
    const location = getAttribute(property.attributes, 'Location');
    const price = getAttribute(property.attributes, 'Price (ETH)');
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
      fractionsAvailable: property.fractionTotalSupply ? Number(fractions) - Number(ethers.formatUnits(property.fractionTotalSupply, 18)) : Number(fractions),
    };
  }, [property, walletAddress]);



  if (!property || !propertyData) {
    return <div className="text-center p-8">Cargando propiedad...</div>;
  }


  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={propertyData.imageUrl} alt={property.name} className="w-full h-auto object-cover rounded-lg shadow-lg" />
          <button onClick={onBack} className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
        ‹ Volver a la lista
      </button>
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

          {/* La gestión de fracciones ahora se maneja en su propio componente */}
          {property.fractionContractAddress && (
            <FractionManager 
              property={property}
              walletAddress={walletAddress}
              onPurchaseFractions={onPurchaseFractions}
              setTransactionStatus={setTransactionStatus}
              pricePerFraction={propertyData.fractionPrice}
              fractionsAvailable={propertyData.fractionsAvailable}
            />
          )}

          {/* Rental Management Section */}
          {propertyData.isOwner ? (
            <RentalManager 
              tokenId={property.tokenId}
              contract={contract}
              walletAddress={walletAddress}
              owner={property.owner}
              rentalInfo={property.rentalInfo} // Pasando la información de alquiler
              onListForRent={onListForRent}
              onUnlistForRent={onUnlistForRent}
              onWithdrawRent={onWithdrawRent}
              pendingWithdrawals={pendingWithdrawals} // Pasando los retiros pendientes
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

          <OfferManager 
            tokenId={property.tokenId}
            walletAddress={walletAddress}
            owner={property.owner}
            highestOffer={property.highestOffer}
            onMakeOffer={onMakeOffer}
            onAcceptOffer={onAcceptOffer}
            setTransactionStatus={setTransactionStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

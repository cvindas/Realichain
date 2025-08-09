import { useState } from 'react';
import { PinataSDK } from 'pinata';
import { PINATA_JWT, PINATA_GATEWAY } from '../pinata-config';
import { useNavigate } from 'react-router-dom';

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

const MintProperty = ({ onMint }) => {
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !price || !propertyType || !city) {
      alert('Please fill in all fields and select an image.');
      return;
    }

    if (PINATA_JWT === 'TU_PINATA_JWT') {
      alert('Please add your Pinata JWT to src/pinata-config.js');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload image to Pinata
      const imageUpload = await pinata.upload.public.file(image);
      const imageUrl = `https://${PINATA_GATEWAY}/ipfs/${imageUpload.cid}`;

      // 2. Create and upload metadata to Pinata
      const metadata = {
        price,
        type: propertyType,
        city,
        image: imageUrl,
      };
      const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
      const metadataUpload = await pinata.upload.public.file(metadataFile);
      const metadataUri = metadataUpload.cid;

      // 3. Call the mint function passed via props
      await onMint(metadataUri, navigate);

    } catch (error) {
      console.error('Error minting property:', error);
      alert('Error minting property. See console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-white">Mint New Property</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="propertyType" className="block text-gray-300 mb-2">Property Type</label>
          <input type="text" id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label htmlFor="city" className="block text-gray-300 mb-2">City</label>
          <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label htmlFor="price" className="block text-gray-300 mb-2">Price (USD)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="mb-6">
          <label htmlFor="image" className="block text-gray-300 mb-2">Property Image</label>
          <input type="file" id="image" onChange={(e) => setImage(e.target.files[0])} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
        <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-300 disabled:bg-gray-500">
          {uploading ? 'Minting...' : 'Mint Property'}
        </button>
      </form>
    </div>
  );
};

export default MintProperty;

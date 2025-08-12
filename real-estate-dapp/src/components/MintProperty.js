import { useState } from 'react';
import axios from 'axios';
import { PINATA_JWT, PINATA_GATEWAY_URL } from '../pinata-config';

const MintProperty = ({ onMint }) => {
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !price || !name || !propertyType || !city) {
      alert('Por favor, completa todos los campos y selecciona una imagen.');
      return;
    }

    setUploading(true);

    try {
      // 1. Subir la imagen a Pinata con Axios
      const formData = new FormData();
      formData.append('file', image);
      const imageRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      });
      const imageUrl = `${PINATA_GATEWAY_URL}/ipfs/${imageRes.data.IpfsHash}`;

      // 2. Crear y subir los metadatos a Pinata
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: [
          { trait_type: 'Price', value: price },
          { trait_type: 'City', value: city },
          { trait_type: 'PropertyType', value: propertyType },
        ],
      };

      const metadataRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      });
      const metadataUri = `ipfs://${metadataRes.data.IpfsHash}`;

      // 3. Llamar a la función de minteo pasada por props
      await onMint(metadataUri);

    } catch (error) {
      console.error('Error al mintear la propiedad:', error);
      alert('Error al mintear la propiedad. Revisa la consola para más detalles.');
    } finally {
      setUploading(false);
    }
  };

  const inputStyles = "w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Mintear Nueva Propiedad</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={labelStyles}>Nombre de la Propiedad</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} placeholder="Ej: Villa de Lujo en la Costa" />
        </div>
        <div>
          <label htmlFor="description" className={labelStyles}>Descripción</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles} placeholder="Una breve descripción de la propiedad..."></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="propertyType" className={labelStyles}>Tipo de Propiedad</label>
            <input type="text" id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputStyles} placeholder="Ej: Casa, Apartamento" />
          </div>
          <div>
            <label htmlFor="city" className={labelStyles}>Ciudad</label>
            <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputStyles} placeholder="Ej: Los Angeles" />
          </div>
        </div>
        <div>
          <label htmlFor="price" className={labelStyles}>Precio (USD)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className={inputStyles} placeholder="Ej: 500000" />
        </div>
        <div>
          <label htmlFor="image" className={labelStyles}>Imagen de la Propiedad</label>
          <input type="file" id="image" onChange={(e) => setImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
          {uploading ? 'Minteando en la blockchain...' : 'Mintear Propiedad'}
        </button>
      </form>
    </div>
  );
};

export default MintProperty;

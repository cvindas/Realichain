import { useState } from 'react';
import axios from 'axios';

const MintProperty = ({ onMint, setTransactionStatus }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fractions, setFractions] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !fractions || !image || !city || !propertyType) {
        setTransactionStatus({ status: 'error', message: 'Por favor, complete todos los campos.' });
        return;
    }
    if (parseFloat(price) <= 0 || parseInt(fractions, 10) <= 0) {
        setTransactionStatus({ status: 'error', message: 'El precio y las fracciones deben ser mayores a cero.' });
        return;
    }

    setTransactionStatus({ status: 'pending', message: 'Subiendo imagen a IPFS...' });

    try {
      // 1. Upload Image
      const imageFormData = new FormData();
      imageFormData.append('file', image);
      const imageRes = await axios.post('http://localhost:3001/pinata-upload', imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUri = `ipfs://${imageRes.data.IpfsHash}`;
      setTransactionStatus({ status: 'pending', message: 'Subiendo metadatos a IPFS...' });

      // 2. Create and Upload Metadata
      const metadata = {
        name,
        description,
        image: imageUri,
        attributes: [
          { trait_type: 'Location', value: city },
          { trait_type: 'PropertyType', value: propertyType },
          { trait_type: 'Fractions', value: fractions },
          { trait_type: 'Price (ETH)', value: price.toString() }
        ],
      };
      const metadataRes = await axios.post('http://localhost:3001/pinata-upload', metadata);
      const metadataUri = `ipfs://${metadataRes.data.IpfsHash}`;

      // 3. Mint NFT
      await onMint(metadataUri);

    } catch (error) {
      console.error("Error al mintear la propiedad:", error);
      setTransactionStatus({ status: 'error', message: `Error al mintear: ${error.message}` });
    }
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
  const labelStyles = "block text-sm font-medium text-slate-700";

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Mintear una Nueva Propiedad</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className={labelStyles}>Nombre de la Propiedad</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} placeholder="Ej: Villa de Lujo con Vista al Mar" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className={labelStyles}>Descripción</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles} rows="3" placeholder="Describa la propiedad..."></textarea>
        </div>
        <div>
          <label htmlFor="price" className={labelStyles}>Precio Total (ETH)</label>
          <input type="number" step="0.0001" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className={inputStyles} placeholder="Ej: 1.5" />
        </div>
        <div>
          <label htmlFor="fractions" className={labelStyles}>Fracciones Totales</label>
          <input type="number" id="fractions" value={fractions} onChange={(e) => setFractions(e.target.value)} className={inputStyles} placeholder="Ej: 1000" />
        </div>
        <div>
          <label htmlFor="city" className={labelStyles}>Ciudad</label>
          <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputStyles} placeholder="Ej: San José" />
        </div>
        <div>
          <label htmlFor="propertyType" className={labelStyles}>Tipo de Propiedad</label>
          <input type="text" id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputStyles} placeholder="Ej: Casa" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="image" className={labelStyles}>Imagen</label>
          <input type="file" id="image" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg shadow-md max-h-64" />}
        </div>
        <div className="md:col-span-2 text-center">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300">Mintear Propiedad</button>
        </div>
      </form>
    </div>
  );
};

export default MintProperty;
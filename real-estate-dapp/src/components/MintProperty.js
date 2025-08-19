import { useState } from 'react';
import axios from 'axios';

const MintProperty = ({ isOpen, onClose, onMint, setTransactionStatus }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fractions, setFractions] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = async (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      // Simulación de subida a IPFS y obtención de la URL
      // En una app real, aquí llamarías a Pinata o similar
      const simulatedUrl = URL.createObjectURL(e.target.files[0]);
      setImageUrl(simulatedUrl);
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

    try {
      setTransactionStatus({ status: 'pending', message: 'Subiendo imagen a IPFS...' });
      
      const imageFormData = new FormData();
      imageFormData.append("file", image);
      
      const imageResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", imageFormData, {
        maxBodyLength: "Infinity",
        headers: {
          'Content-Type': `multipart/form-data; boundary=${imageFormData._boundary}`,
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        }
      });
      const imageUrl = `ipfs://${imageResponse.data.IpfsHash}`;

      setTransactionStatus({ status: 'pending', message: 'Imagen subida. Creando metadatos...' });

      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: [
          { "trait_type": "Location", "value": city },
          { "trait_type": "PropertyType", "value": propertyType },
          { "trait_type": "Price (ETH)", "value": price.toString() },
          { "trait_type": "Fractions", "value": fractions.toString() }
        ]
      };

      const jsonResponse = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        }
      });

      const tokenUri = `ipfs://${jsonResponse.data.IpfsHash}`;
      setTransactionStatus({ status: 'pending', message: 'Metadatos creados. Enviando transacción...' });
      
      await onMint(tokenUri);
      onClose(); // Cierra el modal al mintear con éxito

    } catch (error) {
      console.error("Error durante el proceso de minteo:", error);
      let errorMessage = 'Error desconocido durante el minteo.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Error de autenticación con Pinata. Revisa tu clave JWT en el archivo .env.';
        } else {
          errorMessage = error.response.data?.error || `Error del servidor: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
      } else {
        errorMessage = error.message;
      }
      setTransactionStatus({ status: 'error', message: `Error en el minteo: ${errorMessage}` });
    }
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
  const labelStyles = "block text-sm font-medium text-slate-700";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full relative max-h-full overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold">&times;</button>
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
            <input type="file" id="image" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-4 rounded-lg shadow-md max-h-64" />}
          </div>
          <div className="md:col-span-2 text-center">
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300">Mintear Propiedad</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MintProperty;
import React, { useState } from 'react';
import './FractionalizeModal.css';

const FractionalizeModal = ({ isOpen, property, onFractionalize, onClose }) => {
  const [supply, setSupply] = useState(1000);
  const [price, setPrice] = useState('0.01'); // Precio en ETH

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supply || supply <= 1) {
      alert('La cantidad de fracciones debe ser mayor que 1.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert('El precio por fracción debe ser un número positivo.');
      return;
    }
    onFractionalize(property, supply, price);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Fraccionalizar Propiedad #{property.tokenId}</h2>
        <p>Estás a punto de dividir este NFT en múltiples tokens ERC20.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="supply">Cantidad de Fracciones a Emitir</label>
            <input 
              id="supply"
              type="number" 
              value={supply}
              onChange={(e) => {
                const value = e.target.value;
                // Evitar NaN si el campo está vacío, permitiendo que el usuario borre el número
                setSupply(value === '' ? '' : parseInt(value, 10));
              }}
              min="2"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Precio por Fracción (ETH)</label>
            <input
              id="price"
              type="number"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.000001"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-primary">
              Fraccionalizar
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FractionalizeModal;

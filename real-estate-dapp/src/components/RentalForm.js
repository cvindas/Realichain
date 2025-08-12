import React, { useState, useEffect } from 'react';
import { formatEther, toBigInt } from 'ethers';

const RentalForm = ({ tokenId, contract, walletAddress, owner, onRent }) => {
  const [duration, setDuration] = useState(1);
  const [rentalInfo, setRentalInfo] = useState(null);

  useEffect(() => {
    const fetchRentalInfo = async () => {
      if (contract && tokenId) {
        try {
          const info = await contract.rentalInfo(tokenId);
          setRentalInfo(info);
        } catch (error) {
          console.error('Error fetching rental info for form:', error);
        }
      }
    };
    fetchRentalInfo();
    const interval = setInterval(fetchRentalInfo, 5000); // Refresh data
    return () => clearInterval(interval);
  }, [contract, tokenId]);

  const handleRent = () => {
    if (duration <= 0) {
      alert('Please enter a valid duration in days.');
      return;
    }
    onRent(tokenId, duration, rentalInfo.rentPricePerDay);
  };

  if (!walletAddress || !rentalInfo || !rentalInfo.isListed || (rentalInfo.rentedUntil && Number(rentalInfo.rentedUntil) * 1000 > Date.now()) || (owner && walletAddress.toLowerCase() === owner.toLowerCase())) {
    return null; // Hide if not listed, already rented, or if user is the owner
  }

  const rentPricePerDayEth = formatEther(rentalInfo.rentPricePerDay);
  const totalCostWei = toBigInt(duration) * toBigInt(rentalInfo.rentPricePerDay);
  const totalCostEth = formatEther(totalCostWei);

  return (
    <div className="mt-6 p-4 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-4">Rent this Property</h3>
      <p>Price: <strong>{rentPricePerDayEth} ETH/day</strong></p>
      <div className="space-y-2 mt-2">
        <input 
          type="number" 
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
          placeholder="Duration in days"
          className="w-full p-2 border rounded"
        />
        <p className="font-bold">Total Cost: {totalCostEth} ETH</p>
        <button onClick={handleRent} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Rent Now
        </button>
      </div>
    </div>
  );
};

export default RentalForm;

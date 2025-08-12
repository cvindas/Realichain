import React, { useState, useEffect } from 'react';
import { formatEther } from 'ethers';

const RentalManager = ({ tokenId, contract, walletAddress, owner, onListForRent, onWithdrawRent }) => {
  const [rentPrice, setRentPrice] = useState('');
  const [rentalInfo, setRentalInfo] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState('0');

  useEffect(() => {
    const fetchRentalInfo = async () => {
      if (contract && tokenId && walletAddress) {
        try {
          const info = await contract.rentalInfo(tokenId);
          const withdrawals = await contract.pendingWithdrawals(walletAddress);
          setRentalInfo(info);
          setPendingWithdrawals(formatEther(withdrawals));
        } catch (error) {
          console.error('Error fetching rental info:', error);
        }
      }
    };
    fetchRentalInfo();
    const interval = setInterval(fetchRentalInfo, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [contract, tokenId, walletAddress]);

  const handleListForRent = () => {
    if (!rentPrice || parseFloat(rentPrice) <= 0) {
      alert('Please enter a valid rent price in ETH.');
      return;
    }
    onListForRent(tokenId, rentPrice);
  };

  const handleWithdrawRent = async () => {
    if (onWithdrawRent) {
      onWithdrawRent();
    }
  };

  if (!walletAddress || !owner || walletAddress.toLowerCase() !== owner.toLowerCase()) {
    return null; // Only owner can manage rentals
  }

  return (
    <div className="mt-6 p-4 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-4">Rental Management</h3>
      {rentalInfo && rentalInfo.isListed ? (
        <div>
          <p>Listed for rent at <strong>{formatEther(rentalInfo.rentPricePerDay)} ETH/day</strong>.</p>
          {Number(rentalInfo.rentedUntil) * 1000 > Date.now() ? (
            <p>Currently rented until: <strong>{new Date(Number(rentalInfo.rentedUntil) * 1000).toLocaleString()}</strong></p>
          ) : (
            <p className="text-green-600 font-semibold">Available for rent.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input 
            type="number" 
            value={rentPrice}
            onChange={(e) => setRentPrice(e.target.value)}
            placeholder="Rent price in ETH per day"
            className="w-full p-2 border rounded"
          />
          <button onClick={handleListForRent} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            List for Rent
          </button>
        </div>
      )}
      {parseFloat(pendingWithdrawals) > 0 && (
        <div className="mt-4">
          <p>You have <strong>{pendingWithdrawals} ETH</strong> to withdraw.</p>
          <button onClick={handleWithdrawRent} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-2">
            Withdraw Rent
          </button>
        </div>
      )}
    </div>
  );
};

export default RentalManager;

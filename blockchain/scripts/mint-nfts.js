const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Leer la dirección del contrato desde el despliegue de Ignition
  const addressFilePath = path.join(__dirname, '../ignition/deployments/chain-31337/deployed_addresses.json');
  if (!fs.existsSync(addressFilePath)) {
    console.error(`Error: Address file not found at ${addressFilePath}. Please deploy first.`);
    process.exit(1);
  }
  const addressJson = require(addressFilePath);
  const contractAddress = addressJson['DeploymentModule#RealEstate'];
  if (!contractAddress) {
    console.error('Error: Could not find contract address in deployment file.');
    process.exit(1);
  }

  const realEstate = await ethers.getContractAt("RealEstate", contractAddress);
  const [signer] = await ethers.getSigners();

  console.log(`Minteando NFTs al contrato en ${contractAddress}`);
  console.log(`Usando la cuenta: ${signer.address}`);

  // Metadatos para los NFTs de prueba
  const metadata = [
    {
      "name": "Villa de Lujo en la Costa",
      "description": "Una impresionante villa con vistas panorámicas al océano.",
      "image": "https://ipfs.io/ipfs/QmQd2yR5s5jG5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // Reemplazar con un CID de imagen real
      "attributes": [{"trait_type": "Ubicación", "value": "Costa Esmeralda"}, {"trait_type": "Habitaciones", "value": 5}]
    },
    {
      "name": "Apartamento Moderno en la Ciudad",
      "description": "Elegante apartamento en el corazón del distrito financiero.",
      "image": "https://ipfs.io/ipfs/QmZc3yR5s5jG5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // Reemplazar con un CID de imagen real
      "attributes": [{"trait_type": "Ubicación", "value": "Centro Urbano"}, {"trait_type": "Habitaciones", "value": 2}]
    },
    {
      "name": "Cabaña Rústica en el Bosque",
      "description": "Un refugio tranquilo rodeado de naturaleza.",
      "image": "https://ipfs.io/ipfs/QmYd4yR5s5jG5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // Reemplazar con un CID de imagen real
      "attributes": [{"trait_type": "Ubicación", "value": "Montañas Verdes"}, {"trait_type": "Habitaciones", "value": 3}]
    },
    {
      "name": "Penthouse con Terraza",
      "description": "Vistas de 360 grados de la ciudad desde este exclusivo penthouse.",
      "image": "https://ipfs.io/ipfs/QmXd5yR5s5jG5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // Reemplazar con un CID de imagen real
      "attributes": [{"trait_type": "Ubicación", "value": "Distrito de Lujo"}, {"trait_type": "Habitaciones", "value": 4}]
    }
  ];

  // Convertir metadatos a Data URIs
  const uris = metadata.map(meta => {
    const json = JSON.stringify(meta);
    const base64 = Buffer.from(json).toString('base64');
    return `data:application/json;base64,${base64}`;
  });

  // Mintear un NFT para cada URI
  for (let i = 0; i < uris.length; i++) {
    console.log(`Minteando propiedad ${i + 1} con URI: ${uris[i]}`);
    const tx = await realEstate.safeMint(signer.address, uris[i]);
    await tx.wait(); // Esperar a que la transacción se confirme
    console.log(`--> NFT ${i + 1} minteado exitosamente!`);
  }

  console.log("\nTodos los NFTs de prueba han sido minteados.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
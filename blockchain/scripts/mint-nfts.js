const { ethers } = require("hardhat");
// Importamos la dirección desde nuestro archivo de configuración centralizado
const { address } = require("./contract-address.json");

async function main() {
  const contractAddress = address;
  if (!contractAddress) {
    console.error("Dirección del contrato no encontrada. Por favor, ejecuta `npx hardhat run scripts/sync-address.js` primero.");
    process.exit(1);
  }

  const realEstate = await ethers.getContractAt("RealEstate", contractAddress);
  const [signer] = await ethers.getSigners();

  console.log(`Minteando NFTs al contrato en ${contractAddress}`);
  console.log(`Usando la cuenta: ${signer.address}`);

  // URIs de metadatos apuntando al servidor de desarrollo local
  const BASE_URL = "http://localhost:3000/metadata/";
  const uris = [
    `${BASE_URL}1.json`,
    `${BASE_URL}2.json`,
    `${BASE_URL}3.json`,
    `${BASE_URL}4.json`
  ];

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
});
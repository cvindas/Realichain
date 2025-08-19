const { ethers, ignition } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Verificando el despliegue del contrato RealEstate...");

  // Leer la dirección del contrato desde el archivo de despliegue generado por Ignition
  const addressFilePath = path.join(__dirname, '../ignition/deployments/chain-31337/deployed_addresses.json');
  if (!fs.existsSync(addressFilePath)) {
    console.error(`Error: Archivo de despliegue no encontrado en ${addressFilePath}.`);
    console.error("Por favor, ejecuta el despliegue primero con 'npx hardhat ignition deploy'.");
    process.exit(1);
  }

  const addressJson = JSON.parse(fs.readFileSync(addressFilePath));
  const contractAddress = addressJson['DeploymentModule#RealEstate'];

  if (!contractAddress) {
    console.error("Error: No se pudo obtener la dirección del contrato desplegado.");
    console.error("Asegúrate de que el contrato esté desplegado y el módulo de Ignition sea correcto.");
    process.exit(1);
  }

  console.log(`Dirección del contrato 'RealEstate' desplegado: ${contractAddress}`);

  // Conectarse al contrato desplegado
  const realEstate = await ethers.getContractAt("RealEstate", contractAddress);

  try {
    // Verificar el suministro total de NFTs
    const totalSupply = await realEstate.totalSupply();
    console.log(`Suministro total de NFTs (totalSupply): ${totalSupply.toString()}`);

    if (totalSupply > 0) {
      console.log("\nListando URIs de los tokens minteados:");
      for (let i = 0; i < totalSupply; i++) {
        const tokenId = await realEstate.tokenByIndex(i);
        const tokenURI = await realEstate.tokenURI(tokenId);
        console.log(`  - Token ID ${tokenId.toString()}: ${tokenURI}`);
      }
    } else {
      console.log("No hay NFTs minteados en este contrato.");
    }

  } catch (error) {
    console.error("\nError al interactuar con el contrato:", error.message);
    console.log("Esto puede indicar que el ABI es incorrecto o hay un problema con la red.");
  }
  
  // Comparar con la dirección que usa el frontend
  const frontendContractPath = path.join(__dirname, '../../real-estate-dapp/src/contracts/RealEstate.json');
  if (fs.existsSync(frontendContractPath)) {
      const frontendContractData = JSON.parse(fs.readFileSync(frontendContractPath, 'utf8'));
      console.log(`\nDirección en el frontend: ${frontendContractData.address}`);
      if (frontendContractData.address.toLowerCase() === contractAddress.toLowerCase()) {
          console.log("✅ Las direcciones coinciden.");
      } else {
          console.log("❌ ¡ALERTA! Las direcciones NO coinciden. Ejecuta 'npm run sync-abi'.");
      }
  } else {
      console.log("\nNo se encontró el archivo de contrato del frontend. Ejecuta 'npm run sync-abi'.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

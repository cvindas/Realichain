const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Syncing contract address and ABI...');

  // 1. Leer la dirección del contrato desde el despliegue de Ignition
  const addressFilePath = path.join(__dirname, '../ignition/deployments/chain-31337/deployed_addresses.json');
  if (!fs.existsSync(addressFilePath)) {
    console.error(`Error: Address file not found at ${addressFilePath}. Please deploy first.`);
    process.exit(1);
  }
  const addressJson = require(addressFilePath);
  const contractAddress = addressJson['DeploymentModule#RealEstate']; // Corregido aquí
  if (!contractAddress) {
    console.error('Error: Could not find contract address in deployment file.');
    process.exit(1);
  }

  // 2. Leer el ABI desde el artefacto de compilación
  const abiFilePath = path.join(__dirname, '../artifacts/contracts/RealEstate.sol/RealEstate.json');
  if (!fs.existsSync(abiFilePath)) {
    console.error(`Error: ABI file not found at ${abiFilePath}. Please compile first.`);
    process.exit(1);
  }
  const abiJson = require(abiFilePath);
  const contractAbi = abiJson.abi;

  // 3. Crear el objeto de contrato consolidado
  const contractData = {
    address: contractAddress,
    abi: contractAbi,
  };

  // 4. Escribir el archivo en la ubicación correcta del frontend
  const destinationPath = path.join(__dirname, '../../real-estate-dapp/src/contracts/RealEstate.json');
  fs.writeFileSync(destinationPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract data synced successfully to: ${destinationPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

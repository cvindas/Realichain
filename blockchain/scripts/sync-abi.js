const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Syncing contract ABI...');

  // Ruta al artefacto de compilación del contrato
  const sourceAbiPath = path.join(
    __dirname,
    '../artifacts/contracts/RealEstate.sol/RealEstate.json'
  );

  if (!fs.existsSync(sourceAbiPath)) {
    console.error('Error: Source ABI file not found.');
    console.error(`Looked for file at: ${sourceAbiPath}`);
    console.error('Please compile the contract first using \`npx hardhat compile\`.');
    process.exit(1);
  }

  // Ruta de destino en el frontend
  const destinationAbiPath = path.join(
    __dirname,
    '../../real-estate-dapp/src/RealEstate.json'
  );

  // Leer el artefacto, extraer el ABI y escribirlo en el destino
  const sourceArtifact = require(sourceAbiPath);
  const abi = sourceArtifact.abi;

  // Escribir un objeto que contenga solo el ABI en el archivo de destino
  fs.writeFileSync(
    destinationAbiPath,
    JSON.stringify({ abi: abi }, null, 2)
  );

  console.log(`ABI synced successfully to: ${destinationAbiPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

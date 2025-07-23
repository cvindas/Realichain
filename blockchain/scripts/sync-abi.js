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

  fs.copyFileSync(sourceAbiPath, destinationAbiPath);

  console.log(`ABI synced successfully to: ${destinationAbiPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

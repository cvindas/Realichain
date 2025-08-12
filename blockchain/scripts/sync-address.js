const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Syncing contract address...');

  // Ruta al archivo de despliegue de Ignition
  const deploymentDetailsPath = path.join(
    __dirname,
    '../ignition/deployments/chain-31337/deployed_addresses.json'
  );

  if (!fs.existsSync(deploymentDetailsPath)) {
    console.error('Error: Deployment address file not found.');
    console.error(`Looked for file at: ${deploymentDetailsPath}`);
    console.error('Please run a deployment first using \`npx hardhat ignition deploy\`.');
    process.exit(1);
  }

  const deploymentDetails = require(deploymentDetailsPath);
  const contractAddress = deploymentDetails['RealEstateModule#RealEstate'];

  if (!contractAddress) {
    console.error('Error: Could not find contract address in deployment file.');
    console.error('Please ensure \`RealEstateModule#RealEstate\` exists in the deployment file.');
    process.exit(1);
  }

  console.log(`Found contract address: ${contractAddress}`);

  // --- Sincronizar con el Frontend ---
  const frontendConfigPath = path.join(
    __dirname,
    '../../real-estate-dapp/src/contract-address.json'
  );
  const frontendConfig = { address: contractAddress };
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log(`Frontend address synced at: ${frontendConfigPath}`);

  // --- Sincronizar con los Scripts del Backend ---
  const backendConfigPath = path.join(
    __dirname,
    './contract-address.json'
  );
  const backendConfig = { address: contractAddress };
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
  console.log(`Backend script address synced at: ${backendConfigPath}`);

  console.log('Address synchronization complete!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

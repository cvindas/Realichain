const fs = require('fs');
const path = require('path');

async function main() {
  console.log('--- Sincronizando archivos de contratos ---');

  // --- Paths ---
  const backendRoot = path.resolve(__dirname, '..');
  const frontendRoot = path.resolve(backendRoot, '..', 'real-estate-dapp');
  const frontendContractsDir = path.resolve(frontendRoot, 'src', 'contracts');
  const deploymentInfoDir = path.resolve(backendRoot, 'ignition', 'deployments', 'chain-31337');

  // --- Source Files ---
  const deployedAddressesPath = path.resolve(deploymentInfoDir, 'deployed_addresses.json');
  const realEstateArtifactPath = path.resolve(backendRoot, 'artifacts', 'contracts', 'RealEstate.sol', 'RealEstate.json');
  const daoArtifactPath = path.resolve(backendRoot, 'artifacts', 'contracts', 'DAO.sol', 'DAO.json');

  // --- Check if source files exist ---
  if (!fs.existsSync(deployedAddressesPath)) {
    console.error(`Error: No se encontró el archivo de direcciones desplegadas en ${deployedAddressesPath}`);
    console.error('Por favor, asegúrate de que los contratos se hayan desplegado correctamente con `npx hardhat ignition deploy`.');
    process.exit(1);
  }
   if (!fs.existsSync(realEstateArtifactPath) || !fs.existsSync(daoArtifactPath)) {
    console.error('Error: No se encontraron los artefactos de los contratos.');
    console.error('Por favor, asegúrate de que los contratos se hayan compilado correctamente con `npx hardhat compile`.');
    process.exit(1);
  }

  // --- Read data ---
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
  const realEstateArtifact = JSON.parse(fs.readFileSync(realEstateArtifactPath, 'utf8'));
  const daoArtifact = JSON.parse(fs.readFileSync(daoArtifactPath, 'utf8'));

  // --- Get addresses ---
  const realEstateAddress = deployedAddresses['DeploymentModule#RealEstate'];
  const daoAddress = deployedAddresses['DeploymentModule#DAO'];

  if (!realEstateAddress || !daoAddress) {
      console.error('Error: No se pudieron encontrar las direcciones de los contratos en el archivo de despliegue.');
      console.error(`Contenido leído: ${JSON.stringify(deployedAddresses)}`);
      process.exit(1);
  }

  // --- Create destination directory if it doesn't exist ---
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // --- Create combined JSON objects ---
  const realEstateContractData = {
    address: realEstateAddress,
    abi: realEstateArtifact.abi
  };

  const daoContractData = {
    address: daoAddress,
    abi: daoArtifact.abi
  };

  // --- Write files to frontend ---
  fs.writeFileSync(
    path.resolve(frontendContractsDir, 'RealEstate.json'),
    JSON.stringify(realEstateContractData, null, 2)
  );
  console.log('RealEstate.json sincronizado en el frontend.');

  fs.writeFileSync(
    path.resolve(frontendContractsDir, 'DAO.json'),
    JSON.stringify(daoContractData, null, 2)
  );
  console.log('DAO.json sincronizado en el frontend.');

  console.log('--- Sincronización completada con éxito ---');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

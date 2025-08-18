// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Función para guardar la dirección y el ABI de un contrato en el frontend
// Función para guardar la dirección, el ABI y el bytecode de un contrato
function saveFrontendFiles(contractName, contractAddress, artifact) {
  const contractsDir = path.join(__dirname, "..", "..", "real-estate-dapp", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Guardar la dirección en contract-addresses.json
  const addressesFilePath = path.join(contractsDir, "contract-addresses.json");
  let addresses = {};
  if (fs.existsSync(addressesFilePath)) {
    try {
      addresses = JSON.parse(fs.readFileSync(addressesFilePath));
    } catch (e) {
      console.error("Error al parsear contract-addresses.json, se sobreescribirá.");
    }
  }
  addresses[contractName] = contractAddress;
  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));

  // Guardar el ABI y el bytecode en un archivo separado (ej: RealEstate.json)
  fs.writeFileSync(
    path.join(contractsDir, `${contractName}.json`),
    JSON.stringify(artifact, null, 2)
  );
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar RealEstate
  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy(deployer.address);
  await realEstate.waitForDeployment();
  const realEstateAddress = await realEstate.getAddress();
  console.log("Contrato RealEstate desplegado en:", realEstateAddress);

  // Desplegar DAO
  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(realEstateAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("Contrato DAO desplegado en:", daoAddress);

  // Leer artefactos de los contratos
  const realEstateArtifact = await hre.artifacts.readArtifact("RealEstate");
  const daoArtifact = await hre.artifacts.readArtifact("DAO");
  const fractionArtifact = await hre.artifacts.readArtifact("Fraction");

  // Guardar archivos para el frontend
  saveFrontendFiles("RealEstate", realEstateAddress, realEstateArtifact);
  saveFrontendFiles("DAO", daoAddress, daoArtifact);
  // El contrato Fraction no se despliega aquí, pero necesitamos su artefacto completo en el frontend.
  // Guardamos su artefacto pero dejamos la dirección vacía.
  saveFrontendFiles("Fraction", "", fractionArtifact);

  console.log("Archivos de contratos (direcciones y ABIs) guardados en real-estate-dapp/src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

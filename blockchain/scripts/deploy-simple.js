async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar RealEstate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy(deployer.address);
  await realEstate.waitForDeployment();
  const realEstateAddress = await realEstate.getAddress();
  console.log("Contrato RealEstate desplegado en:", realEstateAddress);

  // Desplegar DAO
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(realEstateAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("Contrato DAO desplegado en:", daoAddress);

  // Guardar direcciones para el frontend
  const fs = require('fs');
  const path = require('path');
  const contractsDir = path.join(__dirname, '..', '..', 'real-estate-dapp', 'src', 'contracts');

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, 'contract-addresses.json'),
    JSON.stringify({ RealEstate: realEstateAddress, DAO: daoAddress }, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

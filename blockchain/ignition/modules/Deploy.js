const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeploymentModule", (m) => {
  // 1. Desplegar el contrato RealEstate
  const initialOwner = m.getAccount(0);
  const realEstate = m.contract("RealEstate", [initialOwner]);

  // 2. Desplegar el contrato DAO, pasándole la dirección de RealEstate
  const dao = m.contract("DAO", [realEstate]);

  // 3. Retornar ambos contratos desplegados
  return { realEstate, dao };
});

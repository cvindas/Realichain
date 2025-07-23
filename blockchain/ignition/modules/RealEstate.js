const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RealEstateModule", (m) => {
  // El constructor de nuestro contrato RealEstate.sol necesita un `initialOwner`.
  // Usaremos la primera cuenta que nos provee Hardhat como propietario.
  const initialOwner = m.getAccount(0);

  // Desplegamos el contrato, pasándole el propietario inicial.
  const realEstate = m.contract("RealEstate", [initialOwner]);

  // Retornamos el contrato desplegado para poder interactuar con él.
  return { realEstate };
});

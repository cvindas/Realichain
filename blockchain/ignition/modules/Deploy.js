const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RealEstateModule", (m) => {
  // Get the first account from Hardhat's accounts as the owner
  const initialOwner = m.getAccount(0);

  // Deploy the RealEstate contract
  const realEstate = m.contract("RealEstate", [initialOwner]);

  return { realEstate };
});

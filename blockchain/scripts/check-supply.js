const hre = require("hardhat");
// Importamos la dirección del contrato desde el archivo que ya tenemos
const contractAddressData = require("./contract-address.json");

async function main() {
  const contractAddress = contractAddressData.address;
  console.log(`Verificando totalSupply() en el contrato: ${contractAddress}`);

  // Obtenemos una instancia del contrato ya desplegado
  const realEstate = await hre.ethers.getContractAt("RealEstate", contractAddress);

  try {
    const totalSupply = await realEstate.totalSupply();
    console.log(`✅ ¡Éxito! El suministro total es: ${totalSupply.toString()}`);
    console.log("Esto confirma que el contrato y el nodo de Hardhat funcionan correctamente.");
  } catch (error) {
    console.error("❌ Error al llamar a totalSupply():");
    console.error(error);
    console.log("\nEsto confirma que el problema está en el nodo de Hardhat o en el contrato mismo.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

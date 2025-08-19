async function main() {
  try {
    console.log('Iniciando script de verificacion...');
    const blockNum = await ethers.provider.getBlockNumber();
    console.log('Numero de bloque actual:', blockNum);

    const [signer] = await ethers.getSigners();
    console.log('Direccion del firmante:', signer.address);
    console.log('Verificacion de conexion exitosa!');
  } catch (error) {
    console.error('Fallo la verificacion de conexion:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

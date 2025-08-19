const fs = require('fs');
const path = require('path');

function updateContractAddresses() {
    console.log('Iniciando la actualización de direcciones de contratos para el frontend...');

    // 1. Definir rutas de archivos
    const deploymentsDir = path.join(__dirname, '..', 'ignition', 'deployments');
    const frontendContractsDir = path.join(__dirname, '..', '..', 'real-estate-dapp', 'src', 'contracts');
    const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');

    // Buscar la carpeta de despliegue más reciente (ej. chain-31337)
    let deploymentPath = '';
    if (fs.existsSync(deploymentsDir)) {
        const chainDirs = fs.readdirSync(deploymentsDir).filter(f => f.startsWith('chain-'));
        if (chainDirs.length > 0) {
            // Ordenar por si hay múltiples y coger la última
            chainDirs.sort();
            deploymentPath = path.join(deploymentsDir, chainDirs[chainDirs.length - 1]);
        }
    }

    if (!deploymentPath || !fs.existsSync(deploymentPath)) {
        console.error('Error: No se encontró una carpeta de despliegue de Ignition (ej. chain-31337).');
        console.error('Asegúrate de haber desplegado los contratos con `npx hardhat ignition deploy`');
        return;
    }

    const deployedAddressesPath = path.join(deploymentPath, 'deployed_addresses.json');

    if (!fs.existsSync(deployedAddressesPath)) {
        console.error(`Error: El archivo 'deployed_addresses.json' no se encontró en ${deploymentPath}`);
        return;
    }

    // 2. Leer las direcciones desplegadas
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
    console.log('Direcciones desplegadas leídas:', deployedAddresses);

    // 3. Iterar sobre los artefactos, actualizarlos y copiarlos
    fs.readdirSync(artifactsDir).forEach(contractDir => {
        if (!contractDir.endsWith('.sol')) return;

        const contractName = contractDir.replace('.sol', '');
        const contractsToUpdate = ['DAO', 'Lock', 'RealEstate', 'Fraction'];
        if (!contractsToUpdate.includes(contractName)) return;

        const artifactPath = path.join(artifactsDir, contractDir, `${contractName}.json`);
        const frontendArtifactPath = path.join(frontendContractsDir, `${contractName}.json`);

        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            const contractKey = Object.keys(deployedAddresses).find(k => k.endsWith(`#${contractName}`));

            // Siempre copia el archivo base
            fs.copyFileSync(artifactPath, frontendArtifactPath);

            // Si hay una dirección, la añade
            if (contractKey) {
                const contractAddress = deployedAddresses[contractKey];
                const frontendArtifact = JSON.parse(fs.readFileSync(frontendArtifactPath, 'utf8'));
                
                if (!frontendArtifact.networks) {
                    frontendArtifact.networks = {};
                }
                frontendArtifact.networks['31337'] = {
                    address: contractAddress
                };

                fs.writeFileSync(frontendArtifactPath, JSON.stringify(frontendArtifact, null, 2));
                console.log(`✅ Archivo actualizado con dirección en: ${frontendArtifactPath}`);
            } else {
                console.log(`✅ Archivo copiado (sin dirección) en: ${frontendArtifactPath}`);
            }
        } else {
            console.warn(`- No se encontró el artefacto para ${contractName}. Saltando...`);
        }
    });

    console.log('\n✨ Actualización del frontend completada. ✨');
}

updateContractAddresses();

const fs = require('fs');
const path = require('path');

function syncContracts() {
    console.log('--- Sincronizando archivos de contratos ---');

    const frontendPath = path.resolve(__dirname, '..', '..', 'real-estate-dapp', 'src', 'contracts');
    const artifactsPath = path.resolve(__dirname, '..', 'artifacts', 'contracts');
    const ignitionDeploymentsPath = path.resolve(__dirname, '..', 'ignition', 'deployments');

    // Asegurarse de que el directorio de destino exista
    if (!fs.existsSync(frontendPath)) {
        fs.mkdirSync(frontendPath, { recursive: true });
    }

    // 1. Sincronizar ABIs
    const realEstateArtifact = require(path.join(artifactsPath, 'RealEstate.sol', 'RealEstate.json'));
    const daoArtifact = require(path.join(artifactsPath, 'DAO.sol', 'DAO.json'));

    fs.writeFileSync(
        path.join(frontendPath, 'RealEstate.json'),
        JSON.stringify(realEstateArtifact.abi, null, 2)
    );
    console.log('ABI de RealEstate sincronizado.');

    fs.writeFileSync(
        path.join(frontendPath, 'DAO.json'),
        JSON.stringify(daoArtifact.abi, null, 2)
    );
    console.log('ABI de DAO sincronizado.');

    // 2. Sincronizar Direcciones
    // Encontrar el último despliegue de ignition
    const chainIdDirs = fs.readdirSync(ignitionDeploymentsPath).filter(f => f.startsWith('chain-'));
    if (chainIdDirs.length === 0) {
        console.error('No se encontraron directorios de despliegue de Ignition.');
        return;
    }
    // Ordenar para obtener el más reciente si hay varios
    const latestChainDir = chainIdDirs.sort().pop();
    const deploymentJournal = path.join(ignitionDeploymentsPath, latestChainDir, 'journal.jsonl');

    if (!fs.existsSync(deploymentJournal)) {
        console.error(`No se encontró el journal de despliegue en ${deploymentJournal}`);
        return;
    }

    const journalLines = fs.readFileSync(deploymentJournal, 'utf-8').split('\n').filter(Boolean);
    const deployedContracts = {};

    journalLines.forEach(line => {
        try {
            const entry = JSON.parse(line);
            if (entry.type === 'execution-state-complete' && entry.payload.result.type === 'SUCCESS') {
                const { futureId, contract } = entry.payload.result.value;
                const contractName = futureId.split('#')[1];
                if (contractName === 'RealEstate' || contractName === 'DAO') {
                    deployedContracts[contractName] = contract.address;
                }
            }
        } catch (e) {
            // Ignorar líneas que no son JSON válido
        }
    });

    if (!deployedContracts.RealEstate || !deployedContracts.DAO) {
        console.error('No se pudieron encontrar las direcciones de ambos contratos en el journal.');
        console.log('Encontrado:', deployedContracts);
        return;
    }

    const addresses = {
        realEstate: deployedContracts.RealEstate,
        dao: deployedContracts.DAO
    };

    fs.writeFileSync(
        path.join(frontendPath, 'contract-addresses.json'),
        JSON.stringify(addresses, null, 2)
    );

    console.log('Direcciones de contratos sincronizadas:', addresses);
    console.log('--- Sincronización completada ---');
}

syncContracts();

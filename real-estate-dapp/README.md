# DApp de Bienes Raíces - Realichain

Esta es una aplicación descentralizada (dApp) para la tokenización y el comercio de bienes raíces, construida sobre la blockchain de Ethereum utilizando Hardhat y React.

## Flujo de Trabajo para Iniciar la Aplicación

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo local.

### 1. Prerrequisitos

Asegúrate de tener instalados los siguientes programas:
- [Node.js](https://nodejs.org/) (versión 16 o superior)
- `npm` (generalmente se instala con Node.js)
- Una wallet de navegador como [MetaMask](https://metamask.io/)

### 2. Configuración del Proyecto

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/cvindas/Realichain.git
    cd Realichain
    ```

2.  **Instala las dependencias del Backend (Blockchain):**
    ```bash
    cd blockchain
    npm install
    ```

3.  **Instala las dependencias del Frontend (React):**
    ```bash
    cd ../real-estate-dapp
    npm install
    ```

### 3. Iniciar el Backend (Blockchain)

Abre **dos terminales separadas** dentro del directorio `Realichain/blockchain`.

1.  **Terminal 1: Inicia el nodo local de Hardhat:**
    ```bash
    npx hardhat node
    ```
    Esto iniciará una blockchain local y te mostrará una lista de 20 cuentas de prueba con sus claves privadas. **Mantén esta terminal abierta.**

2.  **Terminal 2: Despliega el contrato inteligente:**
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    Este comando compilará y desplegará el contrato `RealEstate.sol` en tu nodo local. Después del despliegue, también sincronizará automáticamente el ABI y la dirección del contrato con la aplicación de React.

3.  **(Opcional pero recomendado) Poblar con propiedades:**
    Para tener propiedades con las que interactuar desde el principio, ejecuta el script de acuñación:
    ```bash
    npx hardhat run scripts/mint-properties.js --network localhost
    ```

### 4. Iniciar el Frontend (React)

Abre una **tercera terminal** en el directorio `Realichain/real-estate-dapp`.

1.  **Inicia el servidor de desarrollo de React:**
    ```bash
    npm start
    ```
    Esto abrirá automáticamente la aplicación en tu navegador en `http://localhost:3000`.

### 5. Configuración de MetaMask

1.  **Añade la red local de Hardhat:**
    - Abre MetaMask y haz clic en el selector de redes.
    - Selecciona "Añadir red" y luego "Añadir una red manualmente".
    - Rellena los siguientes datos:
        - **Nombre de la red:** Hardhat Local
        - **Nueva URL de RPC:** `http://127.0.0.1:8545`
        - **ID de cadena:** `31337`
        - **Símbolo de moneda:** ETH

2.  **Importa una cuenta con fondos:**
    - En la terminal donde iniciaste el nodo de Hardhat (Terminal 1), copia una de las claves privadas de las cuentas de prueba.
    - En MetaMask, haz clic en el icono de tu perfil y selecciona "Importar cuenta".
    - Pega la clave privada y haz clic en "Importar".

¡Y listo! Tu dApp está completamente configurada y funcionando. Ahora puedes interactuar con ella como un usuario normal.

## Características

- **Integración con Blockchain:** Conexión real con una blockchain local de Hardhat a través de MetaMask.
- **Tokenización de Propiedades (NFTs):** Cada propiedad es un NFT único en la blockchain.
- **Propiedad Fraccionada:** Permite a los usuarios comprar y poseer fracciones de propiedades.
- **Sistema de Ofertas:** Los usuarios pueden hacer ofertas por propiedades.
- **Portafolio de Usuario:** Muestra las inversiones, ofertas activas y el historial de compras del usuario.
- **Panel de DAO:** Incluye un módulo interactivo para propuestas de gobernanza.
- **Interfaz Moderna:** Diseño limpio y profesional con React y Tailwind CSS.

## Tecnologías Utilizadas

- **Frontend:** React, Ethers.js, Tailwind CSS
- **Backend (Blockchain):** Hardhat, Solidity, OpenZeppelin
- **Entorno de Desarrollo:** Node.js, npm

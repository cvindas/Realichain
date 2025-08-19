require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// --- Pinata API Keys ---
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;

if (!pinataApiKey || !pinataSecretApiKey) {
    console.error('Error: Las claves de API de Pinata no están configuradas.');
    console.error('Por favor, crea un archivo .env en la raíz y añade PINATA_API_KEY y PINATA_API_SECRET.');
    process.exit(1);
}

// --- Routes ---
app.post('/pinata-upload', upload.single('file'), async (req, res) => {
    try {
        const formData = new FormData();
        
        if (req.file) {
            // Handle file upload
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname
            });
        } else if (req.body) {
            // Handle metadata JSON upload
            const jsonBody = JSON.stringify(req.body);
            formData.append('file', Buffer.from(jsonBody), {
                filename: 'metadata.json'
            });
        }

        const pinataMetadata = JSON.stringify({
            name: req.file ? req.file.originalname : 'metadata.json',
        });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', pinataOptions);

        const result = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
        });

        res.status(200).json({ ipfsHash: result.data.IpfsHash });

    } catch (error) {
        console.error('Error al subir a Pinata:', error.response ? error.response.data : error.message);
        res.status(500).send('Error al subir el archivo a Pinata.');
    }
});

app.listen(port, () => {
    console.log(`Servidor de Pinata escuchando en http://localhost:${port}`);
});

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Set up multer storage with dynamic destination
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.body.folder || '';
        const uploadPath = path.join(__dirname, 'uploads', folder);

        // Ensure the folder exists
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper function to get folder structure
const getFolderStructure = (dirPath) => {
    const result = [];
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        // Ignore hidden files
        if (file.startsWith('.')) {
            return;
        }

        const filePath = path.join(dirPath, file);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            // Recursively get files in subdirectories
            const subDirFiles = getFolderStructure(filePath);
            result.push(...subDirFiles.map(subFile => path.join(file, subFile)));
        } else {
            result.push(file);
        }
    });

    return result;
};

// Endpoint to list folders and files in a folder structure
app.get('/folder-structure', (req, res) => {
    try {
        const folderStructure = getFolderStructure(path.join(__dirname, 'uploads'));
        res.json(folderStructure);
    } catch (err) {
        console.error('Error listing folder structure:', err);
        res.status(500).json({ error: 'Unable to list folder structure' });
    }
});

// Endpoint to list files
app.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
        if (err) {
            console.error('Error listing files:', err);
            return res.status(500).json({ error: 'Unable to list files' });
        }
        res.json(files);
    });
});

// Endpoint to upload files with folder support
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', file: req.file });
});

// Endpoint to download a file
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath, err => {
        if (err) {
            console.error('Error downloading file:', err);
            return res.status(404).json({ error: 'File not found' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
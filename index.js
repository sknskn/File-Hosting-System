const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

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

// Endpoint to download all files in the upload folder as a zip
app.get('/download-all', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    const zipFilePath = path.join(__dirname, 'uploads.zip');

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function() {
        res.download(zipFilePath, 'uploads.zip', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
            // Delete the zip file after sending it
            fs.unlinkSync(zipFilePath);
        });
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);
    archive.directory(uploadDir, false);
    archive.finalize();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
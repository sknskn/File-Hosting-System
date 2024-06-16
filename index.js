const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware to exclude hidden folders
const excludeHiddenFolders = (req, res, next) => {
  req.includeHidden = false;
  next();
};

// Helper function to recursively get files in directories, excluding hidden folders
const getFilesRecursively = (directoryPath) => {
    let files = [];
    fs.readdirSync(directoryPath).forEach(file => {
        const fullPath = path.join(directoryPath, file);
        if (fs.lstatSync(fullPath).isDirectory() && !file.startsWith('.')) {
            files = files.concat(getFilesRecursively(fullPath));
        } else if (!file.startsWith('.')) {
            files.push(fullPath);
        }
    });
    return files;
};

// Download endpoint to list all files in folders excluding hidden folders
app.get('/files', excludeHiddenFolders, (req, res) => {
    const directoryPath = path.join(__dirname, 'uploads');
    const files = getFilesRecursively(directoryPath).map(file => path.relative(directoryPath, file));
    res.json(files);
});

// Endpoint to download a specific file
app.get('/files/*', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params[0]);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const express = require('express');
const path = require('path');
const fs = require('fs');
const pdfFolder = path.join(__dirname, 'pdf');
const { MongoClient } = require('mongodb');
const router = express.Router();

// Połączenie z bazą danych
const CONNECTION_STRING = process.env.CONNECTION_STRING;
const client = new MongoClient(CONNECTION_STRING);

let db;
let usersCollection;

async function connectToDatabase() {
    await client.connect();
    db = client.db('audit_restauracji');
    usersCollection = db.collection('uzytkownicy');
}

connectToDatabase();

// Middleware do sprawdzania autentykacji
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect('/admin/login');
    }
}

router.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html'); // Zmieniono ścieżkę
    res.sendFile(loginPath);
});

// Logika logowania
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Wyszukaj użytkownika w bazie danych
    const user = await usersCollection.findOne({ username });

    if (user && password === user.password) {
        // Ustaw sesję dla zalogowanego użytkownika
        req.session.userId = user._id;
        res.redirect('/admin/dashboard');
    } else {
        res.status(401).send('Nieprawidłowa nazwa użytkownika lub hasło1');
    }
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
}); 

router.get('/api/pdf-list', ensureAuthenticated, (req, res) => {
    fs.readdir(pdfFolder, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Nie można odczytać folderu PDF' });
        }

        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        res.json(pdfFiles);
    });
});

router.get('/pdf/:filename', ensureAuthenticated, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'pdf', filename);
    res.sendFile(filePath);
});

module.exports = router;

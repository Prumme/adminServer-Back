const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');

const app = express();
const port = 3000;

var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'postgres',     // Remplacez par votre nom d'utilisateur PostgreSQL
  host: 'localhost',
  database: 'postgres',  // Remplacez par le nom de votre base de données
  password: 'postgres',     // Remplacez par votre mot de passe PostgreSQL
  port: 5432,
});


pool.query(`
  CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`, (err, res) => {
  if (err) {
    console.error('Erreur lors de la création de la table', err.stack);
  } else {
    console.log('Table créée ou déjà existante');
  }
});

// TRUNCATE USERS
pool.query('TRUNCATE Users', (error, results) => {
  if (error) {
    console.error('Erreur lors de la suppression', error.stack);
  } else {
    // Create a user
    pool.query('INSERT INTO Users (name, email) VALUES ($1, $2)', ['John Doe', 'johndoe@mail.fr'], (error, results) => {
      if (error) {
        console.error('Erreur lors de l\'insertion', error.stack);
      } else {
        console.log('Utilisateur inséré');
      }
    });
  }
});

// CRUD routes

// Créer un nouvel utilisateur
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  pool.query(
    'INSERT INTO Users (name, email) VALUES ($1, $2) RETURNING id',
    [name, email],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(201).json({ id: results.rows[0].id });
    }
  );
});

// Récupérer les utilisateurs
app.get('/users', (req, res) => {
  pool.query('SELECT * FROM Users', (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results.rows);
  });
});

// Lire un utilisateur par ID
app.get('/users/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM Users WHERE id = $1', [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results.rows[0]);
  });
});

// Mettre à jour un utilisateur par ID
app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const { name, email } = req.body;
  pool.query(
    'UPDATE Users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ updatedID: id });
    }
  );
});

// Supprimer un utilisateur par ID
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM Users WHERE id = $1', [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ deletedID: id });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
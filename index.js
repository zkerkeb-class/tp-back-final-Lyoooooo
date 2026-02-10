
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Load pokemons data
const pokemonsPath = path.join(__dirname, 'data', 'pokemons.json');
let pokemons = JSON.parse(fs.readFileSync(pokemonsPath, 'utf8'));

// Helper function to save pokemons to file
const savePokemonsToFile = () => {
  fs.writeFileSync(pokemonsPath, JSON.stringify(pokemons, null, 2));
};

// GET all pokemons with pagination (20 per page)
app.get('/api/pokemons', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedPokemons = pokemons.slice(startIndex, endIndex);
  const totalPages = Math.ceil(pokemons.length / limit);

  res.json({
    data: paginatedPokemons,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalCount: pokemons.length,
      limit: limit
    }
  });
});

// GET a single pokemon by name (search)
app.get('/api/pokemons/search/:name', (req, res) => {
  const { name } = req.params;
  const pokemon = pokemons.find(p => 
    p.name.english.toLowerCase() === name.toLowerCase() ||
    p.name.french.toLowerCase() === name.toLowerCase()
  );

  if (!pokemon) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  res.json(pokemon);
});

// GET a single pokemon by id
app.get('/api/pokemons/:id', (req, res) => {
  const { id } = req.params;
  const pokemon = pokemons.find(p => p.id === parseInt(id));

  if (!pokemon) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  res.json(pokemon);
});

// POST create a new pokemon
app.post('/api/pokemons', (req, res) => {
  const { name, type, base, image } = req.body;

  // Validation
  if (!name || !name.english || !type || !base) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate new id
  const newId = Math.max(...pokemons.map(p => p.id)) + 1;

  const newPokemon = {
    id: newId,
    name: {
      english: name.english,
      japanese: name.japanese || '',
      chinese: name.chinese || '',
      french: name.french || name.english
    },
    type: Array.isArray(type) ? type : [type],
    base: base,
    image: image || `http://localhost:3000/assets/pokemons/${newId}.png`
  };

  pokemons.push(newPokemon);
  savePokemonsToFile();

  res.status(201).json(newPokemon);
});

// UPDATE a pokemon
app.put('/api/pokemons/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const pokemonIndex = pokemons.findIndex(p => p.id === parseInt(id));

  if (pokemonIndex === -1) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  const updatedPokemon = {
    ...pokemons[pokemonIndex],
    ...updateData,
    id: parseInt(id) // Ensure id doesn't change
  };

  pokemons[pokemonIndex] = updatedPokemon;
  savePokemonsToFile();

  res.json(updatedPokemon);
});

// DELETE a pokemon
app.delete('/api/pokemons/:id', (req, res) => {
  const { id } = req.params;

  const pokemonIndex = pokemons.findIndex(p => p.id === parseInt(id));

  if (pokemonIndex === -1) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  const deletedPokemon = pokemons[pokemonIndex];
  pokemons.splice(pokemonIndex, 1);
  savePokemonsToFile();

  res.json({ message: 'Pokemon deleted', pokemon: deletedPokemon });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Pokemon API Server', version: '1.0.0' });
});

console.log('Server is set up. Ready to start listening on a port.');

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
  console.log('API endpoints:');
  console.log('  GET  /api/pokemons - Get all pokemons (with pagination)');
  console.log('  GET  /api/pokemons/search/:name - Search pokemon by name');
  console.log('  GET  /api/pokemons/:id - Get pokemon by id');
  console.log('  POST /api/pokemons - Create new pokemon');
  console.log('  PUT  /api/pokemons/:id - Update pokemon');
  console.log('  DELETE /api/pokemons/:id - Delete pokemon');
});
const { respondJSON, respondHead, respondNotFound } = require('./utils');

const pokemonData = [];

// filter pokemon by query
const filterPokemon = (query) => {
  let filtered = [...pokemonData];
  const { type, weakness } = query || {};

  if (type) {
    filtered = filtered.filter((p) => p.type.some((t) => t.toLowerCase() === type.toLowerCase()));
  }

  if (weakness) {
    filtered = filtered.filter((p) => p.weaknesses.some(
      (w) => w.toLowerCase() === weakness.toLowerCase(),
    ));
  }

  return filtered;
};

// GET /pokemon
const getPokemon = (request, response, query) => {
  if (request.method === 'HEAD') {
    respondHead(response, 200);
    return;
  }

  if (request.method !== 'GET') {
    respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
    return;
  }

  const result = filterPokemon(query);
  if (result.length === 0) respondHead(response, 204);
  else respondJSON(request, response, 200, result);
};

// GET /pokemon/:id
const getPokemonById = (request, response, id) => {
  const pokemon = pokemonData.find((p) => p.id === id);

  if (request.method === 'HEAD') {
    respondHead(response, pokemon ? 200 : 404);
    return;
  }

  if (request.method !== 'GET') {
    respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
    return;
  }

  if (!pokemon) respondHead(response, 204);
  else respondJSON(request, response, 200, pokemon);
};

// POST /addPokemon
const addPokemon = (request, response, newPokemon) => {
  if (!newPokemon) {
    respondJSON(request, response, 400, 'Bad Request', 'badRequest');
    return;
  }

  pokemonData.push(newPokemon);
  respondJSON(request, response, 201, newPokemon);
};

// PUT /editPokemon
const editPokemon = (request, response, updatedPokemon) => {
  if (!updatedPokemon) {
    respondJSON(request, response, 400, 'Bad Request', 'badRequest');
    return;
  }

  const index = pokemonData.findIndex((p) => p.id === updatedPokemon.id);
  if (index === -1) {
    respondJSON(request, response, 404, 'Pokemon not found', 'notFound');
    return;
  }

  pokemonData[index] = updatedPokemon;
  respondJSON(request, response, 200, updatedPokemon);
};

// GET /pokemon/types
const getTypes = (request, response) => {
  const types = [...new Set(pokemonData.flatMap((p) => p.type))];
  if (request.method === 'HEAD') respondHead(response, 200);
  else respondJSON(request, response, 200, types);
};

// GET /pokemon/weaknesses
const getWeaknesses = (request, response) => {
  const weaknesses = [...new Set(pokemonData.flatMap((p) => p.weaknesses))];
  if (request.method === 'HEAD') respondHead(response, 200);
  else respondJSON(request, response, 200, weaknesses);
};

module.exports = {
  pokemonData,
  getPokemon,
  getPokemonById,
  addPokemon,
  editPokemon,
  getTypes,
  getWeaknesses,
  respondJSON,
  respondHead,
  respondNotFound,
};

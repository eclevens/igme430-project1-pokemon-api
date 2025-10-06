const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { respondJSON, respondHead, respondNotFound } = require('./responses');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// File paths for static client files
const clientPath = path.resolve(__dirname, '../client/client.html');
const cssPath = path.resolve(__dirname, '../client/style.css');
const jsPath = path.resolve(__dirname, '../client/client.js');
const pokedexPath = path.resolve(__dirname, '../pokedex.json');

// Load Pokemon data into memory at startup
let pokemonData = [];
try {
  const rawData = fs.readFileSync(pokedexPath);
  pokemonData = JSON.parse(rawData);
  console.log(`Loaded ${pokemonData.length} Pokemon into memory.`);
} catch (error) {
  console.error('Error loading pokedex.json at startup:', error);
  process.exit(1);
}

// Helper: get unique values from array
const getUniqueValues = (array, key) => {
  const values = array.flatMap((item) => item[key]);
  return [...new Set(values)];
};

// Main request handler
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { pathname } = parsedUrl;

  switch (pathname) {
    // Serve static files
    case '/':
    case '/client.html':
      fs.readFile(clientPath, (err, data) => {
        if (err) {
          respondJSON(request, response, 500, 'Internal Server Error');
        } else {
          response.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(data),
          });
          response.end(data);
        }
      });
      break;

    case '/style.css':
      fs.readFile(cssPath, (err, data) => {
        if (err) {
          respondJSON(request, response, 500, 'Internal Server Error');
        } else {
          response.writeHead(200, {
            'Content-Type': 'text/css',
            'Content-Length': Buffer.byteLength(data),
          });
          response.end(data);
        }
      });
      break;

    case '/client.js':
      fs.readFile(jsPath, (err, data) => {
        if (err) {
          respondJSON(request, response, 500, 'Internal Server Error');
        } else {
          response.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Content-Length': Buffer.byteLength(data),
          });
          response.end(data);
        }
      });
      break;

      // GET /pokemon (with optional query filters)
    case '/pokemon':
      if (request.method === 'HEAD') {
        respondHead(response, 200);
      } else if (request.method === 'GET') {
        let filteredData = [...pokemonData];
        const { type, weakness } = parsedUrl.query;

        if (type) {
          filteredData = filteredData.filter((p) => p.type.some(
            (t) => t.toLowerCase() === type.toLowerCase(),
          ));
        }

        if (weakness) {
          filteredData = filteredData.filter((p) => p.weaknesses.some(
            (w) => w.toLowerCase() === weakness.toLowerCase(),
          ));
        }

        if (filteredData.length === 0) respondHead(response, 204);
        else respondJSON(request, response, 200, filteredData);
      } else {
        respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
      }
      break;

      // GET /pokemon/types
    case '/pokemon/types':
      if (request.method === 'HEAD') {
        respondHead(response, 200);
      } else if (request.method === 'GET') {
        const types = getUniqueValues(pokemonData, 'type');
        if (types.length === 0) respondHead(response, 204);
        else respondJSON(request, response, 200, types);
      } else {
        respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
      }
      break;

      // GET /pokemon/weaknesses
    case '/pokemon/weaknesses':
      if (request.method === 'HEAD') {
        respondHead(response, 200);
      } else if (request.method === 'GET') {
        const weaknesses = getUniqueValues(pokemonData, 'weaknesses');
        if (weaknesses.length === 0) respondHead(response, 204);
        else respondJSON(request, response, 200, weaknesses);
      } else {
        respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
      }
      break;

      // POST /addPokemon
    case '/addPokemon':
      if (request.method === 'POST') {
        let body = '';
        request.on('data', (chunk) => {
          body += chunk;
        });
        request.on('end', () => {
          let newPokemon = {};
          const contentType = request.headers['content-type'];

          if (contentType === 'application/json') {
            try {
              newPokemon = JSON.parse(body);
            } catch (err) {
              respondJSON(request, response, 400, 'Invalid JSON', 'badRequest');
              return; // stop execution
            }
          } else if (contentType === 'application/x-www-form-urlencoded') {
            const params = new URLSearchParams(body);
            newPokemon = {
              id: parseInt(params.get('id'), 10),
              num: params.get('num'),
              name: params.get('name'),
              img: params.get('img'),
              type: params.get('type') ? params.get('type').split(',') : [],
              height: params.get('height'),
              weight: params.get('weight'),
              weaknesses: params.get('weaknesses') ? params.get('weaknesses').split(',') : [],
            };
          } else {
            respondJSON(request, response, 400, 'Unsupported Content-Type', 'badRequest');
            return; // stop execution
          }

          // Only reaches here if input was valid
          pokemonData.push(newPokemon);
          respondJSON(request, response, 201, newPokemon);
        });
      } else {
        respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
      }
      break;

      // POST /editPokemon
    case '/editPokemon':
      if (request.method === 'POST') {
        let body = '';
        request.on('data', (chunk) => {
          body += chunk;
        });
        request.on('end', () => {
          let updatedPokemon = {};
          const contentType = request.headers['content-type'];

          if (contentType === 'application/json') {
            try {
              updatedPokemon = JSON.parse(body);
            } catch (err) {
              respondJSON(request, response, 400, 'Invalid JSON', 'badRequest');
              return; // stop execution
            }
          } else if (contentType === 'application/x-www-form-urlencoded') {
            const params = new URLSearchParams(body);
            updatedPokemon = {
              id: parseInt(params.get('id'), 10),
              num: params.get('num'),
              name: params.get('name'),
              img: params.get('img'),
              type: params.get('type') ? params.get('type').split(',') : [],
              height: params.get('height'),
              weight: params.get('weight'),
              weaknesses: params.get('weaknesses') ? params.get('weaknesses').split(',') : [],
            };
          } else {
            respondJSON(request, response, 400, 'Unsupported Content-Type', 'badRequest');
            return;
          }

          const index = pokemonData.findIndex((p) => p.id === updatedPokemon.id);
          if (index === -1) {
            respondJSON(request, response, 404, 'Pokemon not found', 'notFound');
            return;
          }

          const existing = pokemonData[index];
          const isUnchanged = JSON.stringify(existing) === JSON.stringify(updatedPokemon);
          if (isUnchanged) {
            respondHead(response, 204);
            return;
          }

          pokemonData[index] = updatedPokemon;
          respondJSON(request, response, 200, updatedPokemon);
        });
      } else {
        respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
      }
      break;

      // GET single Pokémon by ID
    default:
      if (pathname.startsWith('/pokemon/')) {
        const id = parseInt(pathname.split('/')[2], 10);
        if (request.method === 'HEAD') {
          const exists = pokemonData.some((p) => p.id === id);
          respondHead(response, exists ? 200 : 404);
        } else if (request.method === 'GET') {
          const pokemon = pokemonData.find((p) => p.id === id);
          if (!pokemon) respondHead(response, 204); // 204 if no content
          else respondJSON(request, response, 200, pokemon);
        } else {
          respondJSON(request, response, 405, 'Method Not Allowed', 'methodNotAllowed');
        }
      } else {
        respondNotFound(request, response);
      }
      break;
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Server running on http://127.0.0.1:${port}`);
});

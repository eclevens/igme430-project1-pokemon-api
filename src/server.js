const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const {
  pokemonData,
  getPokemon,
  getPokemonById,
  addPokemon,
  editPokemon,
  getTypes,
  getWeaknesses,
  respondNotFound,
  respondJSON,
} = require('./responses');

const port = process.env.PORT || 3000;

// load JSON at startup
const pokedexPath = path.resolve(__dirname, '../pokedex.json');
try {
  const rawData = fs.readFileSync(pokedexPath, 'utf8');
  pokemonData.push(...JSON.parse(rawData));
  console.log(`Loaded ${pokemonData.length} Pokemon`);
} catch (err) {
  console.error('Error loading pokedex.json:', err);
  process.exit(1);
}

// file paths
const clientPath = path.resolve(__dirname, '../client/index.html');
const cssPath = path.resolve(__dirname, '../client/style.css');
const jsPath = path.resolve(__dirname, '../client/client.js');
const docPath = path.resolve(__dirname, '../client/documentation.html');

// serve static files
const serveStatic = (filePath, contentType) => (req, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      respondJSON(req, res, 500, 'Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(data),
    });
    res.end(data);
  });
};

// parse put/post body
const parseBody = (request, callback) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });

  request.on('end', () => {
    const contentType = request.headers['content-type'];
    let parsed = null;

    if (contentType === 'application/json') {
      try {
        parsed = JSON.parse(body);
      } catch (err) {
        parsed = null;
      }
    } else if (contentType === 'application/x-www-form-urlencoded') {
      const params = querystring.parse(body);
      parsed = {
        id: parseInt(params.id, 10),
        name: params.name,
        type: params.type ? params.type.split(',') : [],
        weaknesses: params.weaknesses ? params.weaknesses.split(',') : [],
        height: params.height,
        weight: params.weight,
      };
    }

    callback(parsed);
  });
};

// main reuqest handler
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { pathname, query } = parsedUrl;

  // static files
  switch (pathname) {
    case '/':
    case '/index.html':
      serveStatic(clientPath, 'text/html')(request, response);
      return;
    case '/style.css':
      serveStatic(cssPath, 'text/css')(request, response);
      return;
    case '/client.js':
      serveStatic(jsPath, 'application/javascript')(request, response);
      return;
    case '/documentation':
      serveStatic(docPath, 'text/html')(request, response);
      return;
    default:
      break;
  }

  // api endpoints
  if (pathname === '/pokemon') {
    getPokemon(request, response, query);
    return;
  }

  if (pathname.startsWith('/pokemon/')) {
    const id = parseInt(pathname.split('/')[2], 10);
    getPokemonById(request, response, id);
    return;
  }

  if (pathname === '/addPokemon' && request.method === 'POST') {
    parseBody(request, (data) => {
      if (!data) {
        respondJSON(request, response, 400, 'Bad Request', 'badRequest');
        return;
      }
      addPokemon(request, response, data);
    });
    return;
  }

  if (pathname === '/editPokemon' && (request.method === 'PUT' || request.method === 'POST')) {
    parseBody(request, (data) => {
      if (!data) {
        respondJSON(request, response, 400, 'Bad Request', 'badRequest');
        return;
      }
      editPokemon(request, response, data);
    });
    return;
  }

  if (pathname === '/pokemon/types') {
    getTypes(request, response);
    return;
  }

  if (pathname === '/pokemon/weaknesses') {
    getWeaknesses(request, response);
    return;
  }

  // fallback
  respondNotFound(request, response);
};

// start server
http.createServer(onRequest).listen(port, () => {
  console.log(`Server running on http://127.0.0.1:${port}`);
});

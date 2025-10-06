const respondJSON = (request, response, status, message, id = null) => {
  // JSON object
  const responseJSON = id ? { message, id } : { message };
  const responseBody = JSON.stringify(responseJSON);

  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(responseBody), // legtnth
  });
  response.write(responseBody);
  response.end();
};

// HEAD response
const respondHead = (response, status) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': 0, // HEAD has no body
  });
  response.end(); // end
};

// 404 Accept header
const respondNotFound = (request, response) => {
  const acceptedTypes = request.headers.accept ? request.headers.accept.split(',') : [];
  const wantsJSON = acceptedTypes.includes('application/json') || acceptedTypes.includes('*/*');

  if (wantsJSON) {
    respondJSON(request, response, 404, '404 Not Found', 'notFound');
  } else { // plain text
    const responseBody = '404 Not Found';
    response.writeHead(404, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(responseBody), // handle content length
    });
    response.write(responseBody);
    response.end();
  }
};

module.exports = { respondJSON, respondHead, respondNotFound };

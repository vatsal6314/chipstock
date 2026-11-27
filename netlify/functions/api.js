const serverless = require('serverless-http');
const app = require('../../server/app');

// Serverless handler for Netlify Functions
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Prevent context from waiting for empty event loop (crucial for Mongoose connection reuse)
  context.callbackWaitsForEmptyEventLoop = false;

  // Normalize path so Express always sees /api/...
  if (event.path) {
    // Strip /.netlify/functions/api or /.netlify/functions/<functionName>
    let p = event.path.replace(/^\/\.netlify\/functions\/[^\/]+/, '');
    if (!p.startsWith('/api')) {
      p = '/api' + (p.startsWith('/') ? p : '/' + p);
    }
    event.path = p;
  }

  try {
    return await handler(event, context);
  } catch (error) {
    console.error('Netlify function execution error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error in API function: ' + error.message,
      }),
    };
  }
};

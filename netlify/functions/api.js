const serverless = require('serverless-http');
const app = require('../../server/app');

// Serverless handler for Netlify Functions
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Prevent context from waiting for empty event loop (crucial for Mongoose connection reuse in AWS Lambda / Netlify)
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};

/**
 * netlify/functions/api.js — Netlify Serverless Function Adapter
 * Runs the Probaho backend API and Llama 3.2 copilot endpoint on Netlify Functions.
 */
const { handleApiRequest } = require('../../server/api');
const { Readable } = require('stream');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  let reqPath = event.path;
  if (reqPath.startsWith('/.netlify/functions/api')) {
    reqPath = reqPath.replace('/.netlify/functions/api', '/api');
  }

  const req = new Readable({
    read() {
      if (event.body) {
        this.push(event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body);
      }
      this.push(null);
    }
  });

  const qs = event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : '';
  req.url = reqPath + qs;
  req.method = event.httpMethod;
  req.headers = event.headers || {};

  return new Promise((resolve) => {
    let statusCode = 200;
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    let responseBody = '';

    const res = {
      writeHead(code, h) {
        statusCode = code;
        if (h) Object.assign(headers, h);
      },
      setHeader(k, v) {
        headers[k] = v;
      },
      end(chunk) {
        if (chunk) responseBody += chunk.toString();
        resolve({
          statusCode: statusCode,
          headers: headers,
          body: responseBody
        });
      }
    };

    handleApiRequest(req, res).catch((err) => {
      resolve({
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ error: err.message || 'Internal Server Error' })
      });
    });
  });
};

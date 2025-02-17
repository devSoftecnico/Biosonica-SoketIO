const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biosonica Socket API Documentation',
      version: '1.0.0',
      description: 'API documentation for Biosonica Socket server that handles Google authentication',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://biosonica-socket.onrender.com' : 'http://localhost:4000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Local development server'
      }
    ],
    components: {
      schemas: {
        GoogleSignInRequest: {
          type: 'object',
          required: ['type', 'idToken'],
          properties: {
            type: {
              type: 'string',
              enum: ['google_signin'],
              description: 'Type of authentication request',
            },
            idToken: {
              type: 'string',
              description: 'Google ID token obtained from client-side authentication',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success'],
              description: 'Response status',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            user: {
              type: 'object',
              properties: {
                uid: {
                  type: 'string',
                  description: 'Firebase user ID',
                },
                email: {
                  type: 'string',
                  description: 'User email',
                },
                name: {
                  type: 'string',
                  description: 'User display name',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Response status',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error message (optional)',
            },
          },
        },
      },
    },
    paths: {
      '/socket': {
        post: {
          tags: ['Authentication'],
          summary: 'Google Sign-In via Socket',
          description: 'Authenticate user using Google ID token through socket connection',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GoogleSignInRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful authentication',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SuccessResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request or authentication error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./server.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

// notes
const NotesService = require('./service/postgres/NotesService');
const notes = require('./api/notes');
const NotesValidator = require('./validator/notes');

// users
const UsersService = require('./service/postgres/UsersService');
const users = require('./api/users');
const UsersValidator = require('./validator/users');

// authentications
const AuthenticationsService = require('./service/postgres/AuthenticationsService');
const authentications = require('./api/authentications');
const AuthenticationValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./service/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// exports
const _exports = require('./api/exports');
const ProducerService = require('./service/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const collaborationsService = new CollaborationsService();
  const notesService = new NotesService(collaborationsService);
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    debug: {
      request: ['error'],
    },
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('notesapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCES_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: notes,
      options: {
        service: notesService,
        validator: NotesValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        notesService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        service: ProducerService,
        validator: ExportsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();

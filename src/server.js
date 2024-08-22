const Hapi = require('@hapi/hapi');
const NotesService = require('./service/inMemory/NotesService');
const notes = require('./api/notes');
const NotesValidator = require('./validator/notes');

const init = async () => {
  const noteService = new NotesService();

  const server = Hapi.server({
    port: 5000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: notes,
    options: {
      service: noteService,
      validator: NotesValidator,
    },
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();

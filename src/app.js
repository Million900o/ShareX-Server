/*
    The ShareX Server main file.
*/
const config = require('./config.json');
let PORT = config.port || 1234;

// Fancy stuff
require('colors');
const { warn, log, error } = require('./util/logger');

const express = require('express');

// Require Middleware
const compression = require('compression');
const cookieParser = require('cookie-parser');

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60 * 15,
});

const database = require('./mongo/index.js');
database.init();

// Create the server
let app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// For caching
app.cache = {
  files: {},
  urls: {}
}

// Middleware
if (config.debug) app.use(require('morgan')('dev'));
app.use(compression());
app.use(cookieParser());
app.use(express.static(`${__dirname}/public/`));
app.use(express.static(`${__dirname}/uploads/`));
app.use(limiter);

// Important 418
app.get('/teapot', (req, res) => res.status(418).end('I\'m a teapot'))

// Router
require('./routes').setup(app);

// Start server and log
app.listen(PORT)
  .on('error', err => error(err))
  .on('close', () => warn('expressjs server stopped.'))
  .on('listening', () => log('expressjs server running on port', PORT));

// Gotta Catch em all!
process.on('uncaughtException', err => error(err));

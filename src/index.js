
// This I need to clean later
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const FlakeId = require('flakeid');

// Redis stuff
const { promisify } = require('util');
const redis = require('redis');
process.f = {};

// My packages
const { Logger } = require('loggers');
const nodeHandler = require('file-storage-node-handler');

// MongoDB models
const mongoose = require('mongoose');
const FileModel = require('./models/file.js');
const UserModel = require('./models/user.js');

// Middlewares
const domainHandling = require('./middleware/domainHandling.js');
const IPParsing = require('./middleware/parseIP.js');
const slowDown = require("express-slow-down");

// Routes
const FORRoute = require('./routes/404.js');
const adminRoute = require('./routes/admin.js');
const dashboardRoute = require('./routes/dashboard.js');
const deleteRoute = require('./routes/delete.js');
const filesRoute = require('./routes/files.js');
const homeRoute = require('./routes/home.js');
const loginRoute = require('./routes/login.js');
const logoutRoute = require('./routes/logout.js');
const signupRoute = require('./routes/signup.js');
const browserUploadRoute = require('./routes/upload.js');
// API
const buploadRoute = require('./routes/api/bupload.js');
const apiLoginRoute = require('./routes/api/login.js');
const apiSignupRoute = require('./routes/api/signup.js');
const uploadRoute = require('./routes/api/upload.js');
// API USER
const deleteAccountRoute = require('./routes/api/user/account.js');
const domainRoute = require('./routes/api/user/domain.js');
const deleteFilesRoute = require('./routes/api/user/files.js');
const passwordRoute = require('./routes/api/user/password.js');
const usernameRoute = require('./routes/api/user/username.js');
// API ADMIN
const loginAsRoute = require('./routes/api/admin/users/login.js');
const deleteUserRoute = require('./routes/api/admin/users/delete.js');
const deleteUserFilesRoute = require('./routes/api/admin/users/deleteFiles.js');

const random = require('./utils/random.js');
const bcrypt = require('bcrypt');
const { resolve } = require('path');
const { unlink, readdir, stat } = require('fs');

const DefaultOptions = {
  authentication: {
    emails: {
      required: false,
    },
    passwords: {
      saltRounds: 1,
      tries: 5,
    },
    tokens: {
      length: 15,
      tries: 5,
    },
  },
  storageSize: {
    owner: 'Infinity',
    admin: 'Infinity',
    staff: '1e+7',
    friend: '5e+6',
    'tier-3': '2e+7',
    'tier-2': '1e+7',
    'tier-1': '5e+6',
    user: '2e+6',
    bad: '1e+6'
  },
  mongodb: {
    connectURI: 'mongodb://localhost/sharex-rewrite-test',
    connectOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
  },
  useRedis: false,
  defaults: {
    port: 80,
    domain: 'localhost',
    secure: false,
    userType: 'user'
  },
};

class ShareXServer {
  constructor(options = DefaultOptions) {
    this.nodes = options.storage.nodes;
    this.authentication = options.authentication;
    this.defaults = options.defaults;
    this.mongoConfig = options.mongodb;
    this.redisConfig = options.redis;
    this.logger = new Logger({
      debug: options.debug,
      catch: !options.debug,
      colors: true,
      newLine: false,
      method: console.log
    });
    this.defaultURL = (this.defaults.secure ? 'https://' : 'http://') +
      (this.defaults.subdomain ? this.defaults.subdomain + '.' : '') +
      this.defaults.domain;
    this.storage = new nodeHandler.FileStorage(this.nodes);
    this.storageSize = options.storageSize;
    this.startRedis();
    this.startMongo();
    this.startServer();
  }

  startRedis() {
    if (this.redisConfig === undefined) {
      this.logger.warn('Starting without Redis');
      return;
    }
    this.logger.debug('Connecting to Redis');
    const client = redis.createClient(this.redisConfig);
    ['get', 'set', 'del', 'ttl'].forEach(command => {
      client[command] = promisify(client[command]).bind(client);
    });
    process.f.redis = client;
    this.logger.log('Connected to Redis at:', this.redisConfig.host + ':' + this.redisConfig.port);
  }

  deletetmpFiles() {
    const now = Date.now();
    readdir(resolve('tmp/'), (err, files) => {
      if (err) {
        this.logger.error('Error occured when deleting tmp files.');
        this.logger.error(err);
        return;
      } else {
        files.forEach(file => {
          try {
            const filePath = resolve('tmp/', file);
            stat(filePath, (er, stats) => {
              if (er) {
                this.logger.error('Error occured when getting stats of tmp file:', file);
                this.logger.error(e);
                return;
              }
              if (now > (new Date(stats.mtime).getTime() + 3.6e6)) {
                unlink(filePath, (e) => {
                  if (e) {
                    this.logger.error('Error occured when deleting tmp file:', file);
                    this.logger.error(e);
                    return;
                  } else {
                    this.logger.log('Deleted tmp file:', file);
                  }
                });
              }
              return;
            });
          } catch (error) {
            this.logger.error('Error occured when deleting tmp file:', file);
            this.logger.error(errro);
            return;
          }
        });
      }
    });
  }

  async startMongo() {
    this.models = { FileModel, UserModel };
    this.logger.log('Connecting to MongoDB');
    this.mongodb = mongoose.connect(this.mongoConfig.connectURI, this.mongoConfig.connectOptions);
    const userCheck = await this.models.UserModel.find();
    if (!userCheck.length) await this.models.UserModel.create({
      id: 'default',
      authentication: {
        token: random.generateRandomString(this.authentication.tokens.length),
        username: 'default',
        password: bcrypt.hashSync('default', 1),
        email: 'none',
      },
      stats: {
        uploads: 0,
        redirects: 0,
        upload_size: 0,
      },
      info: {
        created_date: new Date(),
        user_type: 'owner',
      },
      domain: this.defaults.domain
    });
  }

  startServer() {
    this.deletetmpFiles();
    this.app = express();
    this.app.disable('x-powered-by');
    this.app.set('trust proxy', true);
    this.app.use(express.static(`${__dirname}/public/`));
    this.app.use(session({
      saveUninitialized: false,
      resave: false,
      secret: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cookie: {
        sameSite: true,
        maxAge: 60 * 60 * 1000,
        secure: this.defaults.secure
      }
    }));
    this.app.use(slowDown({
      windowMs: 1 * 60 * 1000,
      delayAfter: 15,
      delayMs: 500,
      max: 4500
    }));
    this.app.use(cookieParser());
    this.app.server = this;
    this.flake = new FlakeId();

    this.app.use(IPParsing);
    this.app.use(domainHandling);

    this.app.use(adminRoute);
    this.app.use(dashboardRoute);
    this.app.use(deleteRoute);
    this.app.use(filesRoute);
    this.app.use(homeRoute);
    this.app.use(loginRoute);
    this.app.use(logoutRoute);
    this.app.use(signupRoute);
    this.app.use(browserUploadRoute);

    this.app.use(buploadRoute);
    this.app.use(apiLoginRoute);
    this.app.use(apiSignupRoute);
    this.app.use(uploadRoute);

    this.app.use(deleteAccountRoute);
    this.app.use(domainRoute);
    this.app.use(deleteFilesRoute);
    this.app.use(passwordRoute);
    this.app.use(usernameRoute);

    this.app.use(loginAsRoute);
    this.app.use(deleteUserRoute);
    this.app.use(deleteUserFilesRoute);

    this.app.use(FORRoute);

    this.app.listen(this.defaults.port, () => {
      this.logger.log('Started ShareX-Server on port', this.defaults.port);
    });
  }
}

module.exports = ShareXServer;

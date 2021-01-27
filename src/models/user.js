const { Schema, model } = require('mongoose');

const UserSchema = Schema({
  id: String,
  authentication: {
    token: String,
    username: String,
    password: String,
    email: String,
  },
  stats: {
    uploads: Number,
    redirects: Number,
    upload_size: Number,
  },
  info: {
    created_date: String,
    user_type: String,
  },
  domain: String,
});

module.exports = model('users', UserSchema);

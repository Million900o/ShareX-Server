const { Schema, model } = require('mongoose');

const UserSchema = Schema({
  key: String,
  name: String,
  password: String,
  uploads: Number,
  redirects: Number,
  discord: String,
  createdAt: String,
  subdomain: String,
  domain: String,
  id: String,
  uploadSize: Number,
  userType: String,
});

module.exports = model('users', UserSchema);

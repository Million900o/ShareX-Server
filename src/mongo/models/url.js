const { Schema, model } = require('mongoose');

const URLSchema = Schema({
  id: String,
  views: Number,
  uploader: String,
  redirect: String,
  CreatedAt: String,
});

module.exports = model('url', URLSchema);

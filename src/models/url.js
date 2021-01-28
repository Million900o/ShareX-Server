const { Schema, model } = require('mongoose');

const URLSchema = Schema({
  id: String,
  deletion_key: String,
  url: String,
  info: {
    creator: String,
    create_date: String,
  },
  stats: {
    views: Number,
  },
});

module.exports = model('files', URLSchema);

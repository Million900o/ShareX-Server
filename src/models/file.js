const { Schema, model } = require('mongoose');

const FileSchema = Schema({
  id: String,
  deletion_key: String,
  info: {
    original_name: String,
    uploader: String,
    upload_date: String,
    mimeType: String,
    size: Number,
  },
  stats: {
    views: Number,
  },
  node: {
    node_id: String,
    file_id: String,
  },
});

module.exports = model('files', FileSchema);

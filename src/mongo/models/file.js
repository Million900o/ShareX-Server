const { Schema, model } = require('mongoose');

const FileSchema = Schema({
  originalName: String,
  name: String,
  path: String,
  views: Number,
  uploader: String,
  UploadedAt: String,
  lock: {
    active: Boolean,
    password: String,
  },
});

module.exports = model('file', FileSchema);

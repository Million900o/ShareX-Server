const { Schema, model } = require('mongoose');

const DomainSchema = Schema({
  info: {
    created_date: String,
    users: Array,
  },
  domain: String,
  subdomains: Object,
  owner: String,
  secure: Boolean
});

module.exports = model('domains', DomainSchema);

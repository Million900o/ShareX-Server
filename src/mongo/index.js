const config = require('../config.json');

const mongoose = require('mongoose');

// ------------------------------------------------------------

const FileModel = require('./models/file.js');

module.exports.addFileView = async fileName => {
  let fileData = await this.getFile(fileName);
  if (!fileData) return null;
  let newFileViews = fileData.views + 1;
  await FileModel.updateOne(fileData, { views: newFileViews });
  return true;
};

module.exports.getAllFiles = async id => {
  let fileData = await FileModel.find({ uploader: id }).lean();
  return fileData;
};

module.exports.getFile = async fileName => {
  let fileData = await FileModel.findOne({ name: fileName }).lean();
  return fileData;
};

module.exports.saveFile = async data => {
  let fileData = await FileModel.create(data);
  return fileData;
};

module.exports.delFile = async fileName => {
  let fileData = await this.getFile(fileName);
  if (!fileData) return false;
  await FileModel.deleteOne(fileData);
  return true;
};

// ------------------------------------------------------------

let URLModel = require('./models/url.js');

module.exports.addURLView = async ID => {
  let URLData = await this.getURL(ID);
  if (!URLData) return null;
  let newURLViews = URLData.views + 1;
  await URLModel.updateOne(URLData, { views: newURLViews });
  return true;
};

module.exports.getURL = async ID => {
  let URLData = await URLModel.findOne({ id: ID }).lean();
  return URLData;
};

module.exports.saveURL = async data => {
  let URLData = await URLModel.create(data);
  return URLData;
};

module.exports.delURL = async ID => {
  let URLData = await this.getURL(ID);
  if (!URLData) return false;
  await URLModel.deleteOne(URLData);
  return true;
};

// ------------------------------------------------------------

let UserModel = require('./models/user.js');
const { error, log } = require('../util/logger');

module.exports.setUserUsername = async (key, username) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  await UserModel.updateOne(userData, { name: username });
  return true;
};

module.exports.setUserPassword = async (key, password) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  await UserModel.updateOne(userData, { password: password });
  return true;
};

module.exports.setUserDomain = async (key, domain) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  await UserModel.updateOne(userData, { domain: domain });
  return true;
};

module.exports.setUserSubDomain = async (key, subdomain) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  await UserModel.updateOne(userData, { subdomain: subdomain });
  return true;
};

module.exports.addUserUpload = async (key, num) => {
  if (num === undefined) num = 1;
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  let newUploads = userData.uploads + num;
  await UserModel.updateOne(userData, { uploads: newUploads });
  return true;
};

module.exports.addUserRedirect = async key => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  let newRedirect = userData.redirects + 1;
  await UserModel.updateOne(userData, { redirects: newRedirect });
  return true;
};

module.exports.addUserUploadSize = async (key, kilos) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  if (userData.uploadSize === undefined) userData.uploadSize = 0;
  let newSize = userData.uploadSize + kilos;
  await UserModel.updateOne(userData, { uploadSize: newSize });
  return true;
};

module.exports.setUserDiscord = async (key, discord) => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return null;
  await UserModel.updateOne(userData, { discord: discord });
  return true;
};

module.exports.getUserFromID = async id => {
  let userData = await UserModel.findOne({ id: id }).lean();
  return userData;
};

module.exports.getUserFromKey = async key => {
  let userData = await UserModel.findOne({ key: key }).lean();
  return userData;
};

module.exports.getUserFromDiscord = async discord => {
  let userData = await UserModel.findOne({ discord: discord }).lean();
  return userData;
};

module.exports.getUserFromPassword = async (username, password) => {
  let userData = await UserModel.findOne({ name: username, password: password }).lean();
  return userData;
};

module.exports.getUserFromSubDomain = async subdomain => {
  let userData = await UserModel.findOne({ subdomain: subdomain }).lean();
  return userData;
};

module.exports.getUserFromName = async name => {
  let userData = await UserModel.findOne({ name: name }).lean();
  return userData;
};

module.exports.getAllUsers = async () => {
  let userData = await UserModel.find().lean();
  return userData;
};

module.exports.saveUser = async data => {
  let userData = await UserModel.create(data);
  return userData;
};

module.exports.delUser = async key => {
  let userData = await this.getUserFromKey(key);
  if (!userData) return false;
  await UserModel.deleteOne(userData);
  return true;
};

// ------------------------------------------------------------

const defaultOptions = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

module.exports.init = () => {
  if (!config || !config.mongo ||
    !config.mongo.connectURI || !config.mongo.connectOptions) {
      error("MongoDB config is required.")
      process.exit()
    }

  let connectURI = config.mongo.connectURI;
  let connectOptions = Object.assign({}, config.mongo.connectOptions, defaultOptions);
  mongoose.connect(connectURI, connectOptions, (err) => {
    if (err) {
      error(err)
      this.init()
    } else log('Connected to MongoDB!')
  });
};

// ------------------------------------------------------------

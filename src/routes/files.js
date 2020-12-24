const { Router } = require('express');
const router = Router();

const fs = require('fs');
const path = require('path');

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/files/all', passwordAuthentication, async (req, res) => {
  const page = req.query.p ? req.query.p : 0;
  const files = (await req.app.server.models.FileModel.find({ 'info.uploader': req.session.userData.id })).sort(
    (a, b) => new Date(a.UploadedAt) - new Date(b.UploadedAt),
  ).reverse().slice(page * 100, 100 + (page * 100));
  res.render('pages/files.ejs', { user: req.session.userData, files: files, page: page, secure: req.app.server.defaults.secure });
  return;
});

router.get('/files/:id', async (req, res) => {
  const fileID = req.params.id;
  if (fileID) {
    const testPath = path.resolve('files/' + req.params.id);
    if (fs.existsSync(testPath)) return res.sendFile(testPath);
    const domain = req.domain;
    let databaseID;
    let fileData;
    try {
      const userModel = await req.app.server.models.UserModel.findOne({ domain: domain });
      req.app.server.logger.debug('Retrieved user with domain', domain);
      if (!userModel) {
        res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
        return;
      }
      databaseID = userModel.id + ':' + fileID;
      fileData = await req.app.server.models.FileModel.findOne({ id: databaseID });
    } catch (err) {
      req.app.server.logger.error('Error occured when getting', fileID, 'uploader');
      req.app.server.logger.error(err);
      res.render('pages/error.ejs', { message: 'Internal Server Error', error: 500, user: req.session.userData });
      return;
    }
    if (fileData) {
      try {
        await req.app.server.models.FileModel.updateOne(fileData, { 'stats.views': fileData.stats.views + 1 });
        res.contentType(fileData.info.mimeType)
        req.app.server.logger.debug('Updated', fileData.id, 'views');
      } catch (err) {
        req.app.server.logger.error('Error occured when updating', fileID, 'views');
        req.app.server.logger.error(err);
      }
      let redisFile;
      try {
        redisFile = await process.f.redis.get('files.' + databaseID);
        req.app.server.logger.debug('Retrieved', databaseID, 'from cache');
      } catch (err) {
        req.app.server.logger.error('Error occured when retreiving', fileID, 'from redis');
        req.app.server.logger.error(err);
      }
      if (redisFile) {
        res.end(Buffer.from(JSON.parse(redisFile)), 'binary');
        req.app.server.logger.log(`Sent file ${fileID} to`, req.parsedIP);
        return;
      } else {
        let file;
        try {
          file = await req.app.server.storage.getFile(fileData.node.file_id, fileData.node.node_id);
          req.app.server.logger.debug('Retrieved', fileID, 'from node', fileData.node.node_id);
        } catch (err) {
          req.app.server.logger.error('Error occured when retreiving', fileID, 'from storage node', fileData.node.node_id);
          req.app.server.logger.error(err);
          res.render('pages/error.ejs', { message: 'Internal Server Error', error: 500, user: req.session.userData });
          return;
        }
        try {
          if (fileData.info.size < 4 * 1024 * 1024)
            await process.f.redis.set('files.' + databaseID, JSON.stringify(file), 'EX', 60 * 60);
          req.app.server.logger.debug('Added', fileID, 'to the cache');
        } catch (err) {
          req.app.server.logger.error('Error occured when caching', fileID);
          req.app.server.logger.error(err);
        }
        req.app.server.logger.log(`Sent file ${fileID} to`, req.parsedIP);
        res.end(file, 'binary');
        return;
      }
    } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  return;
});

module.exports = router;

const { Router } = require('express');
const router = Router();

// Middleware
const tokenAuthentication = require('../../middleware/tokenAuthentication.js');
// const fileUpload = require('express-fileupload');

// Utils
const fs = require('fs');
const path = require('path');
const random = require('../../utils/random.js');

// router.use(fileUpload({
//   limits: {
//     fileSize: Infinity,
//   },
//   useTempFiles: true,
// }));

router.post('/upload', tokenAuthentication, async (req, res) => {
  if (req.files && req.files.file) {
    const filePath = path.resolve(req.files.file.tempFilePath);
    const neededStorage = req.session.userData.stats.upload_size + req.files.file.size;
    const maxStorage = req.app.server.storageSize[req.session.userData.info.user_type];
    if (maxStorage > neededStorage) {
      const fileBuffer = fs.readFileSync(filePath);
      let savedFile;
      try {
        savedFile = await req.app.server.storage.saveFile(fileBuffer);
      } catch (err) {
        req.app.server.logger.warn(err);
        fs.unlinkSync(filePath);
        res.status(503).json({ succcess: false, message: 'Internal Server Error' });
        return;
      }
      if (savedFile && savedFile.response.success) {
        const fileID = random.generateRandomString(16) + '.' + req.files.file.name.split('.').pop();
        const deletionKey = random.generateRandomString(50);
        const databaseKey = req.session.userData.id + ':' + deletionKey;
        const databaseID = req.session.userData.id + ':' + fileID;
        await req.app.server.models.FileModel.create({
          id: databaseID,
          deletion_key: databaseKey,
          info: {
            original_name: req.files.file.name,
            uploader: req.session.userData.id,
            upload_date: new Date(),
            mimiType: req.files.file.mimetype,
            size: req.files.file.size
          },
          stats: {
            views: 0,
          },
          node: {
            node_id: savedFile.node.id,
            file_id: savedFile.response.id,
          },
        });
        await req.app.server.models.UserModel.updateOne(req.session.userData, { 'stats.upload_size': neededStorage, 'stats.uploads': req.session.userData.stats.uploads + 1 });
        const userURL = ((await req.app.server.models.DomainModel.findOne({ domain: req.session.userData.domain.domain })).secure ? 'https://' : 'http://') +
          (req.session.userData.domain.subdomain ? req.session.userData.domain.subdomain + '.' : '') +
          (req.session.userData.domain.domain);
        res.json({
          succcess: true,
          url: userURL + '/files/' + fileID,
          deletion_url: userURL + '/delete/' + deletionKey
        });
        if (req.files.file.size < 4 * 1024 * 1024)
          await process.f.redis.set('files.' + databaseID, JSON.stringify(fileBuffer), 'EX', 60 * 60);
        fs.unlinkSync(filePath);
        return;
      } else {
        res.status(503).json({ succcess: false, message: 'Internal Server Error' });
        fs.unlinkSync(filePath);
        return;
      }
    } else {
      res.status(503).json({ succcess: false, message: 'Not enough storage. Need: ' + neededStorage + 'kb Have: ' + maxStorage + 'kb' });
      fs.unlinkSync(filePath);
      return;
    }
  } else res.status(400).json({ succcess: false, message: 'No file provided' });
  return;
});

module.exports = router;

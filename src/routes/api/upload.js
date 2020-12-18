/*
    The router for uploading a file
*/
const { secure, domain, subdomain } = require('../../config.json');

const { Router } = require('express');
const { existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const { addUserUpload, saveFile, getUserFromKey, addUserUploadSize } = require('../../mongo');
const { filePOST } = require('../../util/logger.js');
const { generateRandomString } = require('../../util');
const fileFunctionMap = require('../../util/fileFunction.js');

const router = Router();

const { auth } = require('../../middleware/authentication.js');

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
});
router.use(limiter);

let userStorageTypes = {
  bad: 1 * 1024 * 1024,
  default: 5 * 1024 * 1024,
  friend: 25 * 1024 * 1024,
  staff: 25 * 1024 * 1024,
  owner: Infinity,
  tester: Infinity,
};

const fileUpload = require('express-fileupload');
router.use(fileUpload({
  limits: {
    fileSize: Infinity,
  },
  useTempFiles: true,
}));

const createFileName = (fileExt, loc) => {
  let nFN = `${generateRandomString(15)}.${fileExt}`;
  let fileLocation = `./uploads/${loc}/${nFN}`;
  if (existsSync(fileLocation)) return createFileName(fileExt, loc);
  return nFN;
};

router.post('/', auth, (req, res) => {
  if (!req.files || !req.files.file) return res.status(400).json({
    error: 'No file was uploaded.',
  });
  if (req.userData.uploadSize + (req.files.file.size / 1024) > userStorageTypes[req.userData.userType])
    return res.json({
      error: `You do not have enough space left. Need: ${Math.round((req.userData.uploadSize +
        (req.files.file.size / 1024)) * 100) / 100}kb Have: ${Math.round((userStorageTypes[req.userData.userType] -
          req.userData.uploadSize) * 100) / 100}kb`,
    });

  saveFileFunction(req.userData, req.files.file, false, req, res);
});

router.post('/browser', async (req, res) => {
  let key = req.body.key;
  if (!key) return res.redirect('/upload?error=An unknown error has occured');

  let userData = await getUserFromKey(key);
  if (!userData) return res.redirect('/upload?error=An unknown error has occured');

  let file = req.files.file;
  if (!file) return res.redirect('/upload?error=An unknown error has occured');
  if (userData.uploadSize + (file.size / 1024) > userStorageTypes[userData.userType])
    return res.redirect(`/uploads?error=You do not have enough space left. Need: ${Math.round((userData.uploadSize +
      (file.size / 1024)) * 100) / 100}kb Have: ${Math.round((userStorageTypes[userData.userType] - userData.uploadSize) * 100) / 100}kb`);

  saveFileFunction(userData, req.files.file, true, req, res);
});

const saveFileFunction = (userData, file, browser, req, res) => {
  let location = userData.id;
  let fileName = file.name.split('.');
  let fileExt = fileName[fileName.length - 1];
  let name = createFileName(fileExt, location);

  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  let uploadDir = `uploads/${location}/${year}/${month}/${day}`;

  if (!existsSync(resolve('../', uploadDir)))
    mkdirSync(resolve('../', uploadDir), { recursive: true });

  file.mv(resolve('../', `${uploadDir}/${name}`), async err => {
    if (err) return res.status(500).send(err);

    await saveFile({
      originalName: file.name,
      uploader: userData.id,
      path: `${uploadDir}/${name}`,
      name: name,
      UploadedAt: new Date(),
      views: 0,
    });

    let protocol = secure ? 'https://' : 'http://';
    let lSubdomain = userData.subdomain === 'none' ? subdomain : userData.subdomain;
    let lDomain = userData.domain === 'none' ? domain : userData.domain;
    let linkPart = `${protocol + lSubdomain}.${lDomain}`;

    let url = `${linkPart}/files/${name}`;

    filePOST(name, req.ip, userData.key);
    await addUserUploadSize(userData.key, file.size / 1024);

    res.setHeader('Content-Type', 'application/json');
    if (browser) res.status(200).redirect(`/upload?success=${url}`);
    else res.status(200).end(url);

    let fileFunction = fileFunctionMap.get(fileExt);
    if (fileFunction) await fileFunction(uploadDir);

    await addUserUpload(userData.key);
  });
};

module.exports = router;

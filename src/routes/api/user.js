/*
    The router for user info
*/
const { Router, json, urlencoded } = require('express');
const { auth } = require('../../middleware/authentication');
const { userAPIGET, userAPIGETUPLOADS } = require('../../util/logger');
const { getAllFiles } = require('../../mongo');
const router = Router();

router.use(json());
router.use(urlencoded({ extended: false }));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
});
router.use(limiter);

router.get('/', auth, (req, res) => {
  let returnObject = {
    name: req.userData.name,
    owner: req.userData.owner,
    uploads: req.userData.uploads,
    redirects: req.userData.redirects,
    id: req.userData.id,
    created_at: new Date(req.userData.createdAt).toLocaleString(),
    subdomain: req.userData.subdomain,
    domain: req.userData.subdomain,
    user_type: req.userData.userType,
  };

  userAPIGET(req.userData.name, req.userData.key, req.ip);

  return res.status(200).json(returnObject);
});

router.get('/uploads', auth, async (req, res) => {
  let fileDataArray = await getAllFiles(req.userData.id);

  let returnArray = [];

  fileDataArray.forEach(e => {
    returnArray.push({
      name: e.name,
      uploader: req.userData.name,
      path: e.path,
      views: e.views,
      originalName: e.originalName,
      uploadedAt: new Date(e.UploadedAt).toLocaleString(),
    });
  });

  userAPIGETUPLOADS(req.userData.name, req.userData.key, req.ip);

  return res.status(200).json(returnArray);
});

module.exports = router;

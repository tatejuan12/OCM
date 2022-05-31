const aws = require("aws-sdk");
let multer = require("multer");
let multerS3 = require("multer-s3");
const {
  validateEscrowCancel,
} = require("xrpl/dist/npm/models/transactions/escrowCancel");

var s3 = new aws.S3({ endpoint: process.env.S3_ENDPOINT });
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sgp1",
});
const upload = multer({
  storage: multerS3({
    s3,
    bucket: "ocw-space",
    acl: "public",
    metadata: (req, file, cb) => {
      cb(null, {
        fieldname: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      cb(file.originalname);
    },
  }),
}).single("upload");

var methods = {
  uploadProfile: async function (req, img) {
    var result = false;
    const param = {
      Bucket: "ocw-space/profile-img",
      Key: req.session.wallet + "_profile.png",
      Body: img.buffer,
      ACL: "public-read",
    };
    const uploadPromise = new Promise(function (resolve, reject) {
      s3.upload(param, function (err, data) {
        if (err) reject(err);
        else resolve(true);
      });
    });

    result = await uploadPromise.catch((err) => {
      console.log(err);
      return false;
    });

    return result;
  },
  uploadCover: async function (req, img) {
    var result = false;
    const param = {
      Bucket: "ocw-space/cover-img",
      Key: req.session.wallet + "_cover.png",
      Body: img.buffer,
      ACL: "public-read",
    };
    const uploadPromise = new Promise(function (resolve, reject) {
      s3.upload(param, function (err, data) {
        if (err) reject("Coudn't save image");
        else resolve(true);
      });
    });

    result = await uploadPromise.catch((err) => {
      return false;
    });

    return result;
  },
  getProfileLink: function (wallet) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/profile-img/" +
      wallet +
      "_profile.png"
    );
  },
  getCover: function (wallet) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/cover-img/" +
      wallet +
      "_cover.png"
    );
  },
};
exports.functions = methods;

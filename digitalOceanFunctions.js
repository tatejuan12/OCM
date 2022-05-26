const aws = require("aws-sdk");
let multer = require("multer");
let multerS3 = require("multer-s3");
const {
  validateEscrowCancel,
} = require("xrpl/dist/npm/models/transactions/escrowCancel");
var s3 = new aws.S3({ endpoint: "sgp1.digitaloceanspaces.com" });

aws.config.update({
  accessKeyId: "S62NNA7GQ4VOPLM5XW26",
  secretAccessKey: "IANufU+Pc3DPT+WkI8Gg4MRYVfYXt3qdZdON89soijY",
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
      console.log(file);
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
        if (err) reject("Coudn't save image");
        else resolve(true);
      });
    });

    result = await uploadPromise.catch((err) => {
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
  getProfileLink: function (req) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/profile-img/" +
      req.session.wallet +
      "_profile.png"
    );
  },
  getCover: function (req) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/cover-img/" +
      req.session.wallet +
      "_cover.png"
    );
  },
};
exports.functions = methods;

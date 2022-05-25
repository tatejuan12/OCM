const aws = require("aws-sdk");
let multer = require("multer");
let multerS3 = require("multer-s3");
var s3 = new aws.S3({ endpoint: "sgp1.digitaloceanspaces.com" });

aws.config.update({
  accessKeyId: "IM5OSWEGBNJDM3RIYNJY",
  secretAccessKey: "ChMYOHqfYa2AE23kxRpdYbusIFpWMaJsFy+uShV4Og4",
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
  uploadProfile: function (req, img) {
    const param = {
      Bucket: "ocw-space/profile-img",
      Key: req.session.wallet + "_profile.png",
      Body: img.buffer,
      ACL: "public-read",
    };
    s3.upload(param, function (err, data) {
      result = true;
      if (err) console.log(err);
    });
  },
  uploadCover: function (req, img) {
    var result = false;
    const param = {
      Bucket: "ocw-space/cover-img",
      Key: req.session.wallet + "_profile.png",
      Body: img.buffer,
      ACL: "public-read",
    };
    s3.upload(param, function (err, data) {
      result = true;
      console.log(result);
      if (err) console.log(err);
    });
    console.log(result);
    return result;
  },
};
exports.functions = methods;

const sharp = require('sharp');
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
});
s3.config.region = "ap-southeast-1";
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
  uploadNFTImage: async function (req, img, epoch) {
    var result = false;
    const param = {
      Bucket: "ocw-space/nft-images",
      Key: req.session.wallet + epoch + ".png",
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
  uploadNFTJson: async function (req, json, epoch) {
    var result = false;
    let jsonStrng = JSON.stringify(json);
    const param = {
      Bucket: "ocw-space/nft-jsons",
      Key: req.session.wallet + epoch + ".json",
      Body: jsonStrng,
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
  uploadProfile: async function (req, img) {
    let result = false;
  
    // Convert and resize the image if necessary
    const compressedImageBuffer = await sharp(img.buffer)
      .resize(null, 200)
      .toFormat('jpeg', {
        quality: 50
      })
      .toBuffer({
        resolveWithObject: true
      });
  
    // Check if the image is larger than 100000 bytes
    if (compressedImageBuffer.info.size > 100000) {
      // If the image is larger, resize it again to make it smaller
      const smallerImageBuffer = await sharp(compressedImageBuffer.data)
        .resize(null, 100)
        .toFormat('jpeg', {
          quality: 50
        })
        .toBuffer();
  
      // Convert the smaller image to the WebP format
      var webpImageBuffer = await sharp(smallerImageBuffer)
        .webp()
        .toBuffer();
    } else {
      // If the image is small enough, convert it to the WebP format
      var webpImageBuffer = await sharp(compressedImageBuffer.data)
        .webp()
        .toBuffer();
    }
  
    // Set up the parameters for the S3 upload
    const param = {
      Bucket: "ocw-space/profile-img",
      Key: req.session.wallet + "_profile.webp",
      Body: webpImageBuffer,
      ACL: "public-read",
    };
  
    // Upload the image to the S3 bucket and handle any errors
    try {
      await s3.upload(param);
      result = true;
    } catch (err) {
      console.log(err);
      result = false;
    }
  
    return result;
  },
  uploadCollectionLogo: async function (fileName, img) {
    var result = false;
    const param = {
      Bucket: "ocw-space/collections/logo",
      Key: fileName + "_logo.webp",
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
  uploadCollectionBanner: async function (fileName, img) {
    var result = false;
    const param = {
      Bucket: "ocw-space/collections/banner",
      Key: fileName + "_banner.webp",
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
  getCollectionBannerLink: function (collectionName) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/collections/banner/" +
      collectionName +
      "_banner.webp"
    );
  },
  getCollectionLogoLink: function (collectionName) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/collections/logo/" +
      collectionName +
      "_logo.webp"
    );
  },
  getProductCollectionLogoLink: function (nftCollection) {
    return (
      "https://ocw-space.sgp1.digitaloceanspaces.com/collections/logo/" +
      nftCollection +
      "_logo.webp"
    );
  },
};
exports.functions = methods;

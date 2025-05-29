const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dm6h9dqyv',
  api_key: '236183946943424',
  api_secret: 'pkNCaXRjwlt8F7RjqUQ1g1fTcWA',
});

module.exports = cloudinary;
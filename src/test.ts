import ApibJson from './index';
const path = require('path');

const apibJson = new ApibJson();

apibJson.run(
  path.resolve('.', './example/'),
  path.resolve('.', './apib_json/')
);

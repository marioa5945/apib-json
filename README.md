# apib-json

- convention over configuration
- concise yet expressive

## Installation

```sh
# Locally in your project
yarn add apib-json --dev

npm install -D apib-json

# Or globally
yarn global add apib-json

npm install -g apib-json
```

## Usage

### Shell

```sh
apib-json folderUrl(apib) folderUrl(target)
```

### Code

```js
var ApibJson = require('ApibJson');

const apibJson = new ApibJson();

apibJson.run('./apibs/', './apib_json/');
```

## License

MIT

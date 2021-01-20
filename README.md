# apib-json

- convention over configuration
- concise yet expressive

## API Blueprint Parser

Apib-json is complex builder of [API Blueprint](http://apiblueprint.org). it uses "nodejs + typescript" convert multiple apib files into four json files.

API Blueprint is Web API documentation language. You can find API Blueprint documentation on the [API Blueprint site](http://apiblueprint.org).

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

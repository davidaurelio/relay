var config = exports;


config['browser'] = {
  env: 'browser',
  rootPath: '../',
  tests: [
    'test/*-test.js'
  ],
  sources: [
    'relay.js'
  ]
};

config.node = {
  env: 'node',
  rootPath: '../',
  tests: [
    'test/*-test.js'
  ]
};

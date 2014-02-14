var testModules = [];

define('referee', function() { return referee; });
define('assert', function() { return referee.assert; });
define('refute', function() { return referee.refute; });
define('expect', function() { return referee.expect; });
define('sinon', function() { return sinon; });
require.config({baseUrl: '/base'});

for (var fileName in __karma__.files) {
  if (/\/test\/.*-test.js/.test(fileName)) testModules.push(fileName);
}
require(testModules, function() {
  __karma__.start();
});

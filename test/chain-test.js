(function(require) {
  var buster = require('buster');
  var relay = require('../relay');
  var assert = buster.assert;

  var chain = relay.chain;
  function arbitraryCallback(error, value) {}

  buster.testCase('chain', {
    'creates a function': function() {
      assert.isFunction(chain(function() {}, function() {}));
    },
    'the created function': {
      'passes `initalArgs` to the first chained task': function() {
        var a = 'a', b = 'b', c = 'c';
        var firstTask = this.spy();

        chain(firstTask)(a, b, c, arbitraryCallback);

        assert.calledWith(firstTask, a, b, c);
      },

      'the values yielded by the first task are passed to the second task': function() {
        var d = 'd', e = 'e', f = 'f';
        var firstTask = this.stub().yields(null, d, e, f);
        var secondTask = this.spy();

        chain(firstTask, secondTask)(arbitraryCallback);
        assert.calledWith(secondTask, d, e, f);
      },

      'the values yielded by the second task are passed to the third task': function() {
        var g = 'g', h = 'h', i = 'i';
        var firstTask = this.stub().yields();
        var secondTask = this.stub().yields(null, g, h, i);
        var thirdTask = this.spy();

        chain(firstTask, secondTask, thirdTask)(null, arbitraryCallback);
        assert.calledWith(thirdTask, g, h, i);
      },

      'the values yielded by the last task are passed to the callback': function() {
        var j = 'j', k = 'k', l = 'l';
        var firstTask = this.stub().yields();
        var secondTask = this.stub().yields();
        var thirdTask = this.stub().yields(null, j, k, l);
        var callback = this.spy();

        chain(firstTask, secondTask, thirdTask)(callback);
        assert.calledWith(callback, null, j, k, l);
      },

      'errors yielded by an intermediate handler should propagate to the main callback': function() {
        var error = Error('arbitrary');
        var firstTask = this.stub().yields();
        var secondTask = this.stub().yields(error);
        var thirdTask = function() {};
        var callback = this.spy();

        chain(firstTask, secondTask, thirdTask)(null, callback);
        assert.calledWith(callback, error);
      }
    }
  });
})(typeof require === 'function' ? require :
    function(n) { return window[n.split('/').pop()]; });

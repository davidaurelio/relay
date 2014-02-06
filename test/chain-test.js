(function(require) {
  var referee = require('referee');
  var assert = referee.assert;
  var sinon = require('sinon');
  var relay = require('../relay');

  var chain = relay.chain;
  function arbitraryCallback(error, value) {}

  describe('chain', function() {
    it('creates a function',  function() {
      assert.isFunction(chain(function() {}, function() {}));
    });
    describe('the created function', function() {
      it('passes `initalArgs` to the first chained task',  function() {
        var a = 'a', b = 'b', c = 'c';
        var firstTask = sinon.spy();

        chain(firstTask)(a, b, c, arbitraryCallback);

        assert.calledWith(firstTask, a, b, c);
      });

      it('the values yielded by the first task are passed to the second task',  function() {
        var d = 'd', e = 'e', f = 'f';
        var firstTask = sinon.stub().yields(null, d, e, f);
        var secondTask = sinon.spy();

        chain(firstTask, secondTask)(arbitraryCallback);
        assert.calledWith(secondTask, d, e, f);
      });

      it('the values yielded by the second task are passed to the third task',  function() {
        var g = 'g', h = 'h', i = 'i';
        var firstTask = sinon.stub().yields();
        var secondTask = sinon.stub().yields(null, g, h, i);
        var thirdTask = sinon.spy();

        chain(firstTask, secondTask, thirdTask)(null, arbitraryCallback);
        assert.calledWith(thirdTask, g, h, i);
      });

      it('the values yielded by the last task are passed to the callback',  function() {
        var j = 'j', k = 'k', l = 'l';
        var firstTask = sinon.stub().yields();
        var secondTask = sinon.stub().yields();
        var thirdTask = sinon.stub().yields(null, j, k, l);
        var callback = sinon.spy();

        chain(firstTask, secondTask, thirdTask)(callback);
        assert.calledWith(callback, null, j, k, l);
      });

      it('errors yielded by an intermediate handler should propagate to the main callback',  function() {
        var error = Error('arbitrary');
        var firstTask = sinon.stub().yields();
        var secondTask = sinon.stub().yields(error);
        var thirdTask = function() {};
        var callback = sinon.spy();

        chain(firstTask, secondTask, thirdTask)(null, callback);
        assert.calledWith(callback, error);
      });
    });
  });
})(typeof require === 'function' ? require :
    function(n) { return window[n.split('/').pop()]; });

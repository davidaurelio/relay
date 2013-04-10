(function(require) {
  var buster = require('buster');
  var relay = require('../relay');
  var assert = buster.assert, refute = buster.refute;

  var combine = relay.combine;
  function arbitraryCallback(error, value) {}

  buster.testCase('combine', {
    'creates a function': function() {
      assert.isFunction(combine(function() {}, function() {}))
    },
    'the created function': {
      'invokes all passed task functions': function() {
        var taskA = this.spy(), taskB = this.spy(), taskC = this.spy();

        combine(taskA, taskB, taskC)(arbitraryCallback);
        assert.called(taskA);
        assert.called(taskB);
        assert.called(taskC);
      },

      'tasks receive arguments by position': function() {
        var taskA = this.spy(), taskB = this.spy();
        var taskC = function() {};

        var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e';
        combine(taskA, taskB, taskC)([a, b], [c, d, e], arbitraryCallback);

        assert.calledWith(taskA, a, b);
        assert.calledWith(taskB, c, d, e);
      },

      'values yielded by tasks are passed to the callback in task order': function(done) {
        var a = 'a', b = 'b', c = 'c';
        var taskA = this.stub().yieldsAsync(null, a);
        var taskB = this.stub().yields(null, b);
        var taskC = this.stub().yieldsAsync(null, c);

        var callback = this.spy(function() {
          assert.calledOnceWith(callback, null, a, b, c);
          done();
        });
        combine(taskA, taskB, taskC)(callback);
      },

      'if a tasks yields multiple values, they are wrapped in an array when passed to the callback': function() {
        var a1 = 'a1', a2 = 'a2';
        var b = 'b';
        var c1 = 'c1', c2 = 'c2';
        var taskA = this.stub().yields(null, a1, a2);
        var taskB = this.stub().yields(null, b);
        var taskC = this.stub().yields(null, c1, c2);

        var callback = this.spy();
        combine(taskA, taskB, taskC)(callback);
        assert.calledWith(callback, null, [a1, a2], b, [c1, c2]);
      },

      // the code had an off-by-one problem
      'the callback is not invoked if the first task didn\'t complete': function() {
        var taskA = this.stub();
        var taskB = this.stub().yields(null, {});
        var taskC = this.stub().yields(null, {});

        var callback = this.spy();
        combine(taskA, taskB, taskC)(callback);
        refute.called(callback);
      },

      'the callback is not invoked if the last task didn\'t complete': function() {
        var taskA = this.stub().yields(null, {});
        var taskB = this.stub().yields(null, {});
        var taskC = this.stub();

        var callback = this.spy();
        combine(taskA, taskB, taskC)(callback);
        refute.called(callback);
      },

      'the callback is invoked with the first error yielded': function() {
        var error = Error('arbitrary');
        var taskA = this.stub().yields(null, {});
        var taskB = this.stub().yields(error);
        var taskC = this.stub().yields(null, {});

        var callback = this.spy();
        combine(taskA, taskB, taskC)(callback);
        assert.calledWith(callback, error);
      },

      'the callback is invoked only once if an error is yielded': function() {
        var error = Error('arbitrary');
        var taskA = this.stub().yields(null, {});
        var taskB = this.stub().yields(error);
        var taskC = this.stub().yields(null, {});

        var callback = this.spy();
        combine(taskA, taskB, taskC)(callback);
        assert.calledOnce(callback);
      },

      'if an error is yielded, the callback is invoked with all values that are available at that point': function() {
        var taskCallbacks = [];
        function taskA(callback) { taskCallbacks[0] = callback; }
        function taskB(callback) { taskCallbacks[1] = callback; }
        function taskC(callback) { taskCallbacks[2] = callback; }
        function taskD(callback) { taskCallbacks[3] = callback; }

        var callback = this.spy();
        combine(taskA, taskB, taskC, taskD)(callback);

        var c1 = 'c1', c2 = 'c2';
        taskCallbacks[2](null, c1, c2);

        var a = 'a';
        taskCallbacks[0](null, a);

        var b1 = 'b2', b2 = 'b2';
        var error = Error('b');
        taskCallbacks[1](error, b1, b2);

        assert.calledWith(callback, error, a, [b1, b2], [c1, c2]);
      }
    }
  });
})(typeof require === 'function' ? require :
    function(n) { return window[n.split('/').pop()]; });

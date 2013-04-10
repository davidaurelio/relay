(function(global) {
  'use strict';

  function relay() {
    var slice = [].slice;

    function all(list, n) {
      for (var i = 0; i in list; i += 1) {}
      return i >= n;
    }

    /**
     * @module relay
     */
    return {
      /**
       * Composes multiple continuation-style functions ("tasks") into a
       * single function.
       *
       * Each task is called with the results yielded by the previous task. The
       * callback will be invoked with the first yielded error or the results
       * of the last task.
       *
       * @param {...function(...?=, function(Error, ...?=))} task Any number of
       *    continuation-style/asynchrounos functions / "tasks".
       * @returns {function(...?=, function(Error, ...?=))} A function taking
       *    any number of initial parameters (to be passed to the first task)
       *    and a callback to execute when all tasks have finished or an error
       *    has been yielded.
       */
      chain: function(task) {
        var tasks = arguments, n = tasks.length;
        return function() {
          var i = 0, task;
          var args = slice.call(arguments), callback = args.pop();
          (function next(error) {
            if (error) { return callback(error); }
            task = tasks[i];
            i += 1;
            task.apply(null,
              slice.call(arguments, 1).concat(i === n ? callback : next));
          }.apply(null, [null].concat(args)));
        };
      },

      /**
       * Combines multiple continuation-style functions ("tasks") into a
       * single function.
       *
       * All tasks are invoked immediately. The callback will be invoked with
       * the first yielded error (if any) and all results available at
       * that time.
       *
       * @param {...function(...?=, function(Error, ...?=))} task Any number of
       *    continuation-style functions / "tasks".
       * @returns {function(...Array, function(Error, ...?=))} A function taking
       *    arrays of arguments to be passed to the tasks and a callback to
       *    execute when all tasks have finished or an error has been yielded.
       */
      combine: function(task) {
        var tasks = arguments, n = tasks.length;
        return function() {
          var args = slice.call(arguments), callback = args.pop(), results = [];
          for (var i = 0; i < n; i += 1) {
            (function(task, args, i) {
              function taskCallback(error, result) {
                if (!callback) { return; }

                results[i] = arguments.length < 3 ?
                  result : slice.call(arguments, 1);

                if (error || all(results, n)) {
                  callback.apply(null, [error].concat(results));
                  callback = null;
                }
              }

              task.apply(null, args ? args.concat(taskCallback) : [taskCallback]);
            }(tasks[i], args.shift(), i));
          }
        }
      },

      /**
       * Creates a function that runs multiple continuation-style functions
       * ("tasks") in parallel (if they’re asynchronous).
       *
       * All tasks are invoked immediately. The callback will be invoked with
       * an array of yielded errors (if any, otherwise `null`) and the result of
       * all tasks. The callback is invoked once all tasks have finished
       *
       * @param {...function(...?=, function(Error, ...?=))} task Any number of
       *    asynchrounos/continuation-style functions / "tasks".
       * @returns {function(...Array, function(Error, ...?=))} A function taking
       *    arrays of arguments to be passed to the tasks and a callback to
       *    execute when all tasks have finished.
       */
      parallel: function(task) {
        var tasks = arguments, n = tasks.length;
        return function() {
          var args = slice.call(arguments), callback = args.pop(), results = [];
          var errors = [], hasError;
          for (var i = 0; i < n; i += 1) {
            (function(task, args, i) {
              function taskCallback(error, result) {
                if (!callback) { return; }

                results[i] = arguments.length < 3 ?
                  result : slice.call(arguments, 1);
                if (error) {
                  errors[i] = hasError = error;
                }

                if (all(results, n)) {
                  callback.apply(null, [hasError ? errors : null].concat(results));
                }
              }

              task.apply(null, args ? args.concat(taskCallback) : [taskCallback]);
            }(tasks[i], args.shift(), i));
          }
        }
      }
    };
  }

  if (typeof define == 'function') {
    define(relay);
  }
  else if (typeof module == 'object') {
    module.exports = relay();
  }
  else {
    global.relay = relay();
  }
}(this));

relay – minimal control flow for asynchronous/continuation-style functions
=====

**relay** offers three higher order functions to control flow of “node.js-style” functions – `chain`, `combine` and `parallel`. It is well-tested, runs in browsers and node.js, and it’s very small.

- The library works with functions that take “node-style” continuation callbacks as last argument, i.e. callbacks that expect an error or `null` as first argument, followed by values.
- `chain` creates a function that executes all passed functions (“tasks”) consecutively, passing on the yielded values to the next task. The main callback is invoked with the values yielded by the last task or the first error.
- `combine` creates a function that starts all passed tasks and invokes the main callback with all results after all tasks have finished or an error has been yielded.
- `parallel` works like `combine`, but won’t stop after the first error. If any errors were yielded, the first argument of the main callback will be a (sparse) array of errors, where the index of the error corresponds to the order of tasks.
- relay is tested in browsers (even IE6) and node.js. It should well work in other JS environments, too.
- It has only 1067&#x202f;bytes minified, and 463&#x202f;bytes gzip’ed.

Use it
-----

relay.js (the file) is compatible with plain browser environments, node.js and AMD loaders. Just throw it into your project.

```js
// browser: just use the global variable
relay.chain(/* ... */);

// node.js:
var relay = require('relay');

// AMD loaders – no global will be defined
define(['relay'], function(relay) { /* ... */ });
```

API
-----

### `chain(...task)(...arg, callback)`

`chain` takes any number of functions (“tasks”) and returns a new function.

When invoked, all tasks will be called consecutively, each recieving the values yielded by the previous task as arguments.

The created function takes any number of arguments (to be passed to the first task) and a callback function that will be executed with the values yielded by the last task **or the first error** yielded. Tasks must not call their callback more than once.

`chain` is useful for a series of tasks, where each task needs the result of the previous task.

#### Example

```js
var avgPowers2_3 = chain(
  function power2and3(base, callback) {
    callback(null, base * base, base * base * base);
  },
  function add(a, b, callback) {
    callback(null, a + b);
  },
  function half(a, callback) {
    callback(null, a / 2);
  });

function log(error, result) { console.log(result); }

avgPowers2_3(2, log); // logs ‘6’
avgPowers2_3(3, log); // logs ‘18’
avgPowers2_3(4, log); // logs ‘40’
```


### `combine(...task)(...args, callback)`

`combine` takes any number of functions (“tasks”) and returns a new function.

When invoked, all tasks will be called immediately with arguments that may be passed to the wrapper function.

The created function takes any number of arrays (to apply to the tasks as arguments) and a callback function that will be executed with the values yielded by all tasks **or the first error** yielded. If a task yields multiple values, they will be wrapped in an array. If a task yields only one value, it will not be wrapped.

Tasks must not call their callback more than once.

`combine` is useful when tasks don’t depend on each other, but the callback needs all values provided by the tasks.

#### Example

```js
// see the chain example for avgPowers2_3.

var compute = combine(
  // list tasks that take arguments first ...
  avgPowers2_3,
  function range(from, to, callback) {
    if (to < from) { return callback(RangeError('Invalid range')); }
    for (var result = [null]; from < to; from++) { result.push(from); }
    callback.apply(null, result);
  },
  // ... and tasks without arguments last
  function random(callback) {
    callback(null, Math.random());
  });

compute([5], // arguments for avgPowers2_3
        [4, 8], // arguments for range
        function callback(error, avg, range, random) {
          console.log(avg, range, random);
        });
// logs “75 [ 4, 5, 6, 7 ] 0.5832999693229795”
//                         ^^^^^^^^^^^^^^^^^^ value from last task
//          ^^^^^^^^^^^^^^ values from second task as array
//       ^^ value from first task


compute([5], [4, 3], function(error, avg, range, random) {
  console.error(error, avg, range, random);
});
// logs “[RangeError: Invalid range] 75 undefined undefined”
```

### `parallel(...task)(...args, callback)`

`parallel` takes any number of functions (“tasks”) and returns a new function. It works similar to `combine`, with the following exception:

Tasks yielding errors won’t short-circuit the invocation of the main callback. If any errors occur, the callback will receive a sparse array as first argument, containing all yielded errors according to
the task index, and all yielded values.

Tasks must not call their callback more than once.

`parallel` is useful when tasks don’t depend on each other, and the main callback does not need all values.

#### Example

```js
// see the chain example for avgPowers2_3.

var compute = parallel(
  // list tasks that take arguments first ...
  avgPowers2_3,
  function range(from, to, callback) {
    if (to < from) { return callback(RangeError('Invalid range')); }
    for (var result = [null]; from < to; from++) { result.push(from); }
    callback.apply(null, result);
  },
  // ... and tasks without arguments last
  function random(callback) {
    callback(null, Math.random());
  });

compute([5], [4, 3], function(error, avg, range, random) {
  console.error(error, avg, range, random);
});
// logs [ , [RangeError: Invalid range] ] 75 undefined 0.8862865746486932
```

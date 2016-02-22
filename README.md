![Travis CI](https://travis-ci.org/jccazeaux/processor.svg?branch=master)

# Description
Tiny library to execute code on multi threads. Result of each thread is resturned as a promise. Processor can use any promise library (see Promise chapter).

# Installation

* Download the [latest release](https://github.com/jccazeaux/processor/releases/download/v0.1.0/processor.min.js).
* Clone the repo: `git clone https://github.com/jccazeaux/processor.git`.
* Install with npm: `npm install promised-processor`.

# Quick start
## Create a new thread
```Javascript
var t = processor.thread(function(a, b) {
	return a + b;
});
```

## Execute thread
`thread` function returns an object containing a function `exec`. This function will execute the thread. All `exec` arguments will be sent to thread function.

```Javascript
t.exec(1, 2);
```

## Get result
`exec` function returns result of thread function as a `promise`.

```Javascript
t.exec(1, 2)
.then(function(res) {
	console.log(res); // 3
});
```

## Handle errors
Errors are handled by promise

```Javascript
processor.thread(function() {
	throw new Error("I failed");
})
.exec()
.catch(function(message) {
	console.log(message); // I failed
});
```

# Configuration
## Number of concurrent threads
By default `processor` will have a pool of two threads. You can configure this number with `config.nbThreads` function
```Javascript
processor.config.nbThreads(4);
```
Keep in mind it may be useless to configure more threads than the number of cores.

## Promises
`processor` can adapt to these promises library
* Ecmascript 2016 (default)
* [Q](http://documentup.com/kriskowal/q/)
* [Bluebird](http://bluebirdjs.com/)

You may define use any promise library. You just need to define an adapter. This adapter creates a function that creates the promises and takes `resolve` and `rejects` as parameters.

As an exemple, here is default adapter
```Javascript
function() {
	var res;
	if (window.Promise) {
		res = function(resolve, reject) {
			return new window.Promise(resolve, reject);
		};
	} else if (window.Q) {
		res = function(resolve, reject) {
			return Q.Promise(resolve, reject);
		};
	} else {
		throw "No recognized promise library nor ES6 Promise. Try to customize with processor.promiseAdapter";
	}
	return res;
}
```

To define a new one
```Javascript
processor.config.promiseAdapter(function() {
	return function(resolve, reject) {
		// Code your adapter here
	};
});
```
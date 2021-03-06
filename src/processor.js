/**
 * multi browser URL
 */
var $URL = window.URL || window.webkitURL;
/**
 * Number of active threads
 */
var activeThreads = 0;
var tasks = [];
var nbThreads = 2;

var config = {
	promiseAdapter: function(adapter) {
		internalPromiseAdapter = adapter;
		return this;
	},
	nbThreads: function(nb) {
		if (nb && !isNaN(nb)) {
			nbThreads = nb;
		} else {
			throw "Illegal argument : must be a number > 0"
		}
	}
};

/**
 * Adapter for multiple promise libraries
 */
var defaultPromiseAdapter = function() {
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
};


/**
 * Executes next task if exists
 */
function next() {
	activeThreads--;
	if (tasks && tasks.length > 0) {
		tasks.shift()();
	}
}

/**
 * Initialize a thread with a function. Returns an object containing a single "exec" function
 */
var thread = function(fn) {
	if (typeof fn !== "function") {
		throw "You must pass a function as Processor constructor's argument";
	}
	var resourceWorker = createResourceWorker(fn);
	
	return {
		/**
		 * Executes process on worker
		 * Can be called with any number of params
		 */
		exec: function() {
			var args = arguments;
			var $Promise = defaultPromiseAdapter();
			return new $Promise(function(resolve, reject) {
				var execution = function() {
					var worker = new Worker(resourceWorker);
					worker.addEventListener("message", function(e) {
						resolve(JSON.parse(e.data));
						next();
					});
					worker.addEventListener("error", function(e) {
						e.preventDefault();
						reject(e.message);
						next();
					});
					activeThreads++;
					var serializedArgs;
					try {
						serializedArgs = JSON.stringify([].slice.call(args));
					} catch (e) {
						reject("erreur " + e);
					}
					worker.postMessage(serializedArgs);
				};

				if (activeThreads < nbThreads) {
					execution();
				} else {
					tasks.push(function() {
						execution();
					});

				}
			});
		}
	};
};

/**
 * Gives current status of Processor
 * @return {Object} Object containing nbThreads, activeThreads and nbWaitingTasks
 */
var status = function() {
	return {
		nbThreads: nbThreads,
		activeThreads: activeThreads,
		nbWaitingTasks: tasks.length
	};
};

/**
 * Creates a new worker resource based on the function
 */
function createResourceWorker(fn) {
	var strResource = createWorkerScript(fn.toString());
	var resource = $URL.createObjectURL(new Blob([strResource], {type: 'text/javascript'}));
	return resource;
}

/**
 * Script of worker
 */
function createWorkerScript(fnString) {
	return "var __fn__ = " + fnString + ";" +
	"self.addEventListener('message', function(e) {" +
	"	var args = JSON.parse(e.data);" +
	"	var result = __fn__.apply(null, args);" +
	"	var serializedResult;" +
	"	try {" +
	"		serializedResult = JSON.stringify(result);" +
	"	} catch(e) {" +
	"		throw new Error('Result of thread must be serializable : ' + e.message);" +
	"	}" +
	"	self.postMessage(serializedResult);" +
	"	self.close();" +
	"});";
}

module.exports = {
	thread: thread,
	config: config,
	status: status
};
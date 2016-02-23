describe("Processor", function() {
	Processor.config.nbThreads(2);
	beforeEach(function() {
	});


	it("Runs code in thread", function(done) {
		Processor.thread(function(a) {return a + 1}).exec(1)
		.then(function(res) {
			res.should.be.exactly(2);
			done();
		})
		.catch(function(err) {
			console.log(err);
			done();
		});

	});

	it("Runs an array of threads", function(done) {
		var threadFn = function(a) {
			return a + 1;
		};
		var process1 = Processor.thread(threadFn);
		var process2 = Processor.thread(threadFn);
		var process3 = Processor.thread(threadFn);
		var process4 = Processor.thread(threadFn);
		var process5 = Processor.thread(threadFn);
		var process6 = Processor.thread(threadFn);
		Q.all([process1.exec(1), process2.exec(2), process3.exec(3), process4.exec(4), process5.exec(5), process6.exec(6)])
		.then(function(res) {
			res.should.be.eql([2, 3, 4, 5, 6, 7]);
			done();
		});
	});

	it("Queues threads", function(done) {
		var threadFn = function(a) {
			return a + 1;
		};
		var finished = 0;
		var processes = [
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn),
			Processor.thread(threadFn)
		];
		var nbProcesses = processes.length;
		processes.forEach(function (p) {
			p.exec(1)
			.then(function(res) {
				finished++;
				var remaining = nbProcesses - Processor.status().nbThreads - finished;
				var nbWaitingTasks = Processor.status().nbWaitingTasks;
				should(Processor.status().activeThreads <= 2).be.true;
				if (finished === nbProcesses) {
					done();
				}
			})
			.catch(function(err) {
				console.log(err)
			});
		});
	});

	it("Runs fibonacci in two threads", function(done) {
		this.timeout(30000);
		function fibonacci(n) {
			if (n === 0 || n === 1) return n;
			return fibonacci(n-1) + fibonacci(n-2);
		}
		var process1 = Processor.thread(fibonacci);
		var process2 = Processor.thread(fibonacci);
		Q.all([process1.exec(40), process2.exec(40)])
		.then(function(res) {
			res.should.be.eql([102334155, 102334155]);
			done();
		});
	});

	it("Runs code in thread with many arguments", function(done) {
		Processor.thread(function(a, b, c) {
			return a + b.name + c;
		})
		.exec("Hello", {name: " world "}, 2)
		.then(function(res) {
			res.should.be.exactly("Hello world 2");
			done();
		});
	});

	it("Fails when error in thread", function(done) {
		Processor.thread(function() {
			throw new Error('error');
		})
		.exec()
		.catch(function(message) {
			message.should.match(/error/);
			done();
		});
	});


});
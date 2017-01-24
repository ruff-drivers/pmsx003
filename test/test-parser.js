var EventEmitter = require('events');
var Parser = require('../src/parser.js');

require('t');
var normalData = Buffer.from([66,77,0,20,0,13,0,16,0,17,0,13,0,16,0,17,2,98,0,4,113,0,1,216]);
var syncData = Buffer.concat([Buffer.from([12,32]),normalData]);
var badData = Buffer.from(normalData);
badData[badData.length-1] = 21;
						
describe('test parser', function () {
		it('should parse normal data', function (done) {

				var emitter = new EventEmitter();
				emitter.on('data',function (data) { done(); });
				var parser = new Parser(emitter.emit.bind(emitter));
				parser.feed(normalData);

		});

		it('should report error for bad data', function (done) {

				var emitter = new EventEmitter();
				emitter.on('error',function (data) { done(); });
				var parser = new Parser(emitter.emit.bind(emitter));
				parser.feed(badData);

		});

		it('should be able to sync', function (done) {

				var emitter = new EventEmitter();
				emitter.on('data',function (data) { done(); });
				var parser = new Parser(emitter.emit.bind(emitter));
				parser.feed(syncData);

		});

		it('should be able to parse chunks', function (done) {

				var emitter = new EventEmitter();
				emitter.on('data',function (data) { done(); });
				var parser = new Parser(emitter.emit.bind(emitter));
				for (var i = 0; i <= syncData.length - 1; i++) {
						parser.feed(syncData.slice(i, i+1));	
				};

		});
});

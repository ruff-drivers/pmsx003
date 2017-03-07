'use strict';

var driver = require('ruff-driver');
var Parser = require('./parser.js');
var INTERVAL = 10;  // 10ms << 2s

module.exports = driver({
    attach: function (inputs) {
        var self = this;
        var uart = inputs['uart'];
        var parser = new Parser(self.emit.bind(self));
        var isProcessing = false;

        setInterval(function () {
            if (!isProcessing) {
                isProcessing = true;
                uart.read(function (err, data) {
                    parser.feed(data);
                    isProcessing = false;
                });
            }
        }, INTERVAL);

    },

    detach: function () {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = null;
        }
    },

    events: {
        data: 'emit on data received',
        error: 'emit on corrupt data'
    }
});

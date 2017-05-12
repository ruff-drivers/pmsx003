'use strict';

var driver = require('ruff-driver');
var Parser = require('./parser.js');

module.exports = driver({
    attach: function (inputs) {
        var self = this;
        var uart = inputs['uart'];
        var parser = new Parser(self.emit.bind(self));

        uart.on('data', function (data) {
            parser.feed(data);
        });

        uart.on('error', function (error) {
            parser.readError(error);
        });

    },

    detach: function () {
    },

    events: {
        data: 'emit on data received',
        error: 'emit on corrupt data'
    }
});

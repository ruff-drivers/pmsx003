'use strict';

var driver = require('ruff-driver');

var TIMEOUT = 3000;
var INTERVAL = 10;  // 10ms << 2s

function parseBuffer(buf) {
    if (buf.length < 2) 
        return;
    
    var checksum = 0;
    for (var i = 0; i < buf.length - 2; ++i) {
        checksum += buf.readUInt8(i);
    }

    if (checksum == buf.readInt16BE(buf.length - 2)) {
        var n = (buf.readInt16BE(2)-2)/2;
        var lst = new Array();
        for (var i = 0; i < n; i++) {
            lst.push(buf.readInt16BE(i*2+4));
        }
        return lst;
    }
}

function parseData(lst) {
    if (!lst) return;
    if (lst.length == 9) {
        return {
            'CF=1': {
                'PM1.0': lst[0],
                'PM2.5': lst[1],
                'PM10': lst[2],
            },
            'ATM': {
                'PM1.0': lst[3],
                'PM2.5': lst[4],
                'PM10': lst[5]
            },
            'reserved': [
                lst[6],
                lst[7],
                lst[8],
            ]
        };
    }
    if (lst.length == 13) {
        return {
            'CF=1': {
                'PM1.0': buf.readUInt16BE(4),
                'PM2.5': buf.readUInt16BE(6),
                'PM10': buf.readUInt16BE(8),
            },
            'ATM': {
                'PM1.0': buf.readUInt16BE(10),
                'PM2.5': buf.readUInt16BE(12),
                'PM10': buf.readUInt16BE(14)
            },
            'n': {
                '0.1um': buf.readUInt16BE(16),
                '0.5um': buf.readUInt16BE(18),
                '1.0um': buf.readUInt16BE(20),
                '2.5um': buf.readUInt16BE(22),
                '5.0um': buf.readUInt16BE(24),
                '10um': buf.readUInt16BE(26)
            },
            'reserved': [
                buf.readUInt16BE(26)
            ]
        };
    }
    // undefined return, might be error
}

module.exports = driver({
    attach: function (inputs) {
        var self = this;
        var uart = inputs['uart'];

        var tempBuffer = new Buffer(0);
        var nData;
        var nByte;
        var read = readLength;

        setInterval(function () {
            uart.read(function (err, data) {
                tempBuffer = Buffer.concat([tempBuffer, data]);
                var begin = tempBuffer.indexOf([66, 77]);

                if (begin >= 0) {
                    tempBuffer = tempBuffer.slice(begin);
                    read();
                }
            });
        }, INTERVAL);

        function readLength() {
            if (tempBuffer.length >= 4) {
                nData = (tempBuffer.readUInt16BE(2) - 2)/2;
                nByte = nData*2 + 6;
                console.log(nData, nByte);
                read = readData;
                read();
            }
        }

        function readData() {
            if (tempBuffer.length >= nByte) {
                var lst = parseBuffer(tempBuffer);
                var json = parseData(lst);
                if (json) {
                    self.emit('data', json);
                }
                tempBuffer = tempBuffer.slice(nByte);
            }             
        }

    },

    detach: function () {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = null;
        }
    },

    events: {
        data: 'emit on data received'
    }
});

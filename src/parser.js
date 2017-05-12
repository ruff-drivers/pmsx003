function Parser(emit) {
    this._emit = emit;
    this._buf = new Buffer(0);
    this._nData;
    this._nByte;
    this._read = this.readLength;
}

Parser.prototype.feed = function (buf) {
    this._buf = Buffer.concat([this._buf, buf]);
    var begin = this._buf.indexOf([66, 77]);

    if (begin >= 0) {
        this._buf = this._buf.slice(begin);
        this._read();
    }
}

Parser.prototype.readLength = function () {
    if (this._buf.length >= 4) {
        this._nData = (this._buf.readUInt16BE(2) - 2)/2;
        this._nByte = this._nData*2 + 6;
        this._read = this.readData;
        this._read();
    }
}

Parser.prototype.readError = function (error) {
    this._emit('error', error);
};

Parser.prototype.readData = function () {
    if (this._buf.length >= this._nByte) {
        var lst = parseBuffer(this._buf);
        if (!lst) { 
            this.readError(new Error('parse buffer failed'));
            return;
        }
        var json = parseData(lst);
        if (json) {
            this._emit('data', json);
        }
        this._buf = this._buf.slice(this._nByte);
    }             
}

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

module.exports = Parser;
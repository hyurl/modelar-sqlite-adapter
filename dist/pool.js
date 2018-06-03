"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var sqlite3_1 = require("sqlite3");
tslib_1.__exportStar(require("sqlite3"), exports);
var Pool = /** @class */ (function () {
    function Pool(filename, options) {
        this.connections = [];
        this.waitingQueue = [];
        this.filename = filename;
        this.mode = options && options.mode || (sqlite3_1.OPEN_READWRITE | sqlite3_1.OPEN_CREATE);
        this.max = options && options.max || 5;
        this.acquireTimeout = options && options.acquireTimeout || 5000;
    }
    Pool.prototype.create = function (cb) {
        var _this = this;
        var con = new sqlite3_1.Database(this.filename, this.mode);
        con.isUsed = true;
        con.release = function (cb) {
            con.isUsed = false;
            if (_this.waitingQueue.length) {
                var fn = _this.waitingQueue.shift();
                fn.call(con, null, con);
            }
            if (cb) {
                cb(null);
            }
        };
        this.connections.push(con);
        cb.call(con, null, con);
    };
    Pool.prototype.acquire = function (cb) {
        var _this = this;
        if (this.connections.length) {
            var con = void 0;
            for (var i in this.connections) {
                if (!this.connections[i].closed && !this.connections[i].isUsed) {
                    con = this.connections[i];
                    con.isUsed = true;
                    con.closed = false;
                    break;
                }
            }
            if (con) {
                cb.call(con, null, con);
            }
            else if (this.connections.length < this.max) {
                this.create(cb);
            }
            else {
                var acquired_1 = false, index_1 = this.waitingQueue.length, timer_1 = setTimeout(function () {
                    if (!acquired_1) {
                        _this.waitingQueue.splice(index_1, 1);
                        cb.call(undefined, new Error("acquire timeout"), null);
                    }
                }, this.acquireTimeout), fn = function (err, con) {
                    acquired_1 = true;
                    clearTimeout(timer_1);
                    cb.call(con, err, con);
                };
                this.waitingQueue.push(fn);
            }
        }
        else {
            this.create(cb);
        }
    };
    Pool.prototype.close = function (callback) {
        for (var i in this.connections) {
            this.connections[i].close(callback);
            this.connections[i].closed = true;
        }
    };
    return Pool;
}());
exports.Pool = Pool;
exports.default = Pool;
//# sourceMappingURL=pool.js.map
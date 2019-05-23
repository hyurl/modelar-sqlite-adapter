"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var modelar_1 = require("modelar");
var pool_1 = require("./pool");
var assign = require("lodash/assign");
var SqliteAdapter = /** @class */ (function (_super) {
    tslib_1.__extends(SqliteAdapter, _super);
    function SqliteAdapter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.inTransaction = false;
        return _this;
    }
    SqliteAdapter.prototype.connect = function (db) {
        var _this = this;
        if (SqliteAdapter.Pools[db.dsn] === undefined) {
            var config = assign({}, db.config);
            config.acquireTimeout = config.timeout;
            SqliteAdapter.Pools[db.dsn] = new pool_1.Pool(db.config.database, config);
        }
        return new Promise(function (resolve, reject) {
            SqliteAdapter.Pools[db.dsn].acquire(function (err, connection) {
                if (err) {
                    reject(err);
                }
                else {
                    _this.connection = connection;
                    resolve(db);
                }
            });
        });
    };
    SqliteAdapter.prototype.query = function (db, sql, bindings) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (db.command == "select" || db.command == "pragma") {
                // Deal with select or pragma statements.
                var statement_1 = _this.connection.prepare(sql);
                statement_1.all(bindings, function (err, rows) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        db.data = rows || [];
                        resolve(db);
                    }
                    statement_1.finalize();
                });
            }
            else {
                if (bindings) {
                    var statement_2 = _this.connection.prepare(sql);
                    statement_2.run(bindings, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            db.insertId = this.lastID;
                            db.affectedRows = this.changes;
                            resolve(db);
                        }
                        statement_2.finalize();
                    });
                }
                else {
                    _this.connection.exec(sql, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            if (db.command == "begin") {
                                _this.inTransaction = true;
                            }
                            else if (db.command == "commit"
                                || db.command == "rollback") {
                                _this.inTransaction = false;
                            }
                            resolve(db);
                        }
                    });
                }
            }
        });
    };
    SqliteAdapter.prototype.release = function () {
        var _this = this;
        if (this.connection) {
            if (this.inTransaction) {
                this.connection.exec("rollback", function () {
                    _this.inTransaction = false;
                    return _this.release();
                });
            }
            else {
                this.connection.release();
                this.connection = null;
            }
        }
    };
    SqliteAdapter.prototype.close = function () {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    };
    SqliteAdapter.close = function () {
        for (var i in SqliteAdapter.Pools) {
            SqliteAdapter.Pools[i].close();
            delete SqliteAdapter.Pools[i];
        }
    };
    SqliteAdapter.prototype.getDDL = function (table) {
        var columns = [];
        for (var key in table.schema) {
            var field = table.schema[key];
            if (field.primary && field.autoIncrement) {
                if (field.type.toLowerCase() !== "integer") {
                    field.type = "integer";
                    field.length = 0;
                }
                table["_autoIncrement"] = field.autoIncrement;
            }
            var type = field.type;
            if (field.length instanceof Array) {
                type += "(" + field.length.join(",") + ")";
            }
            else if (field.length) {
                type += "(" + field.length + ")";
            }
            var column = table.backquote(field.name) + " " + type;
            if (field.primary)
                column += " primary key";
            if (field.autoIncrement instanceof Array)
                column += " autoincrement";
            if (field.unique)
                column += " unique";
            if (field.unsigned)
                column += " unsigned";
            if (field.notNull)
                column += " not null";
            if (field.default === null)
                column += " default null";
            else if (field.default !== undefined)
                column += " default " + table.quote(field.default);
            if (field.comment)
                column += " comment " + table.quote(field.comment);
            if (field.foreignKey && field.foreignKey.table) {
                column += " references " +
                    table.backquote(field.foreignKey.table) +
                    " (" + table.backquote(field.foreignKey.field) + ")" +
                    " on delete " + field.foreignKey.onDelete +
                    " on update " + field.foreignKey.onUpdate;
            }
            ;
            columns.push(column);
        }
        return "create table " + table.backquote(table.name) +
            " (\n\t" + columns.join(",\n\t") + "\n)";
    };
    SqliteAdapter.prototype.create = function (table) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var ddl, increment, seqSql;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ddl = table.getDDL(), increment = table["_autoIncrement"];
                        return [4 /*yield*/, table.query("pragma foreign_keys = on")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, table.query(ddl)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, table.query("pragma foreign_keys = off")];
                    case 3:
                        _a.sent();
                        if (!increment) return [3 /*break*/, 5];
                        seqSql = "insert into sqlite_sequence (`name`, `seq`) " +
                            ("values ('" + table.name + "', " + (increment[0] - 1) + ")");
                        return [4 /*yield*/, table.query(seqSql)];
                    case 4:
                        _a.sent();
                        table.sql = ddl + ";\n" + seqSql;
                        _a.label = 5;
                    case 5: return [2 /*return*/, table];
                }
            });
        });
    };
    return SqliteAdapter;
}(modelar_1.Adapter));
exports.SqliteAdapter = SqliteAdapter;
(function (SqliteAdapter) {
    SqliteAdapter.Pools = {};
})(SqliteAdapter = exports.SqliteAdapter || (exports.SqliteAdapter = {}));
exports.SqliteAdapter = SqliteAdapter;
exports.default = SqliteAdapter;
//# sourceMappingURL=index.js.map
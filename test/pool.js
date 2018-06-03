"use strict";

const sqlite = require("../dist/pool");
const assert = require("assert");
const fs = require("fs");

var filename = "./example.db";

if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
}

describe("new Pool()", function () {
    describe("new Pool(filename: string)", function () {
        it("should create pool instance with a filename", function () {
            var pool = new sqlite.Pool("./example.db"),
                connection = null;

            assert.equal(pool.filename, "./example.db");
            assert.deepStrictEqual(pool.mode, sqlite.OPEN_CREATE | sqlite.OPEN_READWRITE);
            assert.deepStrictEqual(pool.max, 5);
            assert.deepStrictEqual(pool.acquireTimeout, 5000);
        });
    });

    describe("new Pool(filename: string, options: Options)", function () {
        it("should create pool instance with filename and options", function () {
            var pool = new sqlite.Pool("./example.db", {
                max: 2,
                acquireTimeout: 1000
            });
            assert.equal(pool.filename, "./example.db");
            assert.deepStrictEqual(pool.mode, sqlite.OPEN_CREATE | sqlite.OPEN_READWRITE);
            assert.deepStrictEqual(pool.max, 2);
            assert.deepStrictEqual(pool.acquireTimeout, 1000);
        });
    });
});

describe("Pool.prototype.acquire() & Pool.prototype.release()", function () {
    it("should acquire a connection as expected", function (done) {
        var pool = new sqlite.Pool("./example.db", {
            max: 2,
            acquireTimeout: 1000
        });

        var connection = null;

        pool.acquire(function () {
            setTimeout(() => {
                this.release();
            }, 100);
        });

        pool.acquire((err, con) => {
            if (err) return done(err);

            assert.strictEqual(pool.connections.length, 2);

            connection = con;

            var ddl = [
                "create table `users5` (",
                "  `id` integer primary key autoincrement not null,",
                "  `name` varchar(32) not null,",
                "  `email` varchar(255)",
                ")"
            ].join("\n");

            con.exec(ddl, function (err) {
                if (err) throw err;

                var sql = "insert into `users5` (`name`, `email`) values (?, ?)",
                    bindings = ["Ayon Lee", "i@hyurl.com"];

                con.prepare(sql).run(bindings, function (err) {
                        if (err) throw err;

                        var id = this.lastID,
                            sql = "select * from `users5` where `id` =  ?";

                        con.prepare(sql).get(id, function (err, row) {
                            if (err) throw err;

                            assert.deepStrictEqual(row, {
                                id: id,
                                name: "Ayon Lee",
                                email: "i@hyurl.com"
                            });

                            con.release();
                        });
                    });
            });
        });

        pool.acquire((err, con) => {
            if (err) return done(err);
            assert.equal(con, connection);
            assert.strictEqual(pool.connections.length, 2);
        });

        pool.acquire((err) => {
            assert.equal(err, null);
        });

        pool.acquire((err) => {
            assert.equal(err.name, "Error");
            
            done();
        });
    });
});
var DB = require("modelar").DB;
var SqliteAdapter = require("../../").SqliteAdapter;

module.exports = {
    type: "sqlite",
    database: process.cwd() + "/modelar.db"
};

DB.setAdapter("sqlite", SqliteAdapter);
DB.init(module.exports);
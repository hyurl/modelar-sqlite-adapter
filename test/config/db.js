var DB = require("modelar").DB;
var SqliteAdapter = require("../../").SqliteAdapter;

DB.setAdapter("sqlite", SqliteAdapter);

module.exports = {
    type: "sqlite",
    database: process.cwd() + "/modelar.db"
};
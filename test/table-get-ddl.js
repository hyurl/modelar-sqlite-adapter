var assert = require("assert");
var Table = require("modelar").Table;

describe("Table.prototype.getDDL()", function () {
    it("should generate DDL as expected", function () {
        var table = new Table("articles");

        table.addColumn("id").primary().autoIncrement().notNull();
        table.addColumn("title", "varchar", 255).unique().notNull();
        table.addColumn("content", "text");
        table.addColumn("user_id", "int", 10).default(null).foreignKey("users", "id");

        assert.equal(table.getDDL(), [
            "create table `articles` (",
            "\t`id` integer primary key autoincrement not null,",
            "\t`title` varchar(255) unique not null,",
            "\t`content` text,",
            "\t`user_id` int(10) default null references `users` (`id`) on delete set null on update no action",
            ")"
        ].join("\n"));
    });
});
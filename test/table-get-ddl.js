var assert = require("assert");
var Table = require("modelar").Table;

describe("Table.prototype.getDDL()", function () {
    it("should generate DDL as expected", function () {
        var table = new Table("articles");

        table.addColumn("id", "int").primary().autoIncrement().notNull();
        table.addColumn("title", "varchar", 255).unique().notNull().comment("The title of the current article.");
        table.addColumn("content", "text");
        table.addColumn("user_id", "int", 10).default(null).unsigned().foreignKey("users", "id");

        assert.equal(table.getDDL(), [
            "create table `articles` (",
            "\t`id` integer primary key autoincrement not null,",
            "\t`title` varchar(255) unique not null comment 'The title of the current article.',",
            "\t`content` text,",
            "\t`user_id` int(10) unsigned default null references `users` (`id`) on delete set null on update no action",
            ")"
        ].join("\n"));
    });
});
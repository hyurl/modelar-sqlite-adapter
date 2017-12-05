const Pool = require("better-sqlite-pool");
const { Adapter } = require("modelar");
const Pools = {};

class SqliteDBAdapter extends Adapter {

    /** Methods for DB */

    connect(db) {
        if (Pools[db._dsn] === undefined) {
            Pools[db._dsn] = new Pool(db._config.database, db._config);
        }
        return Pools[db._dsn].acquire().then(connection => {
            this.connection = connection;
            return db;
        });
    }

    query(db, sql, bindings = []) {
        if (this.connection === null) {
            return this.connect(db).then(db => {
                return this.query(db, sql, bindings);
            });
        }
        return new Promise((resolve, reject) => {
            var gets = ["select", "pragma"];
            if (gets.includes(db._command)) {
                // Deal with select or pragma statements.
                try {
                    db._data = this.connection.prepare(sql).all(bindings);
                    resolve(db);
                } catch (e) {
                    reject(e);
                }
            } else {
                try {
                    var res = this.connection.prepare(sql).run(bindings);
                    db.insertId = res.lastInsertROWID;
                    db.affectedRows = res.changes;
                    resolve(db);
                } catch (e) {
                    reject(e);
                }
            }
        });
    }

    release() {
        if (this.connection) {
            this.connection.release();
            this.connection = null;
        }
    }

    close() {
        if (this.connection)
            this.connection.close();
    }

    closeAll() {
        for (let i in Pools) {
            Pools[i].close();
            delete Pools[i];
        }
    }

    /** Methods for Table */

    getDDL(table) {
        var columns = [],
            sql;

        for (let field of table._fields) {
            if (field.primary && field.autoIncrement) {
                if (field.type.toLowerCase() !== "integer") {
                    field.type = "integer";
                    field.length = 0;
                }
                table._autoIncrement = field.autoIncrement;
            }
            if (field.length instanceof Array) {
                field.length = field.length.join(",");
            }
            if (field.length)
                field.type += "(" + field.length + ")";

            let column = table.backquote(field.name) + " " + field.type;

            if (field.primary)
                column += " primary key";
            if (field.autoIncrement instanceof Array)
                column += " autoincrement";
            if (field.default === null)
                column += " default null";
            else if (field.default !== undefined)
                column += " default " + table.quote(field.default);
            if (field.notNull)
                column += " not null";
            if (field.unsigned)
                column += " unsigned";
            if (field.unique)
                column += " unique";
            if (field.comment)
                column += " comment " + table.quote(field.comment);
            if (field.foreignKey.table) {
                column += " references " + table.backquote(field.foreignKey.table) +
                    " (" + table.backquote(field.foreignKey.field) + ")" +
                    " on delete " + field.foreignKey.onDelete +
                    " on update " + field.foreignKey.onUpdate;
            };
            columns.push(column);
        }

        sql = "create table " + table.backquote(table._table) +
            " (\n\t" + columns.join(",\n\t") + "\n)";

        return sql;
    }

    create(table) {
        var ddl = table.getDDL();
        return table.query(ddl).then(table => {
            if (table._autoIncrement) {
                var seqSql = `insert into sqlite_sequence (\`name\`, \`seq\`) values ('${table._table}', ${table._autoIncrement[0] - 1})`;
                return table.query(seqSql).then(table => {
                    table.sql = ddl + ";\n" + seqSql;
                    return table;
                });
            } else {
                return table;
            }
        });
    }

    /** Methods for Query */

    random(query) {
        query._orderBy = "random()";
        return query;
    }
}

module.exports = new SqliteDBAdapter;
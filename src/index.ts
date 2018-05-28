import { Adapter, DB, Table } from "modelar";
import { Pool, PoolConnection } from "better-sqlite-pool";

export class SqliteAdapter extends Adapter {
    connection: PoolConnection;
    static Pools: { [dsn: string]: Pool } = {};

    connect(db: DB): Promise<DB> {
        if (SqliteAdapter.Pools[db.dsn] === undefined) {
            SqliteAdapter.Pools[db.dsn] = new Pool(db.config.database, <any>db.config);
        }

        return SqliteAdapter.Pools[db.dsn].acquire().then(connection => {
            this.connection = connection;
            return db;
        });
    }

    query(db: DB, sql: string, bindings?: any[]): Promise<DB> {
        return new Promise((resolve, reject) => {
            if (db.command == "select" || db.command == "pragma") {
                // Deal with select or pragma statements.
                try {
                    db.data = this.connection.prepare(sql).all(bindings);
                    resolve(db);
                } catch (e) {
                    reject(e);
                }
            } else {
                try {
                    if (bindings) {
                        let res = this.connection.prepare(sql).run(bindings);
                        db.insertId = parseInt(<any>res.lastInsertROWID);
                        db.affectedRows = res.changes;
                    } else {
                        this.connection.exec(sql);
                    }
                    resolve(db);
                } catch (e) {
                    reject(e);
                }
            }
        });
    }

    release(): void {
        if (this.connection) {
            this.connection.release();
            this.connection = null;
        }
    }

    close(): void {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    }

    static close(): void {
        for (let i in SqliteAdapter.Pools) {
            SqliteAdapter.Pools[i].close();
            delete SqliteAdapter.Pools[i];
        }
    }

    getDDL(table: Table): string {
        var columns: string[] = [];

        for (let key in table.schema) {
            let field = table.schema[key];

            if (field.primary && field.autoIncrement) {
                if (field.type.toLowerCase() !== "integer") {
                    field.type = "integer";
                    field.length = 0;
                }
                table["_autoIncrement"] = field.autoIncrement;
            }

            let type = field.type;
            if (field.length instanceof Array) {
                type += "(" + field.length.join(",") + ")";
            } else if (field.length) {
                type += "(" + field.length + ")";
            }

            let column = table.backquote(field.name) + " " + type;

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
            };
            columns.push(column);
        }

        return "create table " + table.backquote(table.name) +
            " (\n\t" + columns.join(",\n\t") + "\n)";
    }

    create(table: Table): Promise<Table> {
        var ddl = table.getDDL(),
            increment: [number, number] = table["_autoIncrement"];

        return table.query(ddl).then(table => {
            if (increment) {
                var seqSql = "insert into sqlite_sequence (`name`, `seq`) " +
                    `values ('${table.name}', ${increment[0] - 1})`;

                return table.query(seqSql).then(table => {
                    table.sql = ddl + ";\n" + seqSql;
                    return table;
                });
            } else {
                return table;
            }
        });
    }
}
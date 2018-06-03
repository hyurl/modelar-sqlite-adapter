import { EventEmitter } from "events";
import { Database, OPEN_CREATE, OPEN_READWRITE } from "sqlite3";
export * from "sqlite3";

export interface Options {
    /**
     * One or more of `sqlite3.OPEN_READONLY`, `sqlite3.OPEN_READWRITE` 
     * and `sqlite3.OPEN_CREATE`. The default value is 
     * `OPEN_READWRITE | OPEN_CREATE`.
     */
    mode?: number;
    /** Maximum connections, default is `5`. */
    max?: number;
    acquireTimeout?: number;
}

export interface Connection extends Database {
    isUsed: boolean;
    closed: boolean;
    release(callback?: (err: Error) => void): void
}

export class Pool implements Options {
    readonly filename: string;
    readonly mode: number;
    readonly max: number;
    readonly acquireTimeout: number;
    private connections: Connection[] = [];
    private waitingQueue: Array<(this: Connection, err: Error, con: Connection) => void> = [];


    constructor(filename: string, options?: Options) {
        this.filename = filename;
        this.mode = options && options.mode || (OPEN_READWRITE | OPEN_CREATE);
        this.max = options && options.max || 5;
        this.acquireTimeout = options && options.acquireTimeout || 5000;
    }

    private create(cb: (this: Connection, err: Error, con: Connection) => void) {
        let con: Connection = <any>new Database(this.filename, this.mode);
        con.isUsed = true;
        con.release = (cb) => {
            con.isUsed = false;
            if (this.waitingQueue.length) {
                let fn = this.waitingQueue.shift();
                fn.call(con, null, con);
            }
            if (cb) {
                cb(null);
            }
        };
        this.connections.push(con);
        cb.call(con, null, con);
    }

    acquire(cb: (this: Connection, err: Error, con: Connection) => void) {
        if (this.connections.length) {
            let con: Connection;

            for (let i in this.connections) {
                if (!this.connections[i].closed && !this.connections[i].isUsed) {
                    con = this.connections[i];
                    con.isUsed = true;
                    con.closed = false;
                    break;
                }
            }

            if (con) {
                cb.call(con, null, con);
            } else if (this.connections.length < this.max) {
                this.create(cb);
            } else {
                let acquired = false,
                    index = this.waitingQueue.length,
                    timer = setTimeout(() => {
                        if (!acquired) {
                            this.waitingQueue.splice(index, 1);
                            cb.call(undefined, new Error("acquire timeout"), null);
                        }
                    }, this.acquireTimeout),
                    fn = (err, con) => {
                        acquired = true;
                        clearTimeout(timer);
                        cb.call(con, err, con);
                    };

                this.waitingQueue.push(fn);
            }
        } else {
            this.create(cb);
        }
    }

    close(callback?: (err: Error) => void): void {
        for (let i in this.connections) {
            this.connections[i].close(callback);
            this.connections[i].closed = true;
        }
    }
}

export default Pool;
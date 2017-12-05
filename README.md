# Modelar-Sqlite-Adapter

**This is an adapter for [Modelar](http://modelar.hyurl.com) to connect**
**SQLite database.**

## Install

```sh
npm install modelar-sqlite-adapter
```

## How To Use

```javascript
const { DB } = require("modelar");
const SqliteAdapter = require("modelar-sqlite-adapter");

DB.setAdapter("sqlite", SqliteAdapter).init({
    type: "sqlite",
    database: "sample.db"
});
```
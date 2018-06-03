# Modelar-Sqlite-Adapter

**This is an adapter for [Modelar](http://modelarjs.org) to connect**
**SQLite database.**

## Prerequisites

- `node` version higher than 4.0.0.
- `node-pre-gyp` installed (`npm i -g node-pre-gyp`) before install this 
	package.

## Install

```sh
npm install modelar-sqlite-adapter --save
```

## How To Use

```javascript
const { DB } = require("modelar");
const { SqliteAdapter } = require("modelar-sqlite-adapter");

DB.setAdapter("sqlite", SqliteAdapter);

// then using the type 'sqlite' in db.config
DB.init({
    type: "sqlite",
    database: "sample.db"
});
```
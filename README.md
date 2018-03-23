# Modelar-Sqlite-Adapter

**This is an adapter for [Modelar](http://modelarjs.org) to connect**
**SQLite database.**

## Install

```sh
npm install modelar-sqlite-adapter --save
```

The above command will install the latest version for Modelar 3.0+, if you're 
using Modelar 2.X, use the following command instead:

```sh
npm install modelar-sqlite-adapter --tag modelar2 --save
```

## How To Use

```javascript
const { DB } = require("modelar");
const { SqliteAdapter } = require("modelar-sqlite-adapter");

DB.setAdapter("sqlite", SqliteAdapter).init({
    type: "sqlite",
    database: "sample.db"
});
```
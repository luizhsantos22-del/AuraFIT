const { Pool } = require("pg");

const DB = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AuraFit',
    password: 'admin',
    port: 5433
});
module.exports = DB;
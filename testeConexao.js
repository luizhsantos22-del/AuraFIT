const DB = require("./db");

async function testeConexao() {
    console.log("Estou aqui")
    try {
        const resultado = await DB.query(
            `select now()`);
        console.log('Conexão bem sucedida!!');
        console.log(resultado.rows);
    }
    catch (erro) {
        console.log('Erro ao conectar:',
            erro.message);
    }
    finally {
        await DB.end();
    }
}

testeConexao();
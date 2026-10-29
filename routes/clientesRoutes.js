const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Clientes (Read)
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query("SELECT * FROM usuarios WHERE tipo = 'cliente' ORDER BY id ASC");
        res.render('clientes/index', { clientes: resultado.rows });
    } catch (erro) {
        console.log('Erro ao listar clientes: ' + erro);
        res.status(500).send('Erro ao buscar clientes');
    }
});

// Form Novo Cliente
router.get('/novo', (req, res) => {
    try {
        res.render('clientes/novo');
    } catch (erro) {
        console.log('Erro ao carregar formulário: ' + erro);
    }
});

// Salvar Novo Cliente
router.post('/novo', async (req, res) => {
    try {
        const { nome, email, senha, telefone, cpf } = req.body;
        await BD.query(
            "INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf) VALUES ($1, $2, $3, 'cliente', $4, $5)",
            [nome, email, senha || '123456', telefone, cpf]
        );
        res.redirect('/clientes');
    } catch (erro) {
        console.log('Erro ao cadastrar cliente: ' + erro);
        res.status(500).send('Erro ao salvar cliente');
    }
});

// Form Editar Cliente
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await BD.query("SELECT * FROM usuarios WHERE id = $1 AND tipo = 'cliente'", [id]);
        
        if (resultado.rows.length === 0) {
            return res.redirect('/clientes');
        }

        res.render('clientes/editar', { cliente: resultado.rows[0] });
    } catch (erro) {
        console.log('Erro ao buscar cliente para edição: ' + erro);
    }
});

// Atualizar Cliente
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, cpf } = req.body;
        await BD.query(
            'UPDATE usuarios SET nome = $1, email = $2, telefone = $3, cpf = $4 WHERE id = $5',
            [nome, email, telefone, cpf, id]
        );
        res.redirect('/clientes');
    } catch (erro) {
        console.log('Erro ao atualizar cliente: ' + erro);
    }
});

// Excluir Cliente
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BD.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.redirect('/clientes');
    } catch (erro) {
        console.log('Erro ao excluir cliente: ' + erro);
    }
});

module.exports = router;
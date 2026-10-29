const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Admins
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query("SELECT id, nome, email, tipo, situacao, criado_em FROM usuarios WHERE tipo = 'admin' ORDER BY id ASC");
        res.render('usuarios/index', { usuarios: resultado.rows });
    } catch (erro) {
        console.log('Erro ao listar usuários: ' + erro);
        res.status(500).send('Erro ao buscar usuários');
    }
});

// Form Novo Admin
router.get('/novo', (req, res) => {
    try {
        res.render('usuarios/novo');
    } catch (erro) {
        console.log('Erro ao carregar formulário: ' + erro);
    }
});

// Salvar Novo Admin
router.post('/novo', async (req, res) => {
    try {
        const { nome, email, senha, situacao } = req.body;
        const statusValido = situacao !== undefined ? parseInt(situacao) : 1;

        await BD.query(
            "INSERT INTO usuarios (nome, email, senha, tipo, situacao) VALUES ($1, $2, $3, 'admin', $4)",
            [nome, email, senha, statusValido]
        );
        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao cadastrar usuário: ' + erro);
        res.status(500).send('Erro ao salvar usuário');
    }
});

// Form Editar Admin
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await BD.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        if (resultado.rows.length === 0) {
            return res.redirect('/usuarios');
        }

        res.render('usuarios/editar', { usuario: resultado.rows[0] });
    } catch (erro) {
        console.log('Erro ao buscar usuário para edição: ' + erro);
    }
});

// Atualizar Admin
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha, situacao } = req.body;
        const statusValido = parseInt(situacao);

        await BD.query(
            'UPDATE usuarios SET nome = $1, email = $2, senha = $3, situacao = $4 WHERE id = $5',
            [nome, email, senha, statusValido, id]
        );
        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao atualizar usuário: ' + erro);
    }
});

// Excluir Admin
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BD.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao excluir usuário: ' + erro);
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const BD = require('../db');

// Read - Leitura
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(
            'SELECT * FROM categorias ORDER BY id ASC'
        );
        res.render('categorias/index', { categorias: resultado.rows });
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Create - Formulário
router.get('/novo', (req, res) => {
    try {
        res.render('categorias/novo');
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Create - Salvar
router.post('/novo', async (req, res) => {
    try {
        const { nome, descricao } = req.body;
        await BD.query(
            'INSERT INTO categorias (nome, descricao) VALUES ($1, $2)',
            [nome, descricao]
        );
        res.redirect('/categorias');
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Update - Formulário
router.get('/editar/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await BD.query(
            'SELECT * FROM categorias WHERE id = $1',
            [id]
        );
        res.render('categorias/editar', {
            categoria: resultado.rows[0]
        });
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Update - Salvar
router.post('/editar/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { nome, descricao } = req.body;
        await BD.query(
            'UPDATE categorias SET nome = $1, descricao = $2 WHERE id = $3',
            [nome, descricao, id]
        );
        res.redirect('/categorias');
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Delete
router.post('/excluir/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await BD.query(
            'DELETE FROM categorias WHERE id = $1',
            [id]
        );
        res.redirect('/categorias');
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

module.exports = router;
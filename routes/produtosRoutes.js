const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Produtos com Categoria
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.*, 
                c.nome AS categoria_nome 
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id ASC
        `;
        const resultado = await BD.query(sql);
        res.render('produtos/index', { produtos: resultado.rows });
    } catch (erro) {
        console.log('Erro ao listar produtos: ' + erro);
        res.status(500).send('Erro ao buscar produtos');
    }
});

// Form Novo Produto
router.get('/novo', async (req, res) => {
    try {
        const categorias = await BD.query('SELECT * FROM categorias ORDER BY nome ASC');
        res.render('produtos/novo', { categorias: categorias.rows });
    } catch (erro) {
        console.log('Erro ao carregar formulário: ' + erro);
    }
});

// Salvar Novo Produto
router.post('/novo', async (req, res) => {
    try {
        const { nome, descricao, preco, estoque_atual, imagem_url, categoria_id } = req.body;
        const sql = `
            INSERT INTO produtos (nome, descricao, preco, estoque_atual, imagem_url, categoria_id) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await BD.query(sql, [
            nome,
            descricao,
            parseFloat(preco),
            parseInt(estoque_atual),
            imagem_url || null,
            parseInt(categoria_id)
        ]);
        res.redirect('/produtos');
    } catch (erro) {
        console.log('Erro ao cadastrar produto: ' + erro);
        res.status(500).send('Erro ao salvar produto');
    }
});

// Form Editar
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const produtoResult = await BD.query('SELECT * FROM produtos WHERE id = $1', [id]);

        if (produtoResult.rows.length === 0) return res.redirect('/produtos');

        const categorias = await BD.query('SELECT * FROM categorias ORDER BY nome ASC');
        res.render('produtos/editar', {
            produto: produtoResult.rows[0],
            categorias: categorias.rows
        });
    } catch (erro) {
        console.log('Erro ao buscar produto: ' + erro);
    }
});

// Salvar Edição
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, estoque_atual, imagem_url, categoria_id } = req.body;
        const sql = `
            UPDATE produtos 
            SET nome = $1, descricao = $2, preco = $3, estoque_atual = $4, imagem_url = $5, categoria_id = $6 
            WHERE id = $7
        `;
        await BD.query(sql, [
            nome,
            descricao,
            parseFloat(preco),
            parseInt(estoque_atual),
            imagem_url || null,
            parseInt(categoria_id),
            id
        ]);
        res.redirect('/produtos');
    } catch (erro) {
        console.log('Erro ao atualizar produto: ' + erro);
    }
});

// Excluir Produto
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BD.query('DELETE FROM produtos WHERE id = $1', [id]);
        res.redirect('/produtos');
    } catch (erro) {
        console.log('Erro ao excluir produto: ' + erro);
    }
});

module.exports = router;
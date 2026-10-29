const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Vendas
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                v.id,
                v.valor_total,
                v.status,
                v.data_venda,
                u.nome AS cliente_nome,
                u.email AS cliente_email
            FROM vendas v
            INNER JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.id DESC;
        `);

        res.render('vendas/index', {
            vendas: resultado.rows
        });
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Form Nova Venda
router.get('/novo', async (req, res) => {
    try {
        const usuarios = await BD.query(`
            SELECT id, nome FROM usuarios 
            WHERE tipo = 'cliente' AND situacao = 1 
            ORDER BY nome ASC
        `);

        const produtos = await BD.query(`
            SELECT id, nome, preco, estoque_atual FROM produtos 
            WHERE estoque_atual > 0 
            ORDER BY nome ASC
        `);

        res.render('vendas/novo', {
            usuarios: usuarios.rows,
            produtos: produtos.rows
        });
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

// Salvar Nova Venda
router.post('/novo', async (req, res) => {
    try {
        const {
            usuario_id,
            produto_id,
            quantidade,
            status
        } = req.body;

        const prodResult = await BD.query('SELECT preco FROM produtos WHERE id = $1', [produto_id]);
        const precoUnitario = prodResult.rows[0].preco;
        const valorTotal = precoUnitario * parseInt(quantidade);

        const vendaResult = await BD.query(`
            INSERT INTO vendas (usuario_id, valor_total, status)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [usuario_id, valorTotal, status || 'concluida']);

        const vendaId = vendaResult.rows[0].id;

        await BD.query(`
            INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
            VALUES ($1, $2, $3, $4)
        `, [vendaId, produto_id, parseInt(quantidade), precoUnitario]);

        await BD.query(`
            UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2
        `, [parseInt(quantidade), produto_id]);

        res.redirect('/vendas');
    } catch (erro) {
        console.log('Erro: ' + erro);
    }
});

module.exports = router;
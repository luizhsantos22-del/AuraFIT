    const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Itens de Venda (com vendas e produtos para preencher os selects do modal)
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                iv.id,
                iv.venda_id,
                iv.produto_id,
                iv.quantidade,
                iv.preco_unitario,
                p.nome AS produto_nome,
                u.nome AS cliente_nome
            FROM itens_venda iv
            INNER JOIN produtos p ON iv.produto_id = p.id
            INNER JOIN vendas v ON iv.venda_id = v.id
            INNER JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY iv.id DESC
        `);

        const vendasRes = await BD.query(`
            SELECT v.id, u.nome AS cliente_nome 
            FROM vendas v 
            INNER JOIN usuarios u ON v.usuario_id = u.id 
            ORDER BY v.id DESC
        `);

        const produtosRes = await BD.query(`
            SELECT id, nome, preco, estoque_atual 
            FROM produtos 
            ORDER BY nome ASC
        `);

        res.render('itens_venda/index', { 
            itens: resultado.rows,
            vendas: vendasRes.rows,
            produtos: produtosRes.rows
        });
    } catch (erro) {
        console.log('Erro ao listar itens de venda: ' + erro);
        res.status(500).send('Erro ao buscar itens de venda');
    }
});

// Form Novo Item
router.get('/novo', async (req, res) => {
    try {
        const vendasRes = await BD.query(`
            SELECT v.id, u.nome AS cliente_nome 
            FROM vendas v 
            INNER JOIN usuarios u ON v.usuario_id = u.id 
            ORDER BY v.id DESC
        `);
        const produtosRes = await BD.query('SELECT id, nome, preco, estoque_atual FROM produtos ORDER BY nome ASC');

        res.render('itens_venda/novo', {
            vendas: vendasRes.rows,
            produtos: produtosRes.rows
        });
    } catch (erro) {
        console.log('Erro ao carregar formulário: ' + erro);
        res.redirect('/itens_venda');
    }
});

// Salvar Novo Item (e recalcula valor_total da venda e estoque)
router.post('/novo', async (req, res) => {
    try {
        const { venda_id, produto_id, quantidade, preco_unitario } = req.body;
        const qtd = parseInt(quantidade);
        const preco = parseFloat(preco_unitario);

        await BD.query(`
            INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
            VALUES ($1, $2, $3, $4)
        `, [venda_id, produto_id, qtd, preco]);

        await BD.query(`
            UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2
        `, [qtd, produto_id]);

        await BD.query(`
            UPDATE vendas 
            SET valor_total = (SELECT COALESCE(SUM(quantidade * preco_unitario), 0) FROM itens_venda WHERE venda_id = $1)
            WHERE id = $1
        `, [venda_id]);

        res.redirect('/itens_venda');
    } catch (erro) {
        console.log('Erro ao salvar item de venda: ' + erro);
        res.redirect('/itens_venda');
    }
});

// Form Editar Item
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const itemRes = await BD.query('SELECT * FROM itens_venda WHERE id = $1', [id]);
        if (itemRes.rows.length === 0) return res.redirect('/itens_venda');

        const vendasRes = await BD.query(`
            SELECT v.id, u.nome AS cliente_nome 
            FROM vendas v 
            INNER JOIN usuarios u ON v.usuario_id = u.id 
            ORDER BY v.id DESC
        `);
        const produtosRes = await BD.query('SELECT id, nome, preco FROM produtos ORDER BY nome ASC');

        res.render('itens_venda/editar', {
            item: itemRes.rows[0],
            vendas: vendasRes.rows,
            produtos: produtosRes.rows
        });
    } catch (erro) {
        console.log('Erro ao carregar edição: ' + erro);
        res.redirect('/itens_venda');
    }
});

// Salvar Edição (com ajuste proporcional do estoque)
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { venda_id, produto_id, quantidade, preco_unitario } = req.body;
        const novaQtd = parseInt(quantidade);

        const antigoRes = await BD.query('SELECT produto_id, quantidade FROM itens_venda WHERE id = $1', [id]);
        if (antigoRes.rows.length > 0) {
            const { produto_id: prodAntigo, quantidade: qtdAntiga } = antigoRes.rows[0];
            await BD.query('UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2', [qtdAntiga, prodAntigo]);
        }

        await BD.query(`
            UPDATE itens_venda 
            SET venda_id = $1, produto_id = $2, quantidade = $3, preco_unitario = $4
            WHERE id = $5
        `, [venda_id, produto_id, novaQtd, parseFloat(preco_unitario), id]);

        await BD.query('UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2', [novaQtd, produto_id]);

        await BD.query(`
            UPDATE vendas 
            SET valor_total = (SELECT COALESCE(SUM(quantidade * preco_unitario), 0) FROM itens_venda WHERE venda_id = $1)
            WHERE id = $1
        `, [venda_id]);

        res.redirect('/itens_venda');
    } catch (erro) {
        console.log('Erro ao atualizar item de venda: ' + erro);
        res.redirect('/itens_venda');
    }
});

// Excluir Item
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const itemRes = await BD.query('SELECT venda_id, produto_id, quantidade FROM itens_venda WHERE id = $1', [id]);

        if (itemRes.rows.length > 0) {
            const { venda_id, produto_id, quantidade } = itemRes.rows[0];
            await BD.query('DELETE FROM itens_venda WHERE id = $1', [id]);
            await BD.query('UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2', [quantidade, produto_id]);
            await BD.query(`
                UPDATE vendas 
                SET valor_total = (SELECT COALESCE(SUM(quantidade * preco_unitario), 0) FROM itens_venda WHERE venda_id = $1)
                WHERE id = $1
            `, [venda_id]);
        }

        res.redirect('/itens_venda');
    } catch (erro) {
        console.log('Erro ao excluir item de venda: ' + erro);
        res.redirect('/itens_venda');
    }
});

module.exports = router;
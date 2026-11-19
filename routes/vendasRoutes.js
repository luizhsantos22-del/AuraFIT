const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Vendas
router.get('/', async (req, res) => {
    try {
        const vendasRes = await BD.query(`
            SELECT 
                v.id,
                v.usuario_id,
                v.valor_total,
                v.status,
                v.data_venda,
                u.nome AS cliente_nome,
                u.email AS cliente_email
            FROM vendas v
            INNER JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.data_venda DESC, v.id DESC
        `);

        const usuariosRes = await BD.query(`
            SELECT id, nome FROM usuarios 
            ORDER BY nome ASC
        `);

        const produtosRes = await BD.query(`
            SELECT id, nome, preco, estoque_atual 
            FROM produtos 
            ORDER BY nome ASC
        `);

        res.render('vendas/index', { 
            vendas: vendasRes.rows,
            usuarios: usuariosRes.rows,
            produtos: produtosRes.rows
        });
    } catch (erro) {
        console.error('Erro ao listar vendas:', erro);
        res.status(500).send('Erro ao buscar vendas: ' + erro.message);
    }
});

// Form Nova Venda
router.get('/novo', async (req, res) => {
    try {
        const usuariosRes = await BD.query('SELECT id, nome FROM usuarios ORDER BY nome ASC');
        const produtosRes = await BD.query('SELECT id, nome, preco, estoque_atual FROM produtos ORDER BY nome ASC');

        res.render('vendas/novo', {
            usuarios: usuariosRes.rows,
            produtos: produtosRes.rows
        });
    } catch (erro) {
        console.error('Erro ao carregar formulário de venda:', erro);
        res.redirect('/vendas');
    }
});

// Salvar Nova Venda
router.post('/novo', async (req, res) => {
    try {
        const { usuario_id, produto_id, quantidade, status } = req.body;
        const qtd = parseInt(quantidade) || 1;
        const statusVenda = status || 'concluida';

        // 1. Busca o preço do produto no banco
        const prodRes = await BD.query('SELECT preco FROM produtos WHERE id = $1', [produto_id]);
        if (prodRes.rows.length === 0) {
            return res.status(400).send('Produto não encontrado.');
        }

        const precoUnitario = parseFloat(prodRes.rows[0].preco);
        const valorTotal = precoUnitario * qtd;

        // 2. Insere na tabela vendas e pega o ID gerado
        const vendaRes = await BD.query(`
            INSERT INTO vendas (usuario_id, valor_total, status, data_venda)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING id
        `, [usuario_id, valorTotal, statusVenda]);

        const vendaId = vendaRes.rows[0].id;

        // 3. Insere o item correspondente em itens_venda
        await BD.query(`
            INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
            VALUES ($1, $2, $3, $4)
        `, [vendaId, produto_id, qtd, precoUnitario]);

        // 4. Desconta do estoque atual
        await BD.query(`
            UPDATE produtos 
            SET estoque_atual = estoque_atual - $1 
            WHERE id = $2
        `, [qtd, produto_id]);

        res.redirect('/vendas');
    } catch (erro) {
        console.error('Erro ao salvar venda:', erro);
        res.status(500).send('Erro ao salvar venda: ' + erro.message);
    }
});

// Form Editar Venda
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vendaRes = await BD.query('SELECT * FROM vendas WHERE id = $1', [id]);
        if (vendaRes.rows.length === 0) return res.redirect('/vendas');

        const usuariosRes = await BD.query('SELECT id, nome FROM usuarios ORDER BY nome ASC');

        res.render('vendas/editar', {
            venda: vendaRes.rows[0],
            usuarios: usuariosRes.rows
        });
    } catch (erro) {
        console.error('Erro ao carregar edição da venda:', erro);
        res.redirect('/vendas');
    }
});

// Salvar Edição da Venda
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, valor_total, status } = req.body;

        await BD.query(`
            UPDATE vendas 
            SET usuario_id = $1, valor_total = $2, status = $3 
            WHERE id = $4
        `, [usuario_id, parseFloat(valor_total), status, id]);

        res.redirect('/vendas');
    } catch (erro) {
        console.error('Erro ao atualizar venda:', erro);
        res.redirect('/vendas');
    }
});

// Excluir Venda
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BD.query('DELETE FROM itens_venda WHERE venda_id = $1', [id]);
        await BD.query('DELETE FROM vendas WHERE id = $1', [id]);
        res.redirect('/vendas');
    } catch (erro) {
        console.error('Erro ao excluir venda:', erro);
        res.redirect('/vendas');
    }
});

module.exports = router;
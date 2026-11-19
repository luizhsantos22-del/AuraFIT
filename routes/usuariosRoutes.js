const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar Usuários (Admins/Operadores)
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(
            "SELECT id, nome, email, tipo AS perfil, situacao, criado_em FROM usuarios ORDER BY id ASC"
        );
        res.render('usuarios/index', { 
            usuarios: resultado.rows,
            usuario: req.session.usuario 
        });
    } catch (erro) {
        console.log('Erro ao listar usuários: ' + erro);
        res.status(500).send('Erro ao buscar usuários');
    }
});

// Form Novo Usuário
router.get('/novo', (req, res) => {
    try {
        res.render('usuarios/novo', { usuario: req.session.usuario });
    } catch (erro) {
        console.log('Erro ao carregar formulário: ' + erro);
    }
});

// Salvar Novo Usuário
router.post('/novo', async (req, res) => {
    try {
        const { nome, email, senha, perfil, situacao } = req.body;
        const tipoUsuario = perfil || 'Administrador Geral';
        const statusValido = situacao !== undefined ? parseInt(situacao) : 1;

        await BD.query(
            "INSERT INTO usuarios (nome, email, senha, tipo, situacao) VALUES ($1, $2, $3, $4, $5)",
            [nome, email, senha, tipoUsuario, statusValido]
        );
        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao cadastrar usuário: ' + erro);
        res.status(500).send('Erro ao salvar usuário');
    }
});

// Form Editar Usuário
router.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await BD.query(
            'SELECT id, nome, email, tipo AS perfil, situacao FROM usuarios WHERE id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.redirect('/usuarios');
        }

        res.render('usuarios/editar', { 
            usuarioEdit: resultado.rows[0],
            usuario: req.session.usuario
        });
    } catch (erro) {
        console.log('Erro ao buscar usuário para edição: ' + erro);
        res.redirect('/usuarios');
    }
});

// Atualizar Usuário
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha, perfil, situacao } = req.body;
        const tipoUsuario = perfil || 'Administrador Geral';
        const statusValido = situacao !== undefined ? parseInt(situacao) : 1;

        // Só atualiza a senha se o campo foi preenchido
        if (senha && senha.trim() !== '') {
            await BD.query(
                'UPDATE usuarios SET nome = $1, email = $2, senha = $3, tipo = $4, situacao = $5 WHERE id = $6',
                [nome, email, senha, tipoUsuario, statusValido, id]
            );
        } else {
            await BD.query(
                'UPDATE usuarios SET nome = $1, email = $2, tipo = $3, situacao = $4 WHERE id = $5',
                [nome, email, tipoUsuario, statusValido, id]
            );
        }

        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao atualizar usuário: ' + erro);
        res.status(500).send('Erro ao atualizar usuário');
    }
});

// Excluir Usuário
router.post('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BD.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.redirect('/usuarios');
    } catch (erro) {
        console.log('Erro ao excluir usuário: ' + erro);
        res.status(500).send('Erro ao excluir usuário');
    }
});

module.exports = router;
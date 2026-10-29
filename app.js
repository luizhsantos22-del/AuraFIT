//definição do servidor
const express = require('express');
const session = require("express-session");
const app = express();

//configuração das rotas
const router = express.Router();
//configuração do banco de dados
const BD = require('./db');

//configuração do EJS
app.set("view engine", "ejs");

//disponibilizar os arquivos
app.use(express.static("Public"));

//codificação das rotas
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//definir o session
app.use(session({
    secret: "SESISENAI",
    resave: false,
    saveUninitialized: false
}));

//controle de rotas
function exigirLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    next();
}

// ============================================
// ROTAS PÚBLICAS E LANDING PAGE
// ============================================

// Rota Inicial (Vitrine do E-commerce)
app.get("/", async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                p.id,
                p.nome,
                p.descricao,
                p.preco,
                p.estoque_atual,
                p.imagem_url,
                c.nome AS nome_categoria
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id ASC
        `);
        const listaProdutos = resultado.rows;
        res.render("landing/index", {
            listaProdutos
        });
    } catch (erro) {
        console.log("Erro ao consultar produtos: " + erro);
        res.render("landing/index", {
            listaProdutos: []
        });
    }
});

// Vitrine de Judô
app.get("/judo", async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                p.id, 
                p.nome,
                p.descricao, 
                c.nome as nome_categoria, 
                p.categoria_id,
                p.preco,
                p.imagem_url
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%judô%' OR LOWER(c.nome) LIKE '%judo%' OR p.categoria_id = 1;
        `);
        const produtosJudo = resultado.rows;
        
        res.render("landing/judo", {
            produtos: produtosJudo,
            produtosJudo: produtosJudo,
            totalProdutos: produtosJudo.length
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/judo", {
            produtos: [],
            produtosJudo: [],
            totalProdutos: 0
        });
    }
});

// Vitrine de Muay Thai
app.get("/muaythai", async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                p.id, 
                p.nome,
                p.descricao, 
                c.nome as nome_categoria, 
                p.categoria_id,
                p.preco,
                p.imagem_url
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%Muay Thai%' OR LOWER(c.nome) LIKE '%muaythai%' OR p.categoria_id = 2;
        `);
        const produtosMuay = resultado.rows;
        
        res.render("landing/muay-thai", {
            produtos: produtosMuay,
            produtosMuay: produtosMuay,
            totalProdutos: produtosMuay.length
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/muay-thai", {
            produtos: [],
            produtosMuay: [],
            totalProdutos: 0
        });
    }
});

// Vitrine de CrossFit
app.get("/crossfit", async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                p.id, 
                p.nome,
                p.descricao, 
                c.nome as nome_categoria, 
                p.categoria_id,
                p.preco,
                p.imagem_url
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%CrossFit%' OR LOWER(c.nome) LIKE '%crossfit%' OR p.categoria_id = 3;
        `);
        const produtosCross = resultado.rows;
        
        res.render("landing/crossfit", {
            produtos: produtosCross,
            produtosCross: produtosCross,
            totalProdutos: produtosCross.length
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/crossfit", {
            produtos: [],
            produtosCross: [],
            totalProdutos: 0
        });
    }
});

// Rota de Login (GET)
app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

// Rota de Login (POST)
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const resultado = await BD.query(`
            SELECT id, nome, email, tipo 
            FROM usuarios
            WHERE email = $1 AND senha = $2 AND situacao = 1
        `, [email, senha]);

        if (resultado.rows.length === 0) {
            return res.render('login', {
                erro: 'E-mail ou senha inválidos'
            });
        }

        // Gravar sessão
        req.session.usuario = resultado.rows[0];
        res.redirect('/admin');

    } catch (erro) {
        console.log('Erro ao fazer login: ' + erro);
        res.render('login', { erro: 'Erro interno no servidor' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ============================================
// ROTAS DE ADMINISTRAÇÃO E PAINEL
// ============================================

// Painel do Admin
app.get("/admin", exigirLogin, (req, res) => {
    res.render('admin', {
        usuario: req.session.usuario
    });
});

// Dashboard de Vendas e Indicadores
app.get('/dashboard', exigirLogin, async (req, res) => {
    try {
        const totalProdutos = await BD.query(`SELECT count(*) as total FROM produtos`);
        const totalClientes = await BD.query(`SELECT count(*) as total FROM usuarios WHERE tipo = 'cliente'`);
        const totalVendas = await BD.query(`SELECT count(*) as total FROM vendas`);
        const usuariosAtivos = await BD.query(`SELECT count(*) as total FROM usuarios WHERE situacao = 1`);

        const vendasStatus = await BD.query(`
            SELECT status, count(*) as total
            FROM vendas
            GROUP BY status
            ORDER BY status
        `);

        const produtosCategoria = await BD.query(`
            SELECT c.nome as categoria, count(p.id) as total
            FROM categorias c
            LEFT JOIN produtos p ON p.categoria_id = c.id
            GROUP BY c.id, c.nome
            ORDER BY c.nome
        `);

        res.render('dashboard', {
            usuario: req.session.usuario,
            totalProdutos: totalProdutos.rows[0].total,
            totalClientes: totalClientes.rows[0].total,
            totalVendas: totalVendas.rows[0].total,
            usuariosAtivos: usuariosAtivos.rows[0].total,
            vendasStatus: vendasStatus.rows,
            produtosCategoria: produtosCategoria.rows
        });

    } catch (erro) {
        console.log('Erro no Dashboard: ' + erro);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});

// ============================================
// REGISTRO DOS MÓDULOS DE ROTAS
// ============================================

// Rotas - Produtos (substitui a eventosRoutes)
const produtosRoutes = require('./routes/produtosRoutes');
app.use('/produtos', exigirLogin, produtosRoutes);

// Rotas - Clientes (substitui a participantesRoutes)
const clientesRoutes = require('./routes/clientesRoutes');
app.use('/clientes', exigirLogin, clientesRoutes);

// Rotas - Categorias
const categoriasRoutes = require('./routes/categoriasRoutes');
app.use('/categorias', exigirLogin, categoriasRoutes);

// Rotas - Vendas (substitui a inscricaoRoutes)
const vendasRoutes = require('./routes/vendasRoutes');
app.use('/vendas', exigirLogin, vendasRoutes);

// Rotas - Usuários (Administradores)
const usuariosRoutes = require('./routes/usuariosRoutes');
app.use('/usuarios', exigirLogin, usuariosRoutes);

//execução do servidor
const porta = 3001;
app.listen(porta, () => {
    console.log(`Servidor rodando em: http://localhost:${porta}`);
});
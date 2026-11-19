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

// Rota Inicial (Vitrine do E-commerce com Busca)
app.get('/', async (req, res) => {
    try {
        const termoBusca = (req.query.busca || '').trim();
        let listaProdutos = [];

        if (termoBusca !== '') {
            // Normaliza caso o usuário digite sem acento (ex: "judo")
            const termoNormalizado = termoBusca
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const sql = `
                SELECT 
                    p.id,
                    p.nome,
                    p.descricao,
                    p.preco,
                    p.imagem_url,
                    c.nome AS categoria_nome
                FROM produtos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE 
                    p.nome ILIKE $1
                    OR c.nome ILIKE $1
                    OR TRANSLATE(LOWER(p.nome), 'áàãâéêíóôõúüç', 'aaaaeeiooouuc') ILIKE $2
                    OR TRANSLATE(LOWER(c.nome), 'áàãâéêíóôõúüç', 'aaaaeeiooouuc') ILIKE $2
                ORDER BY p.nome ASC
            `;

            const valores = [
                `%${termoBusca}%`,
                `%${termoNormalizado.toLowerCase()}%`
            ];

            const resultado = await BD.query(sql, valores);
            listaProdutos = resultado.rows;
        }

        res.render('landing/index', {
            termoBusca,
            listaProdutos
        });
    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).send('Erro interno ao realizar a busca.');
    }
});

// Vitrine de Judô (com Paginação)
app.get("/judo", async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = 8;
        const offset = (pagina - 1) * limite;
        const busca = req.query.busca || '';
        const ordem = req.query.ordem || '';

        const totalRes = await BD.query(`
            SELECT COUNT(*) AS total
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%judô%' OR LOWER(c.nome) LIKE '%judo%' OR p.categoria_id = 1
        `);
        const totalProdutos = parseInt(totalRes.rows[0].total, 10);
        const totalPaginas = Math.max(1, Math.ceil(totalProdutos / limite));

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
            WHERE LOWER(c.nome) LIKE '%judô%' OR LOWER(c.nome) LIKE '%judo%' OR p.categoria_id = 1
            ORDER BY p.id ASC
            LIMIT $1 OFFSET $2
        `, [limite, offset]);

        const produtosJudo = resultado.rows;
        
        res.render("landing/judo", {
            produtos: produtosJudo,
            produtosJudo: produtosJudo,
            totalProdutos,
            pagina,
            totalPaginas,
            busca,
            ordem
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/judo", {
            produtos: [],
            produtosJudo: [],
            totalProdutos: 0,
            pagina: 1,
            totalPaginas: 1,
            busca: '',
            ordem: ''
        });
    }
});

// Vitrine de Muay Thai (com Paginação)
app.get("/muaythai", async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = 8;
        const offset = (pagina - 1) * limite;
        const busca = req.query.busca || '';
        const ordem = req.query.ordem || '';

        const totalRes = await BD.query(`
            SELECT COUNT(*) AS total
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%muay thai%' OR LOWER(c.nome) LIKE '%muaythai%' OR p.categoria_id = 2
        `);
        const totalProdutos = parseInt(totalRes.rows[0].total, 10);
        const totalPaginas = Math.max(1, Math.ceil(totalProdutos / limite));

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
            WHERE LOWER(c.nome) LIKE '%muay thai%' OR LOWER(c.nome) LIKE '%muaythai%' OR p.categoria_id = 2
            ORDER BY p.id ASC
            LIMIT $1 OFFSET $2
        `, [limite, offset]);

        const produtosMuay = resultado.rows;
        
        res.render("landing/muay-thai", {
            produtos: produtosMuay,
            produtosMuay: produtosMuay,
            totalProdutos,
            pagina,
            totalPaginas,
            busca,
            ordem
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/muay-thai", {
            produtos: [],
            produtosMuay: [],
            totalProdutos: 0,
            pagina: 1,
            totalPaginas: 1,
            busca: '',
            ordem: ''
        });
    }
});

// Vitrine de CrossFit (com Paginação)
app.get("/crossfit", async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = 8;
        const offset = (pagina - 1) * limite;
        const busca = req.query.busca || '';
        const ordem = req.query.ordem || '';

        const totalRes = await BD.query(`
            SELECT COUNT(*) AS total
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nome) LIKE '%crossfit%' OR p.categoria_id = 3
        `);
        const totalProdutos = parseInt(totalRes.rows[0].total, 10);
        const totalPaginas = Math.max(1, Math.ceil(totalProdutos / limite));

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
            WHERE LOWER(c.nome) LIKE '%crossfit%' OR p.categoria_id = 3
            ORDER BY p.id ASC
            LIMIT $1 OFFSET $2
        `, [limite, offset]);

        const produtosCross = resultado.rows;
        
        res.render("landing/crossfit", {
            produtos: produtosCross,
            produtosCross: produtosCross,
            totalProdutos,
            pagina,
            totalPaginas,
            busca,
            ordem
        });
    } catch (erro) {
        console.log("Erro no servidor: ", erro);
        res.status(500).render("landing/crossfit", {
            produtos: [],
            produtosCross: [],
            totalProdutos: 0,
            pagina: 1,
            totalPaginas: 1,
            busca: '',
            ordem: ''
        });
    }
});

// ============================================
// AUTENTICAÇÃO E CADASTRO DE CLIENTES
// ============================================

// Rota de Cadastro de Conta (GET)
app.get('/cadastro', (req, res) => {
    res.render("cadastro");
});

// Rota de Cadastro de Conta (POST)
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // Verificar se o e-mail já está em uso
        const emailExistente = await BD.query(`
            SELECT id FROM usuarios WHERE email = $1
        `, [email]);

        if (emailExistente.rows.length > 0) {
            return res.render('cadastro', {
                erro: 'Este e-mail já está cadastrado em nosso sistema.'
            });
        }

        // Inserir novo usuário como cliente ativo (tipo = 'cliente', situacao = 1)
        await BD.query(`
            INSERT INTO usuarios (nome, email, senha, tipo, situacao)
            VALUES ($1, $2, $3, 'cliente', 1)
        `, [nome, email, senha]);

        res.render('login', { 
            erro: null,
            sucesso: 'Conta criada com sucesso! Faça login para continuar.' 
        });

    } catch (erro) {
        console.log('Erro ao cadastrar usuário: ' + erro);
        res.render('cadastro', { erro: 'Erro interno ao criar sua conta. Tente novamente.' });
    }
});

// Rota de Login (GET)
app.get('/login', (req, res) => {
    res.render("login");
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
                erro: 'E-mail ou senha inválidos',
                sucesso: null
            });
        }

        // Gravar sessão do usuário
        req.session.usuario = resultado.rows[0];

        // Redireciona conforme o perfil do usuário
        if (resultado.rows[0].tipo === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/');
        }

    } catch (erro) {
        console.log('Erro ao fazer login: ' + erro);
        res.render('login', { erro: 'Erro interno no servidor', sucesso: null });
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
        // 1. Busca os produtos com o nome da categoria para a tabela
        const produtosRes = await BD.query(`
            SELECT 
                p.id, 
                p.nome, 
                p.descricao,
                p.preco, 
                p.estoque_atual, 
                p.imagem_url, 
                p.categoria_id,
                c.nome AS categoria
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id ASC
        `);

        // 2. Busca categorias para o <select> do modal de cadastro/edição
        const categoriasRes = await BD.query(`SELECT * FROM categorias ORDER BY nome ASC`);

        // 3. Busca métricas reais para os cards do topo
        const totalProdutosRes = await BD.query(`SELECT count(*) as total FROM produtos`);
        const vendasHojeRes = await BD.query(`SELECT count(*) as total FROM vendas WHERE DATE(data_venda) = CURRENT_DATE`);
        const faturamentoRes = await BD.query(`SELECT COALESCE(SUM(valor_total), 0) as total FROM vendas WHERE status = 'concluida'`);
        const estoqueBaixoRes = await BD.query(`SELECT count(*) as total FROM produtos WHERE estoque_atual <= 5`);

        // Formata faturamento para R$
        const faturamentoFormatado = Number(faturamentoRes.rows[0].total).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        res.render('dashboard', {
            usuario: req.session.usuario,
            produtos: produtosRes.rows,
            categorias: categoriasRes.rows,
            metricas: {
                totalProdutos: totalProdutosRes.rows[0].total,
                pedidosHoje: vendasHojeRes.rows[0].total,
                faturamentoMes: faturamentoFormatado,
                estoqueBaixo: estoqueBaixoRes.rows[0].total
            }
        });

    } catch (erro) {
        console.log('Erro no Dashboard: ' + erro);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});

// ============================================
// REGISTRO DOS MÓDULOS DE ROTAS
// ============================================

// Rotas - Produtos
const produtosRoutes = require('./routes/produtosRoutes');
app.use('/produtos', exigirLogin, produtosRoutes);

// Rotas - Clientes
const clientesRoutes = require('./routes/clientesRoutes');
app.use('/clientes', exigirLogin, clientesRoutes);

// Rotas - Categorias
const categoriasRoutes = require('./routes/categoriasRoutes');
app.use('/categorias', exigirLogin, categoriasRoutes);

// Rotas - Vendas
const vendasRoutes = require('./routes/vendasRoutes');
app.use('/vendas', exigirLogin, vendasRoutes);

// Rotas - Usuários (Administradores)
const usuariosRoutes = require('./routes/usuariosRoutes');
app.use('/usuarios', exigirLogin, usuariosRoutes);

// Rotas - Itens Venda (Administradores)
const itensVendaRoutes = require('./routes/itensVendaRoutes');
app.use('/itens_venda', exigirLogin, itensVendaRoutes);

//execução do servidor
const porta = 3001;
app.listen(porta, () => {
    console.log(`Servidor rodando em: http://localhost:${porta}`);
});
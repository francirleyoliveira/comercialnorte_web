/* --- Importação das bibliotecas --- */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Importa os services
const etiquetasService = require('./services/etiquetasService');
const cartazesService = require('./services/cartazesService');

/* --- VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE --- */
const requiredEnvVars = [
    'DB_USER', 
    'DB_PASSWORD', 
    'DB_CONNECTION_STRING', 
    'ORACLE_CLIENT_PATH',
    'IMAGES_PATH'
];

console.log('=== VERIFICAÇÃO DE VARIÁVEIS ===');
const missing = requiredEnvVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missing);
    console.error('💡 Verifique seu arquivo .env');
    process.exit(1);
}

console.log('✅ Todas as variáveis carregadas');
console.log('================================\n');

/* --- INICIALIZAÇÃO DO SERVIDOR --- */
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json());  

/* --- SERVIR O FRONTEND --- */
const frontendPath = path.join(__dirname, '..', 'gerador-web');
console.log(`[Servidor] Servindo Frontend de: ${frontendPath}`);
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

/* --- SERVIDOR DE IMAGENS --- */
app.use('/imagens', express.static(process.env.IMAGES_PATH));
console.log(`[Servidor] Servindo imagens de: ${process.env.IMAGES_PATH}\n`);

/* --- ROTA: STATUS DO POOL --- */
app.get('/api/pool-status', (req, res) => {
    const stats = db.getPoolStatistics();
    res.json({
        status: 'ok',
        pool: stats,
        timestamp: new Date().toISOString()
    });
});

/* --- ROTA: API DE ETIQUETAS --- */
app.post('/api/etiquetas', async (req, res) => {
    const { filial, codigos } = req.body;

    try {
        console.log(`[API Etiquetas] 📦 Processando ${codigos?.length || 0} códigos (Filial ${filial})`);
        
        // Usa o service para buscar
        const etiquetas = await etiquetasService.buscarEtiquetas(filial, codigos);

        if (etiquetas.length === 0) {
            console.log(`[API Etiquetas] ⚠️ Nenhum produto encontrado`);
            return res.status(404).json({ error: 'Nenhum produto encontrado com esses critérios' });
        }

        console.log(`[API Etiquetas] ✅ ${etiquetas.length} etiquetas encontradas`);
        res.json(etiquetas);

    } catch (err) {
        console.error("[API Etiquetas] ❌ Erro:", err.message);
        res.status(500).json({ 
            error: 'Erro ao buscar etiquetas', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

/* --- ROTA: API DE CARTAZES --- */
app.post('/api/cartaz', async (req, res) => {
    try {
        const params = req.body;
        console.log(`[API Cartazes] 🖼️ Processando pedido (Filial ${params.filial})`);

        // Valida parâmetros especiais
        const validacao = cartazesService.validarParametrosCartaz(params);
        if (!validacao.valido) {
            return res.status(400).json({ error: validacao.mensagem });
        }

        // Busca os cartazes
        const cartazes = await cartazesService.buscarCartazes(params);

        if (cartazes.length === 0) {
            console.log(`[API Cartazes] ⚠️ Nenhum produto encontrado`);
            return res.status(404).json({ error: 'Nenhum produto encontrado com esses critérios' });
        }
        
        console.log(`[API Cartazes] ✅ ${cartazes.length} produtos encontrados`);
        res.json(cartazes);

    } catch (err) {
        console.error("[API Cartazes] ❌ Erro:", err.message);
        res.status(500).json({ 
            error: 'Erro ao buscar cartazes', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

/* --- TRATAMENTO DE ERROS GLOBAL --- */
app.use((err, req, res, next) => {
    console.error('[Servidor] Erro não tratado:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/* --- INICIALIZAÇÃO DO SERVIDOR --- */
async function startup() {
    try {
        // 1. Inicializa o connection pool
        await db.initialize();
        
        // 2. Inicia o servidor Express
        app.listen(port, () => {
            console.log(`=================================================`);
            console.log(`  🚀 Servidor rodando em http://localhost:${port}`);
            console.log(`  📊 Status do pool: /api/pool-status`);
            console.log(`=================================================\n`);
        });

        // 3. Mostra estatísticas iniciais
        setTimeout(() => {
            console.log('[Servidor] Estatísticas do Pool:', db.getPoolStatistics());
        }, 1000);

    } catch (err) {
        console.error('[Servidor] ❌ Erro na inicialização:', err.message);
        process.exit(1);
    }
}

/* --- GRACEFUL SHUTDOWN --- */
async function shutdown() {
    console.log('\n[Servidor] Recebido sinal de encerramento...');
    
    try {
        await db.close(10);
        console.log('[Servidor] ✅ Encerramento concluído');
        process.exit(0);
    } catch (err) {
        console.error('[Servidor] ❌ Erro no encerramento:', err.message);
        process.exit(1);
    }
}

// Captura sinais de encerramento
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Inicia o servidor
startup();
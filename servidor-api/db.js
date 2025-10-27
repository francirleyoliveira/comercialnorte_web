// db.js - Gerenciador do Connection Pool do Oracle
const oracledb = require('oracledb');

let pool = null;

/**
 * Inicializa o Oracle Client e cria o connection pool
 */
async function initialize() {
    try {
        // 1. Inicializa o Oracle Client (Thick mode)
        console.log('[DB] Inicializando Oracle Client...');
        oracledb.initOracleClient({ 
            libDir: process.env.ORACLE_CLIENT_PATH 
        });
        console.log('[DB] ✅ Oracle Client inicializado em Modo Thick');

        // 2. Cria o connection pool
        console.log('[DB] Criando connection pool...');
        pool = await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            
            // Configurações do pool
            poolMin: parseInt(process.env.POOL_MIN) || 2,
            poolMax: parseInt(process.env.POOL_MAX) || 10,
            poolIncrement: parseInt(process.env.POOL_INCREMENT) || 2,
            poolTimeout: parseInt(process.env.POOL_TIMEOUT) || 60,
            
            // Configurações de qualidade
            queueTimeout: 60000, // 60 segundos timeout na fila
            
            // Configurações de sessão
            sessionCallback: initSession
        });

        // 3. Verificar status do pool
        console.log('[DB] ✅ Connection Pool criado com sucesso!');
        console.log('[DB] Configuração:', {
            min: pool.poolMin,
            max: pool.poolMax,
            increment: pool.poolIncrement,
            timeout: pool.poolTimeout
        });

    } catch (err) {
        console.error('[DB] ❌ Erro ao inicializar pool:', err.message);
        throw err;
    }
}

/**
 * Callback executado quando uma nova sessão é criada
 * Útil para configurar parâmetros específicos
 */
function initSession(connection, requestedTag, callback) {
    // Você pode executar comandos SQL aqui se necessário
    // Por exemplo: ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'
    callback();
}

/**
 * Pega uma conexão do pool
 * @returns {Promise<Connection>}
 */
async function getConnection() {
    if (!pool) {
        throw new Error('Connection pool não foi inicializado. Chame initialize() primeiro.');
    }
    
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (err) {
        console.error('[DB] ❌ Erro ao obter conexão do pool:', err.message);
        throw err;
    }
}

/**
 * Fecha o connection pool (chamado ao desligar o servidor)
 * @param {number} drainTime - Tempo em segundos para drenar conexões ativas
 */
async function close(drainTime = 10) {
    if (pool) {
        try {
            console.log('[DB] Fechando connection pool...');
            await pool.close(drainTime);
            console.log('[DB] ✅ Pool fechado com sucesso');
            pool = null;
        } catch (err) {
            console.error('[DB] ❌ Erro ao fechar pool:', err.message);
            throw err;
        }
    }
}

/**
 * Retorna estatísticas do pool para monitoramento
 * @returns {Object}
 */
function getPoolStatistics() {
    if (!pool) {
        return { error: 'Pool não inicializado' };
    }
    
    return {
        poolMin: pool.poolMin,
        poolMax: pool.poolMax,
        connectionsOpen: pool.connectionsOpen,
        connectionsInUse: pool.connectionsInUse,
        queueTimeout: pool.queueTimeout / 1000 + 's',
        status: pool.status
    };
}

/**
 * Executa uma query com tratamento automático de conexão
 * @param {string} sql - SQL query
 * @param {Object} binds - Bind parameters
 * @param {Object} options - Opções de execução
 * @returns {Promise<Object>}
 */
async function execute(sql, binds = {}, options = {}) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(sql, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            ...options
        });
        return result;
    } finally {
        if (connection) {
            try {
                await connection.close(); // Devolve ao pool
            } catch (err) {
                console.error('[DB] Erro ao fechar conexão:', err.message);
            }
        }
    }
}

// Exporta as funções
module.exports = {
    initialize,
    getConnection,
    close,
    getPoolStatistics,
    execute
};
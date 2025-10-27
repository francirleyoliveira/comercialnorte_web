// load-test.js - Teste de carga do connection pool
require('dotenv').config();

const http = require('http');

const config = {
    host: 'localhost',
    port: 3000,
    requests: 50, // Número de requisições simultâneas
    endpoint: '/api/etiquetas',
    timeout: 10000 // 10 segundos de timeout
};

const requestBody = JSON.stringify({
    filial: "2",
    codigos: ["7891000100103", "7891000100110"]
});

function makeRequest(id) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const options = {
            hostname: config.host,
            port: config.port,
            path: config.endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const duration = Date.now() - startTime;
                resolve({
                    id,
                    status: res.statusCode,
                    duration,
                    success: res.statusCode === 200
                });
            });
        });

        req.on('error', (err) => {
            reject({
                id,
                error: err.message,
                duration: Date.now() - startTime,
                success: false
            });
        });

        req.write(requestBody);
        req.end();

        // Timeout
        const timeoutId = setTimeout(() => {
            req.destroy();
            reject({
                id,
                error: 'Timeout após ' + (config.timeout / 1000) + ' segundos',
                duration: Date.now() - startTime,
                success: false
            });
        }, config.timeout);

        req.on('response', () => clearTimeout(timeoutId));
    });
}

async function checkPoolStatus() {
    try {
        const response = await fetch(`http://${config.host}:${config.port}/api/pool-status`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.pool;
    } catch (err) {
        return { error: err.message };
    }
}

async function runLoadTest() {
    console.log('🚀 Iniciando teste de carga...');
    console.log(`📊 Configuração: ${config.requests} requisições simultâneas`);
    console.log(`🎯 Endpoint: ${config.endpoint}\n`);

    const startTime = Date.now();
    
    // Cria array de promessas
    const promises = [];
    for (let i = 1; i <= config.requests; i++) {
        promises.push(makeRequest(i));
    }

    try {
        // Executa todas as requisições
        const results = await Promise.allSettled(promises);
        
        const totalTime = Date.now() - startTime;
        
        // Analisa resultados
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
        
        const durations = results
            .filter(r => r.status === 'fulfilled' || r.reason?.duration)
            .map(r => r.status === 'fulfilled' ? r.value.duration : r.reason.duration);
            
        const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const minDuration = durations.length ? Math.min(...durations) : 0;
        const maxDuration = durations.length ? Math.max(...durations) : 0;
        
        // Relatório
        console.log('\n📋 RESULTADO DO TESTE DE CARGA');
        console.log('================================');
        console.log(`✅ Bem-sucedidas: ${successful.length}/${config.requests}`);
        console.log(`❌ Falhadas: ${failed.length}/${config.requests}`);
        console.log(`⏱️  Tempo total: ${totalTime}ms`);
        console.log(`📊 Requisições/segundo: ${((config.requests / totalTime) * 1000).toFixed(2)}`);
        console.log('\n⏱️  TEMPOS DE RESPOSTA');
        console.log('================================');
        console.log(`Média: ${avgDuration.toFixed(2)}ms`);
        console.log(`Mínimo: ${minDuration}ms`);
        console.log(`Máximo: ${maxDuration}ms`);
        
        if (failed.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            failed.forEach((r, i) => {
                const error = r.status === 'rejected' 
                    ? r.reason.error 
                    : r.value.error || 'Status ' + r.value.status;
                console.log(`${i + 1}. Requisição ${r.status === 'rejected' ? r.reason.id : r.value.id}: ${error}`);
        }
        
        // Verifica status do pool
        // Status do pool
        console.log('\n📊 STATUS DO POOL');
        console.log('================================');
        const poolStatus = await checkPoolStatus();
        if (poolStatus.error) {
            console.log('❌ Erro ao verificar pool:', poolStatus.error);
        } else {
            console.log(poolStatus);
        }
        
    } catch (err) {
        console.error('❌ Erro no teste:', err);
    }
}

// Executa o teste
runLoadTest();
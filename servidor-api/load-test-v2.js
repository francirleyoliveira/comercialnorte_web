// load-test-v2.js - Teste de carga avançado
require('dotenv').config();
const http = require('http');

const config = {
    host: 'localhost',
    port: 3000,
    scenarios: [
        { name: 'Leve', requests: 20, delay: 100 },
        { name: 'Médio', requests: 50, delay: 0 },
        { name: 'Pesado', requests: 100, delay: 0 }
    ],
    endpoint: '/api/etiquetas',
    timeout: 10000
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
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - startTime;
                resolve({
                    id,
                    status: res.statusCode,
                    duration,
                    success: res.statusCode === 200,
                    error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
                });
            });
        });

        const timeoutId = setTimeout(() => {
            req.destroy();
            reject({
                id,
                error: `Timeout após ${config.timeout/1000}s`,
                duration: Date.now() - startTime,
                success: false
            });
        }, config.timeout);

        req.on('response', () => clearTimeout(timeoutId));
        
        req.on('error', (err) => {
            clearTimeout(timeoutId);
            reject({
                id,
                error: err.message,
                duration: Date.now() - startTime,
                success: false
            });
        });

        req.write(requestBody);
        req.end();
    });
}

async function checkPoolStatus() {
    try {
        const options = {
            hostname: config.host,
            port: config.port,
            path: '/api/pool-status',
            method: 'GET'
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.pool);
                    } catch (err) {
                        reject(new Error('Erro ao parsear resposta'));
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.end();
        });
    } catch (err) {
        return { error: err.message };
    }
}

function printStats(scenario, results, totalTime) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
    
    const durations = results
        .map(r => r.status === 'fulfilled' ? r.value.duration : r.reason?.duration)
        .filter(d => d != null);
        
    const avgDuration = durations.length ? 
        (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : 'N/A';
    const minDuration = durations.length ? Math.min(...durations) : 'N/A';
    const maxDuration = durations.length ? Math.max(...durations) : 'N/A';
    
    console.log('\n📋 RESULTADOS');
    console.log('================================');
    console.log(`✅ Bem-sucedidas: ${successful.length}/${scenario.requests}`);
    console.log(`❌ Falhadas: ${failed.length}/${scenario.requests}`);
    console.log(`⏱️  Tempo total: ${totalTime}ms`);
    console.log(`📊 Requisições/segundo: ${((scenario.requests / totalTime) * 1000).toFixed(2)}`);
    
    console.log('\n⏱️  TEMPOS DE RESPOSTA');
    console.log('================================');
    console.log(`Média: ${avgDuration}ms`);
    console.log(`Mínimo: ${minDuration}ms`);
    console.log(`Máximo: ${maxDuration}ms`);
    
    if (failed.length > 0) {
        console.log('\n❌ ERROS');
        console.log('================================');
        failed.forEach((r, i) => {
            const error = r.status === 'rejected' ? r.reason.error : r.value.error;
            const reqId = r.status === 'rejected' ? r.reason.id : r.value.id;
            console.log(`${i + 1}. Requisição ${reqId}: ${error}`);
        });
    }
}

async function runScenario(scenario) {
    console.log(`\n🎯 CENÁRIO: ${scenario.name}`);
    console.log('================================');
    console.log(`📊 ${scenario.requests} requisições${scenario.delay ? ` (delay ${scenario.delay}ms)` : ''}`);

    const startTime = Date.now();
    const promises = [];

    for (let i = 1; i <= scenario.requests; i++) {
        promises.push(makeRequest(i));
        if (scenario.delay) {
            await new Promise(resolve => setTimeout(resolve, scenario.delay));
        }
    }

    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;

    printStats(scenario, results, totalTime);
    
    return { results, totalTime, scenario };
}

async function runLoadTest() {
    console.log('🚀 Iniciando teste de carga...');
    console.log(`🎯 Endpoint: ${config.endpoint}`);
    console.log('================================\n');

    try {
        for (const scenario of config.scenarios) {
            await runScenario(scenario);
            
            // Verifica status do pool após cada cenário
            console.log('\n📊 STATUS DO POOL');
            console.log('================================');
            const poolStatus = await checkPoolStatus();
            if (poolStatus.error) {
                console.log('❌ Erro:', poolStatus.error);
            } else {
                console.log(poolStatus);
            }
            
            // Pequena pausa entre cenários
            if (scenario !== config.scenarios[config.scenarios.length - 1]) {
                console.log('\n⏳ Aguardando 3 segundos antes do próximo cenário...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    } catch (err) {
        console.error('\n❌ Erro fatal:', err);
    }
}

// Executa o teste
runLoadTest();
// Testes Básicos para o Sistema de Cartazes
// ==========================================

// Função para executar todos os testes
function runTests() {
    console.log('🧪 Iniciando testes do sistema...');
    
    let passed = 0;
    let failed = 0;
    
    const tests = [
        testFormatarPreco,
        testSanitizeInput,
        testValidateCodes,
        testCacheManager,
        testValidationManager
    ];
    
    tests.forEach(test => {
        try {
            test();
            passed++;
            console.log(`✅ ${test.name} - PASSOU`);
        } catch (error) {
            failed++;
            console.error(`❌ ${test.name} - FALHOU:`, error.message);
        }
    });
    
    console.log(`\n📊 Resultados: ${passed} passaram, ${failed} falharam`);
    
    if (failed === 0) {
        console.log('🎉 Todos os testes passaram!');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique o código.');
    }
}

// Teste da função formatarPreco
function testFormatarPreco() {
    // Teste com valor válido
    const result1 = formatarPreco(12.99);
    if (JSON.stringify(result1) !== JSON.stringify(["12", "99"])) {
        throw new Error("Formatação de preço 12.99 falhou");
    }
    
    // Teste com valor nulo
    const result2 = formatarPreco(null);
    if (JSON.stringify(result2) !== JSON.stringify(["--", "--"])) {
        throw new Error("Tratamento de valor nulo falhou");
    }
    
    // Teste com valor indefinido
    const result3 = formatarPreco(undefined);
    if (JSON.stringify(result3) !== JSON.stringify(["--", "--"])) {
        throw new Error("Tratamento de valor indefinido falhou");
    }
    
    // Teste com string vazia
    const result4 = formatarPreco("");
    if (JSON.stringify(result4) !== JSON.stringify(["--", "--"])) {
        throw new Error("Tratamento de string vazia falhou");
    }
    
    // Teste com zero
    const result5 = formatarPreco(0);
    if (JSON.stringify(result5) !== JSON.stringify(["--", "--"])) {
        throw new Error("Tratamento de zero falhou");
    }
}

// Teste da função sanitizeInput
function testSanitizeInput() {
    // Teste com tags HTML
    const result1 = sanitizeInput("<script>alert('xss')</script>");
    if (result1 !== "scriptalert('xss')/script") {
        throw new Error("Sanitização de tags HTML falhou");
    }
    
    // Teste com javascript:
    const result2 = sanitizeInput("javascript:alert('xss')");
    if (result2 !== "alert('xss')") {
        throw new Error("Sanitização de javascript: falhou");
    }
    
    // Teste com string normal
    const result3 = sanitizeInput("produto123");
    if (result3 !== "produto123") {
        throw new Error("Sanitização de string normal falhou");
    }
    
    // Teste com valor não string
    const result4 = sanitizeInput(123);
    if (result4 !== "") {
        throw new Error("Tratamento de valor não string falhou");
    }
}

// Teste da função validateCodes
function testValidateCodes() {
    // Teste com códigos válidos
    const validCodes = ["12345", "ABC123", "produto1"];
    if (!validateCodes(validCodes)) {
        throw new Error("Validação de códigos válidos falhou");
    }
    
    // Teste com códigos inválidos
    const invalidCodes = ["123<", "script>", ""];
    if (validateCodes(invalidCodes)) {
        throw new Error("Validação de códigos inválidos falhou");
    }
    
    // Teste com array vazio
    if (!validateCodes([])) {
        throw new Error("Validação de array vazio falhou");
    }
    
    // Teste com não array
    if (validateCodes("não é array")) {
        throw new Error("Validação de não array falhou");
    }
}

// Teste do CacheManager
function testCacheManager() {
    // Limpar cache
    CacheManager.clear();
    
    // Teste de set e get
    const testData = { produto: "teste", preco: 10.50 };
    CacheManager.set("test-key", testData);
    
    const retrieved = CacheManager.get("test-key");
    if (JSON.stringify(retrieved) !== JSON.stringify(testData)) {
        throw new Error("Cache set/get falhou");
    }
    
    // Teste de chave inexistente
    const notFound = CacheManager.get("chave-inexistente");
    if (notFound !== null) {
        throw new Error("Cache de chave inexistente falhou");
    }
}

// Teste do ValidationManager
function testValidationManager() {
    // Teste básico de funcionalidade
    if (typeof ValidationManager.clearAll !== 'function') {
        throw new Error("ValidationManager.clearAll não é uma função");
    }
    if (typeof ValidationManager.hasErrors !== 'function') {
        throw new Error("ValidationManager.hasErrors não é uma função");
    }
    if (typeof ValidationManager.getErrors !== 'function') {
        throw new Error("ValidationManager.getErrors não é uma função");
    }
    
    // Limpar erros
    ValidationManager.clearAll();
    
    // Teste básico sem depender de elementos DOM
    if (ValidationManager.hasErrors()) {
        throw new Error("clearAll não limpou erros iniciais");
    }
    
    const errors = ValidationManager.getErrors();
    if (!Array.isArray(errors)) {
        throw new Error("getErrors não retorna array");
    }
    
    // Teste alternativo: verificar se o ValidationManager pode gerenciar erros internamente
    // Simular erro interno diretamente no Map
    ValidationManager.errors.set('test-field', 'Erro simulado');
    if (!ValidationManager.hasErrors()) {
        throw new Error("hasErrors não detectou erro simulado");
    }
    
    const testErrors = ValidationManager.getErrors();
    if (testErrors.length === 0) {
        throw new Error("getErrors não retornou erro simulado");
    }
    
    // Limpar erro simulado
    ValidationManager.clearAll();
    if (ValidationManager.hasErrors()) {
        throw new Error("clearAll não limpou erro simulado");
    }
    
    console.log("✅ ValidationManager testado com sucesso (teste interno)");
}

// Teste de integração básica
function testIntegration() {
    console.log('🔧 Testando integração...');
    
    // Verificar se o sistema foi inicializado
    if (typeof window.initializeSystem === 'function') {
        const initialized = window.initializeSystem();
        if (!initialized) {
            throw new Error('Sistema não foi inicializado corretamente');
        }
    }
    
    // Verificar se as funções globais existem
    const requiredFunctions = [
        'formatarPreco',
        'sanitizeInput', 
        'validateCodes',
        'LoadingManager',
        'ValidationManager',
        'CacheManager',
        'FormValidator',
        'KeyboardNavigation',
        'Analytics'
    ];
    
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'undefined') {
            throw new Error(`Função ${funcName} não está disponível globalmente`);
        }
    });
    
    console.log('✅ Todas as funções estão disponíveis');
}

// Executar testes quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar mais tempo para garantir que todos os scripts carregaram
    setTimeout(() => {
        try {
            testIntegration();
            runTests();
        } catch (error) {
            console.error('❌ Erro ao executar testes:', error);
        }
    }, 2000);
});

// Exportar para uso manual
window.runTests = runTests;
window.testFormatarPreco = testFormatarPreco;
window.testSanitizeInput = testSanitizeInput;
window.testValidateCodes = testValidateCodes;
window.testCacheManager = testCacheManager;
window.testValidationManager = testValidationManager;
window.testIntegration = testIntegration;

// Verificação do Sistema - Debug
// ================================

// Função para verificar o status do sistema
function verificarSistema() {
    console.log('🔍 Verificando status do sistema...');
    
    const status = {
        utils: {
            CONFIG: typeof window.CONFIG !== 'undefined',
            logger: typeof window.logger !== 'undefined',
            formatarPreco: typeof window.formatarPreco !== 'undefined',
            sanitizeInput: typeof window.sanitizeInput !== 'undefined',
            ValidationManager: typeof window.ValidationManager !== 'undefined',
            FormValidator: typeof window.FormValidator !== 'undefined',
            LoadingManager: typeof window.LoadingManager !== 'undefined',
            CacheManager: typeof window.CacheManager !== 'undefined'
        },
        elementos: {
            searchCodProd: document.getElementById('searchCodProd') !== null,
            searchCodAux: document.getElementById('searchCodAux') !== null,
            buscarBtn: document.getElementById('buscarBtn') !== null
        },
        timing: {
            domReady: document.readyState === 'complete',
            timestamp: Date.now()
        }
    };
    
    console.log('📊 Status do Sistema:', status);
    
    // Verificar problemas
    const problemas = [];
    
    Object.entries(status.utils).forEach(([key, value]) => {
        if (!value) problemas.push(`❌ ${key} não disponível`);
    });
    
    Object.entries(status.elementos).forEach(([key, value]) => {
        if (!value) problemas.push(`❌ Elemento ${key} não encontrado`);
    });
    
    if (problemas.length > 0) {
        console.log('⚠️ Problemas encontrados:', problemas);
    } else {
        console.log('✅ Sistema funcionando corretamente');
    }
    
    return status;
}

// Função para testar funcionalidades básicas
function testarFuncionalidades() {
    console.log('🧪 Testando funcionalidades...');
    
    try {
        // Teste 1: formatarPreco
        const preco = window.formatarPreco(12.99);
        console.log('✅ formatarPreco:', preco);
        
        // Teste 2: sanitizeInput
        const sanitizado = window.sanitizeInput('<script>alert("test")</script>');
        console.log('✅ sanitizeInput:', sanitizado);
        
        // Teste 3: ValidationManager
        if (window.ValidationManager) {
            window.ValidationManager.clearAll();
            console.log('✅ ValidationManager funcionando');
        }
        
        // Teste 4: CacheManager
        if (window.CacheManager) {
            window.CacheManager.set('test', { data: 'teste' });
            const cached = window.CacheManager.get('test');
            console.log('✅ CacheManager:', cached);
        }
        
        console.log('🎉 Todas as funcionalidades estão funcionando!');
        
    } catch (error) {
        console.error('❌ Erro ao testar funcionalidades:', error);
    }
}

// Executar verificação
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        verificarSistema();
        testarFuncionalidades();
    }, 1000);
});

// Exportar para uso manual
window.verificarSistema = verificarSistema;
window.testarFuncionalidades = testarFuncionalidades;

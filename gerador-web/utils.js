// Utilitários e Melhorias para o Sistema de Cartazes
// =======================================================

// Configuração centralizada
const CONFIG = {
    API: {
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        BASE_URL: window.location.origin
    },
    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 200,
        MAX_CACHE_SIZE: 50
    },
    VALIDATION: {
        MAX_CODE_LENGTH: 50,
        MIN_CODE_LENGTH: 1,
        // ✅ CORRIGIDO: Aceita letras, números, hífens e underscores
        ALLOWED_CHARS: /^[a-zA-Z0-9\-_]+$/
    }
};

// Cache de resultados
const cache = new Map();

// Logger estruturado
const logger = {
    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, data);
    },
    error: (message, error = {}) => {
        console.error(`[ERROR] ${message}`, error);
    },
    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, data);
    }
};

// Função de debounce
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Função auxiliar para formatar preço (MAIS ROBUSTA)
const formatarPreco = (preco) => {
    if (preco === null || preco === undefined || preco === '' || parseFloat(preco) === 0) {
        return ["--", "--"];
    }
    const numeroPreco = parseFloat(preco);
    if (isNaN(numeroPreco)) {
         return ["--", "--"];
    }
    const partes = numeroPreco.toFixed(2).split('.');
    return [partes[0], partes[1]];
};

// Sanitização de dados
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[<>]/g, '') // Remove tags HTML
        .replace(/javascript:/gi, '') // Remove javascript:
        .trim();
};

const sanitizeHTML = (html) => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

// ✅ Validação robusta de códigos - MELHORADA
const validateCodes = (codes) => {
    if (!Array.isArray(codes)) return false;
    
    // Se o array estiver vazio, retorna false
    if (codes.length === 0) return false;
    
    return codes.every(code => {
        const cleanCode = sanitizeInput(code);
        
        // Ignorar linhas vazias
        if (cleanCode.length === 0) return true;
        
        // Validar comprimento
        if (cleanCode.length < CONFIG.VALIDATION.MIN_CODE_LENGTH || 
            cleanCode.length > CONFIG.VALIDATION.MAX_CODE_LENGTH) {
            console.warn(`[validateCodes] Código com tamanho inválido: "${cleanCode}" (${cleanCode.length} chars)`);
            return false;
        }
        
        // Validar caracteres permitidos
        if (!CONFIG.VALIDATION.ALLOWED_CHARS.test(cleanCode)) {
            console.warn(`[validateCodes] Código com caracteres inválidos: "${cleanCode}"`);
            return false;
        }
        
        return true;
    });
};

// Loading states
const LoadingManager = {
    overlay: null,
    
    show: (message = 'Carregando...') => {
        if (this.overlay) this.hide();
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(this.overlay);
    },
    
    hide: () => {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
};

// Validação em tempo real
const ValidationManager = {
    errors: new Map(),
    
    showError: (fieldId, message) => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            field.classList.add('input-error');
            field.classList.remove('input-success');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            ValidationManager.errors.set(fieldId, message);
        }
    },
    
    showSuccess: (fieldId) => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            field.classList.add('input-success');
            field.classList.remove('input-error');
            errorElement.style.display = 'none';
            ValidationManager.errors.delete(fieldId);
        }
    },
    
    clearAll: () => {
        ValidationManager.errors.clear();
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
        document.querySelectorAll('.input-success').forEach(el => {
            el.classList.remove('input-success');
        });
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
    },
    
    hasErrors: () => ValidationManager.errors.size > 0,
    
    getErrors: () => Array.from(ValidationManager.errors.entries())
};

// Cache de dados
const CacheManager = {
    get: (key) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
            return cached.data;
        }
        cache.delete(key);
        return null;
    },
    
    set: (key, data) => {
        cache.set(key, { data, timestamp: Date.now() });
        
        // Limpar cache antigo se necessário
        if (cache.size > CONFIG.UI.MAX_CACHE_SIZE) {
            const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            cache.delete(oldest[0]);
        }
    },
    
    clear: () => cache.clear()
};

// Validação de formulário
const FormValidator = {
    validateSearchFields: () => {
        const codProd = document.getElementById('searchCodProd');
        const codAux = document.getElementById('searchCodAux');
        
        if (!codProd || !codAux) {
            console.log('Elementos não encontrados ainda, aguardando...');
            return false;
        }
        
        const codProdValue = codProd.value.trim();
        const codAuxValue = codAux.value.trim();
        
        // Verificar se ValidationManager está disponível
        if (typeof ValidationManager === 'undefined' || !ValidationManager.clearAll) {
            console.log('ValidationManager não está disponível ainda');
            return false;
        }
        
        ValidationManager.clearAll();
        
        // Validação: não pode preencher ambos os campos
        if (codProdValue && codAuxValue) {
            ValidationManager.showError('searchCodProd', 'Use apenas um tipo de código por vez');
            ValidationManager.showError('searchCodAux', 'Use apenas um tipo de código por vez');
            return false;
        }
        
        // Validação: precisa preencher pelo menos um
        if (!codProdValue && !codAuxValue) {
            ValidationManager.showError('searchCodProd', 'Digite pelo menos um código');
            ValidationManager.showError('searchCodAux', 'Digite pelo menos um código');
            return false;
        }
        
        // ✅ MELHORADO: Validar códigos se preenchidos
        if (codProdValue) {
            const codes = codProdValue.split('\n')
                .map(c => c.trim())
                .filter(c => c.length > 0); // Remove linhas vazias
            
            console.log('[FormValidator] Códigos Internos:', codes);
            
            if (codes.length === 0) {
                ValidationManager.showError('searchCodProd', 'Digite pelo menos um código válido');
                return false;
            }
            
            if (!validateCodes(codes)) {
                ValidationManager.showError('searchCodProd', 'Códigos inválidos. Use apenas letras, números, hífens e underscores');
                return false;
            }
            
            ValidationManager.showSuccess('searchCodProd');
        }
        
        if (codAuxValue) {
            const codes = codAuxValue.split('\n')
                .map(c => c.trim())
                .filter(c => c.length > 0); // Remove linhas vazias
            
            console.log('[FormValidator] Códigos Auxiliares:', codes);
            
            if (codes.length === 0) {
                ValidationManager.showError('searchCodAux', 'Digite pelo menos um código válido');
                return false;
            }
            
            if (!validateCodes(codes)) {
                ValidationManager.showError('searchCodAux', 'Códigos inválidos. Use apenas letras, números, hífens e underscores');
                return false;
            }
            
            ValidationManager.showSuccess('searchCodAux');
        }
        
        return true;
    },
    
    validateSpecialParams: () => {
        const dtValidadeEl = document.getElementById('dtValidade');
        const dtOfertaEl = document.getElementById('dtOferta');
        const descEditadaEl = document.getElementById('descEditada');
        const codProdEl = document.getElementById('searchCodProd');
        const codAuxEl = document.getElementById('searchCodAux');
        
        if (!dtValidadeEl || !dtOfertaEl || !descEditadaEl || !codProdEl || !codAuxEl) {
            return true; // Elementos não carregados ainda
        }
        
        const dtValidade = dtValidadeEl.value;
        const dtOferta = dtOfertaEl.value;
        const descEditada = descEditadaEl.value;
        
        const codProd = codProdEl.value.trim();
        const codAux = codAuxEl.value.trim();
        const totalCodes = (codProd ? codProd.split('\n').filter(c => c.trim()) : []).length + 
                          (codAux ? codAux.split('\n').filter(c => c.trim()) : []).length;
        
        if ((dtValidade || dtOferta || descEditada) && totalCodes > 1) {
            ValidationManager.showError('dtValidade', 'Parâmetros especiais só funcionam com um produto');
            ValidationManager.showError('dtOferta', 'Parâmetros especiais só funcionam com um produto');
            ValidationManager.showError('descEditada', 'Parâmetros especiais só funcionam com um produto');
            return false;
        }
        
        return true;
    }
};

// Navegação por teclado
const KeyboardNavigation = {
    init: () => {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter para gerar cartazes
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                const buscarBtn = document.getElementById('buscarBtn');
                if (buscarBtn && !buscarBtn.disabled) {
                    buscarBtn.click();
                }
            }
            
            // Escape para limpar formulário
            if (e.key === 'Escape') {
                KeyboardNavigation.clearForm();
            }
        });
    },
    
    clearForm: () => {
        const elements = [
            'searchCodProd', 'searchCodAux', 'dtValidade', 'dtOferta', 'descEditada'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        ValidationManager.clearAll();
    }
};

// Analytics básico
const Analytics = {
    track: (event, data = {}) => {
        logger.info(`Analytics: ${event}`, data);
        // Aqui você pode integrar com Google Analytics ou outro serviço
    },
    
    trackCartazGeneration: (format, count) => {
        Analytics.track('cartaz_generated', {
            format: format,
            count: count,
            timestamp: Date.now()
        });
    }
};

// Função de inicialização
const initializeSystem = () => {
    logger.info('Inicializando sistema de utilitários...');
    
    // Verificar se todos os componentes estão disponíveis
    const components = [
        'CONFIG', 'logger', 'debounce', 'formatarPreco', 'sanitizeInput',
        'sanitizeHTML', 'validateCodes', 'LoadingManager', 'ValidationManager',
        'CacheManager', 'FormValidator', 'KeyboardNavigation', 'Analytics'
    ];
    
    const missing = components.filter(comp => typeof window[comp] === 'undefined');
    if (missing.length > 0) {
        logger.warn('Componentes não disponíveis:', missing);
        return false;
    }
    
    logger.info('Sistema de utilitários inicializado com sucesso');
    return true;
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.logger = logger;
window.debounce = debounce;
window.formatarPreco = formatarPreco;
window.sanitizeInput = sanitizeInput;
window.sanitizeHTML = sanitizeHTML;
window.validateCodes = validateCodes;
window.LoadingManager = LoadingManager;
window.ValidationManager = ValidationManager;
window.CacheManager = CacheManager;
window.FormValidator = FormValidator;
window.KeyboardNavigation = KeyboardNavigation;
window.Analytics = Analytics;
window.initializeSystem = initializeSystem;

// Inicializar automaticamente
setTimeout(() => {
    initializeSystem();
}, 100);

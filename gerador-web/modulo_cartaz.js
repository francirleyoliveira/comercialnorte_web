document.addEventListener('DOMContentLoaded', () => {

    // Inicializar utilitários
    KeyboardNavigation.init();
    logger.info('Módulo de Cartazes inicializado');

    // Seletores da UI
    const buscarBtn = document.getElementById('buscarBtn');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const cartazContainer = document.getElementById('cartaz-container');
    const placeholder = document.getElementById('cartaz-placeholder');

    // Seletores dos Campos de Input
    const filialInput = document.getElementById('filial');
    const searchCodProdInput = document.getElementById('searchCodProd');
    const searchCodAuxInput = document.getElementById('searchCodAux');
    const dtValidadeInput = document.getElementById('dtValidade');
    const dtOfertaInput = document.getElementById('dtOferta');
    const descEditadaInput = document.getElementById('descEditada');

    // Configurar validação em tempo real
    const setupRealTimeValidation = () => {
        const inputs = [searchCodProdInput, searchCodAuxInput, dtValidadeInput, dtOfertaInput, descEditadaInput];
        
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(() => {
                    // Verificar se os elementos existem antes de validar
                    if (document.getElementById('searchCodProd') && document.getElementById('searchCodAux')) {
                        FormValidator.validateSearchFields();
                        FormValidator.validateSpecialParams();
                    }
                }, CONFIG.UI.DEBOUNCE_DELAY));
                
                input.addEventListener('blur', () => {
                    // Verificar se os elementos existem antes de validar
                    if (document.getElementById('searchCodProd') && document.getElementById('searchCodAux')) {
                        FormValidator.validateSearchFields();
                        FormValidator.validateSpecialParams();
                    }
                });
            }
        });
    };

    // Aguardar mais tempo para garantir que todos os elementos estão carregados
    setTimeout(() => {
        setupRealTimeValidation();
    }, 500);

    // Função formatarPreco agora está disponível via utils.js

    // Função para extrair o nome do ficheiro do caminho
    function extrairNomeImagem(caminhoCompleto) {
        if (!caminhoCompleto) {
            return null;
        }
        // CORREÇÃO: Usa window.location.origin para o URL da imagem
        const nomeImagem = caminhoCompleto.replace(/\\/g, '/').split('/').pop();
        return nomeImagem ? `${window.location.origin}/imagens/${nomeImagem}` : '';
    }

    // Função para construir o HTML de CADA cartaz
    function construirCartaz(data, parametros) {

        try {
            // 1. Prepara os dados de preço (usando a função robusta)
            const precoVarejo = formatarPreco(data.PVENDA);
            const precoAtacado = formatarPreco(data.PVENDAATAC);
            const precoMaster = formatarPreco(data.PRECOCX);

            // Verifica se os preços existem (não são "--")
            const temPrecoVarejo = precoVarejo[0] !== "--"; // Adicionado para consistência
            const temPrecoAtacado = precoAtacado[0] !== "--";
            const temPrecoMaster = precoMaster[0] !== "--";

            // 2. Prepara a descrição
            const descricao = (parametros.isSingleSearch && parametros.descEditada) ? parametros.descEditada : data.DESCRICAO;

            // 3. Prepara a imagem (já usa o URL correto)
            const urlImagem = extrairNomeImagem(data.DIRFOTOPROD);

            // 4. Cria o wrapper do cartaz
            const wrapper = document.createElement('div');
            wrapper.className = `cartaz-preview-wrapper ${parametros.formatoPapel}`;

            // 5. Cria o layout interno
            const cartaz = document.createElement('div');
            cartaz.className = 'cartaz-layout';
            if (parametros.tipoOferta === 'S') {
                cartaz.classList.add('em-oferta');
            }

            // 6. Constrói o HTML interno (Corrigido Label Master)
            cartaz.innerHTML = `
                <div class="cartaz-cabecalho-oferta">
                    OFERTA
                </div>
                <div class="cartaz-descricao">${descricao || 'Produto sem descrição'}</div>
                
                <!-- Área de Preços Reestruturada -->
                <div class="area-precos">
                    <div class="cartaz-preco-principal" id="bloco-atacado">
                        <div class="preco-label">${data.QTMINIATAC || 'PREÇO ATACADO'}</div>
                        <div class="preco-container">
                            <span class="cifrao">R$</span>
                            <span class="preco-inteiro">${precoAtacado[0]}</span>
                            <span class="preco-centavos">,${precoAtacado[1]}</span>
                        </div>
                    </div>
                    <div class="cartaz-preco-secundario" id="bloco-venda">
                        <div class="preco-label">${data.EMBALAGEM || 'UN'}</div>
                        <div class="preco-container">
                            <span class="cifrao">R$</span>
                            <span class="preco-inteiro">${precoVarejo[0]}</span>
                            <span class="preco-centavos">,${precoVarejo[1]}</span>
                        </div>
                    </div>
                </div>

                <div class="cartaz-rodape">
                    <div class="datas">
                        <div id="bloco-oferta" class="${!data.FIMOFERTA ? 'escondido' : ''}">${data.OFERTA || ''} ${data.FIMOFERTA || ''}</div>
                        <div id="bloco-validade" class="${!data.DTVALPRODUTO ? 'escondido' : ''}">${data.VALPRODUTO || ''} ${data.DTVALPRODUTO || ''}</div>
                    </div>
                    <div class="bloco-caixa-e-imagem">
                        <div class="bloco-caixa" id="bloco-master">
                            <div class="preco-label">${data.EMBALAGEMCX || 'CAIXA:'}</div>
                            <div class="preco-container">
                                <span class="cifrao">R$</span>
                                <span class="preco-inteiro">${precoMaster[0]}</span>
                                <span class="preco-centavos">,${precoMaster[1]}</span>
                            </div>
                        </div>
                        <div class="imagem-e-barcode">
                            <img src="${urlImagem}" class="cartaz-imagem-produto ${!urlImagem ? 'escondido' : ''}" alt="Imagem do Produto">
                            <div class="barcode-area">
                                <svg class="barcode" data-barcode-value="${data.CODAUXILIAR || ''}" id="barcode-svg-${data.CODPROD}"></svg>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 7. Adiciona o layout ao wrapper
            wrapper.appendChild(cartaz);

            // 8. Lógica de Exibição (ORDEM CORRIGIDA)
            const blocoVenda = cartaz.querySelector('#bloco-venda');
            const blocoAtacado = cartaz.querySelector('#bloco-atacado');
            const blocoMaster = cartaz.querySelector('#bloco-master');

            // Lógica de exibição de preços
            const precoVendaFloat = parseFloat(data.PVENDA);
            const precoAtacadoFloat = parseFloat(data.PVENDAATAC);

            if (!temPrecoAtacado || precoVendaFloat === precoAtacadoFloat) {
                // Se não tem atacado ou os preços são iguais, mostra só o de venda como principal
                blocoAtacado.classList.add('escondido');
                blocoVenda.classList.remove('cartaz-preco-secundario');
                blocoVenda.classList.add('cartaz-preco-principal');
            } else {
                // Se tem atacado e é diferente, atacado é principal, venda é secundário
                blocoAtacado.classList.remove('escondido');
                blocoAtacado.classList.add('cartaz-preco-principal');
                blocoVenda.classList.remove('escondido');
                blocoVenda.classList.add('cartaz-preco-secundario');
            }

            if (!temPrecoVarejo) {
                blocoVenda.classList.add('escondido');
            }
            if (!temPrecoMaster) {
                blocoMaster.classList.add('escondido');
            }

            if (parametros.tipoEmbalagem === 'VENDA') {
                blocoAtacado.classList.add('escondido');
                blocoMaster.classList.add('escondido');
                blocoVenda.classList.remove('cartaz-preco-secundario');
                blocoVenda.classList.add('cartaz-preco-principal');
            } else if (parametros.tipoEmbalagem === 'MASTER') {
                blocoVenda.classList.add('escondido');
                blocoAtacado.classList.add('escondido');
                if (!blocoMaster.classList.contains('escondido')) {
                    blocoMaster.classList.add('bloco-master-destaque');
                }
            }

            // 9. Gera o Código de Barras (adiado para depois da renderização)
            return wrapper;
        } catch (e) {
            console.error("ERRO AO CONSTRUIR CARTAZ:", e);
            console.error("DADOS DO PRODUTO QUE FALHOU:", data);
            alert(`${t('erro_dados')} ${data.CODPROD}: ${e.message}`);
        }
    }


    // Event Listener do botão "Gerar Cartaz(es)"
    buscarBtn.addEventListener('click', async () => {
    
    // Validação prévia
    const searchFieldsValid = FormValidator.validateSearchFields();
    const specialParamsValid = FormValidator.validateSpecialParams();
    
    if (!searchFieldsValid || !specialParamsValid) {
        const errors = ValidationManager.getErrors();
        logger.warn('Validação falhou', {
            totalErros: errors.length,
            erros: errors,
            searchFieldsValid,
            specialParamsValid
        });
        
        // Mostrar feedback visual para o usuário
        if (errors.length === 0) {
            logger.warn('⚠️ Validação falhou mas nenhum erro foi registrado');
        }
        
        return;
    }

        // 1. Coleta dos campos de pesquisa (com sanitização)
        const codProdList = searchCodProdInput.value.split('\n')
            .map(cod => sanitizeInput(cod))
            .filter(cod => cod.trim() !== '');
        const codAuxList = searchCodAuxInput.value.split('\n')
            .map(cod => sanitizeInput(cod))
            .filter(cod => cod.trim() !== '');

        // 2. Validação da Pesquisa (já feita acima, mas mantemos para segurança)
        if (codProdList.length > 0 && codAuxList.length > 0) {
            ValidationManager.showError('searchCodProd', t('erro_dados'));
            ValidationManager.showError('searchCodAux', t('erro_dados'));
            return;
        }
        if (codProdList.length === 0 && codAuxList.length === 0) {
            ValidationManager.showError('searchCodProd', t('erro_dados'));
            ValidationManager.showError('searchCodAux', t('erro_dados'));
            return;
        }

        const searchBy = codProdList.length > 0 ? 'codprod' : 'codauxiliar';
        const allCodes = codProdList.length > 0 ? codProdList : codAuxList;
        const totalCodes = allCodes.length;

        // 3. Coleta dos Parâmetros Especiais (com sanitização)
        const dtValidade = dtValidadeInput.value || null;
        const dtOferta = dtOfertaInput.value || null;
        const descEditada = descEditadaInput.value ? sanitizeInput(descEditadaInput.value) : null;
        const hasSpecialParams = dtValidade || dtOferta || descEditada;

        // 4. Implementa a REGRA do Ponto 4 (já validado acima)
        if (hasSpecialParams && totalCodes > 1) {
            ValidationManager.showError('dtValidade', t('erro_dados'));
            ValidationManager.showError('dtOferta', t('erro_dados'));
            ValidationManager.showError('descEditada', t('erro_dados'));
            return;
        }


        // 5. Monta o corpo da requisição (payload)
        const parametros = {
            filial: filialInput.value,
            dtValidade: dtValidade,
            dtOferta: dtOferta,
            descEditada: descEditada,
            tipoEmbalagem: document.querySelector('input[name="tipoEmbalagem"]:checked').value,
            tipoOferta: document.querySelector('input[name="tipoOferta"]:checked').value,
            formatoPapel: document.querySelector('input[name="formatoPapel"]:checked').value,
            searchBy: searchBy,
            isSingleSearch: totalCodes === 1
        };

        if (totalCodes === 1) {
            parametros.searchValue = allCodes[0];
        } else {
            parametros.searchValues = allCodes;
        }

        // 6. Chama a API (Backend) - USA URL DINÂMICO
        try {
            // Verificar cache primeiro
            const cacheKey = JSON.stringify(parametros);
            const cachedData = CacheManager.get(cacheKey);
            
            if (cachedData) {
                logger.info('Usando dados do cache');
                processResponse(cachedData, parametros);
                return;
            }

            // Mostrar loading
            LoadingManager.show('Gerando cartazes...');
            
            cartazContainer.innerHTML = '';
            if (placeholder) {
                placeholder.style.display = 'block';
                placeholder.textContent = 'A buscar dados...';
            }
            imprimirBtn.style.display = 'none';

            // CORREÇÃO: Usa window.location.origin para montar o URL da API
            const apiUrl = `${CONFIG.API.BASE_URL}/api/cartaz`;
            logger.info("Chamando API em:", apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parametros)
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.error || t('erro_api'));
            }

            // 7. Processa a Resposta (robusto)
            const dataResponse = await response.json();
            
            // Salvar no cache
            CacheManager.set(cacheKey, dataResponse);
            
            // Processar resposta
            processResponse(dataResponse, parametros);
            
        } catch (error) {
            LoadingManager.hide();
            logger.error('Erro ao gerar cartazes:', error);
            
            // Mostra o erro de conexão também no alerta
            ValidationManager.showError('searchCodProd', `${t('erro_dados')}: ${error.message}`);
            cartazContainer.innerHTML = `<div id="cartaz-placeholder" style="color: red;">${error.message}</div>`;
            imprimirBtn.style.display = 'none';
            
            // Log adicional para erros de conexão
            if (error.message.includes('Failed to fetch')) {
                logger.error("Falha ao buscar dados. Verifique se o servidor backend está rodando e acessível no endereço:", CONFIG.API.BASE_URL);
            }
        }
    });

    // Função para ajustar dinamicamente a fonte da descrição para caber no contêiner
    function ajustarFonteDescricao(descricaoElement) {
        if (!descricaoElement) return;

        const style = window.getComputedStyle(descricaoElement);
        let fontSize = parseFloat(style.fontSize); // em pixels

        // Reduz a fonte até que o texto não transborde mais
        while (descricaoElement.scrollHeight > descricaoElement.clientHeight && fontSize > 10) {
            fontSize -= 1; // Reduz 1px por vez para precisão
            descricaoElement.style.fontSize = fontSize + 'px';
        }
    }

    // Função para processar resposta da API
    function processResponse(dataResponse, parametros) {
        let dataArray = [];

        logger.info("DADOS RECEBIDOS DO SERVIDOR:", dataResponse);

        if (Array.isArray(dataResponse)) {
            dataArray = dataResponse;
        } else if (typeof dataResponse === 'object' && dataResponse !== null) {
            dataArray = [dataResponse];
        }

        // Limpa o container
        cartazContainer.innerHTML = '';
        if (placeholder) placeholder.style.display = 'none';

        // Verifica se a lista está vazia
        if (dataArray.length === 0) {
            throw new Error(t('erro_dados'));
        }

        // Constrói os cartazes
        const fragment = document.createDocumentFragment();
        dataArray.forEach(data => {
            const cartazElement = construirCartaz(data, parametros);
            if (cartazElement) {
                fragment.appendChild(cartazElement);
            }
        });
        cartazContainer.appendChild(fragment);

        // Ajusta o tamanho da fonte da descrição para caber no espaço
        cartazContainer.querySelectorAll('.cartaz-descricao').forEach(ajustarFonteDescricao);

        // Função para gerar barcodes de forma assíncrona
        function gerarBarcodesAnimadamente(barcodeElements, index = 0) {
            if (index >= barcodeElements.length) return;

            const barcodeElement = barcodeElements[index];
            const value = barcodeElement.getAttribute('data-barcode-value');
            if (value) {
                JsBarcode(barcodeElement, value, {
                    format: 'CODE128',
                    displayValue: true,
                    fontSize: 18
                });
            }
            // Chama o próximo frame de animação
            requestAnimationFrame(() => gerarBarcodesAnimadamente(barcodeElements, index + 1));
        }

        // Adia a geração de códigos de barras para melhorar a performance
        setTimeout(() => {
            const barcodeElements = cartazContainer.querySelectorAll('.barcode');
            gerarBarcodesAnimadamente(barcodeElements);
        }, 0);

        // Mostra o botão de imprimir
        imprimirBtn.style.display = 'inline-block';
        
        // Analytics
        Analytics.trackCartazGeneration(parametros.formatoPapel, dataArray.length);
        
        // Esconder loading
        LoadingManager.hide();
        
        // Limpar validações
        ValidationManager.clearAll();
    }

    // Event Listener do botão "Imprimir"
    imprimirBtn.addEventListener('click', () => {
        window.print();
    });
});
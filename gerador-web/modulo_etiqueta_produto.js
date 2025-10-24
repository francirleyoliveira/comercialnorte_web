document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os elementos da página
    const buscarBtn = document.getElementById('buscarBtn');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const codigosInput = document.getElementById('codigosInput');
    const etiquetaContainer = document.getElementById('etiqueta-container');

    // Quando o usuário clicar em "Gerar Etiquetas"
    buscarBtn.addEventListener('click', async () => {

        // 1. PEGAR OS DADOS DA TELA
        const filial = document.querySelector('input[name="filial"]:checked').value;
        const codigosTexto = codigosInput.value;
        const codigos = codigosTexto.split('\n').filter(cod => cod.trim() !== '');

        // Pega a data e hora da emissão uma única vez
        const dataHoraEmissao = new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (codigos.length === 0) {
            alert(t('erro_codigo_obrigatorio'));
            return;
        }

        try {
            // --- INÍCIO DA CORREÇÃO ---
            // 2. CHAMAR O BACKEND (API) - USA URL DINÂMICO
            // CORREÇÃO: Usa window.location.origin para montar o URL da API
            const apiUrl = `${window.location.origin}/api/etiquetas`;
            console.log("Módulo 1: Chamando API em:", apiUrl); // Log para depuração

            const response = await fetch(apiUrl, { // Usa a variável apiUrl
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filial: filial,
                    codigos: codigos
                })
            });
            // --- FIM DA CORREÇÃO ---

            if (!response.ok) {
                const erro = await response.json();
                // Tenta pegar a mensagem de erro do backend, senão usa uma genérica
                throw new Error(erro.error || `${t('erro_api')} ${response.status}: ${response.statusText}`);
            }

            // O backend nos devolve uma LISTA de produtos
            const produtos = await response.json();

            // 3. GERAR AS ETIQUETAS DINAMICAMENTE
            etiquetaContainer.innerHTML = ''; // Limpa etiquetas antigas

            if (produtos.length === 0) {
                 // Mostra mensagem se nenhum produto for encontrado
                 etiquetaContainer.innerHTML = `<p style="text-align: center; color: red;">${t('erro_dados')}</p>`;
                 imprimirBtn.style.display = 'none';
                 return; // Sai da função
            }


            produtos.forEach(produto => {
                // Para cada produto encontrado, criamos os elementos HTML

                const etiquetaDiv = document.createElement('div');
                etiquetaDiv.className = 'etiqueta';

                const descH3 = document.createElement('h3');
                // Adiciona um fallback caso a descrição seja nula/vazia
                descH3.textContent = produto.DESCRICAO || 'Produto sem descrição';

                const detalhesP = document.createElement('p');
                detalhesP.className = 'detalhes';
                // Adiciona fallbacks para os detalhes
                detalhesP.textContent = `Emb: ${produto.EMBALAGEM || '?'} | Qt: ${produto.QTUNIT || '?'} | Prod: ${produto.CODPROD || '?'}`;

                const barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                barcodeSvg.className = 'barcode';
                 // Adiciona ID único ao SVG para JsBarcode
                barcodeSvg.id = `barcode-svg-etiqueta-${produto.CODPROD || Math.random()}`;


                const dataHoraP = document.createElement('p');
                dataHoraP.className = 'data-emissao';
                dataHoraP.textContent = dataHoraEmissao;

                // Adiciona os elementos na etiqueta
                etiquetaDiv.appendChild(descH3);
                etiquetaDiv.appendChild(detalhesP);
                etiquetaDiv.appendChild(barcodeSvg);
                etiquetaDiv.appendChild(dataHoraP);

                // Adiciona a etiqueta pronta no container
                etiquetaContainer.appendChild(etiquetaDiv);

                // 4. GERAR O CÓDIGO DE BARRAS (com verificação)
                if (produto.CODAUXILIAR) {
                    // Seleciona o elemento SVG que acabamos de adicionar
                    const barcodeElement = etiquetaDiv.querySelector(`#${barcodeSvg.id}`);
                    if (barcodeElement) {
                         JsBarcode(barcodeElement, produto.CODAUXILIAR, {
                            format: 'CODE128',
                            displayValue: true,
                            text: produto.CODAUXILIAR,
                            fontSize: 14,
                            margin: 10,
                            height: 60
                        });
                    } else {
                         console.error(`Elemento do código de barras da etiqueta não encontrado: #${barcodeSvg.id}`);
                    }
                } else {
                    console.warn(`Produto ${produto.CODPROD} sem CODAUXILIAR para gerar código de barras.`);
                }
            });

            // 5. MOSTRAR BOTÃO DE IMPRIMIR
            if (produtos.length > 0) {
                imprimirBtn.style.display = 'block';
            }

        } catch (error) {
            // Mostra um alerta mais informativo
            alert(`Erro ao gerar etiquetas: ${error.message}`);
            etiquetaContainer.innerHTML = `<p style="text-align: center; color: red;">${error.message}</p>`;
            imprimirBtn.style.display = 'none';
             // Log adicional para erros de conexão
             if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                 console.error("Falha ao buscar dados das etiquetas. Verifique se o servidor backend está rodando e acessível no endereço:", window.location.origin);
            }
        }
    });

    // Quando o usuário clicar em "Imprimir"
    imprimirBtn.addEventListener('click', () => {
        window.print();
    });
});
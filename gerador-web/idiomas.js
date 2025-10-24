// Sistema de Tradução - Múltiplos Idiomas
const idiomas = {
    'pt': {
        // Menu Principal
        'portal_titulo': 'Portal de Ferramentas',
        'portal_subtitulo': 'Selecione o módulo que deseja utilizar:',
        'etiquetas_titulo': 'Etiquetas de Produto',
        'etiquetas_descricao': 'Gerador de etiquetas de produto (formato 105x29mm).',
        'cartazes_titulo': 'Gerador de Cartazes',
        'cartazes_descricao': 'Módulo para gerar cartazes de preço (A4, A3, etc).',
        
        // Navegação
        'voltar_menu': 'Voltar ao Menu Principal',
        
        // Etiquetas de Produto
        'etiqueta_titulo': 'Gerador de Etiquetas de Produto',
        'filial_label': 'Filial:',
        'filial_2': 'Filial 2',
        'filial_3': 'Filial 3',
        'codigos_label': 'Digite os Códigos Auxiliares (um por linha):',
        'codigos_placeholder': 'Ex: 789001\n789002\n789003',
        'gerar_etiquetas': 'Gerar Etiquetas',
        'imprimir_etiquetas': 'Imprimir Etiquetas',
        'erro_codigo_obrigatorio': 'Por favor, digite pelo menos um código auxiliar.',
        
        // Cartazes
        'cartaz_titulo': 'Gerador de Cartazes',
        'pesquisar_produto': '1. Pesquisar Produto (Use APENAS um campo)',
        'filial_select': 'Filial:',
        'cod_internos': 'Cód. Internos (um por linha):',
        'cod_auxiliares': 'Cód. Auxiliares (um por linha):',
        'cod_internos_placeholder': '12345\n12346\n12347',
        'cod_auxiliares_placeholder': '7891000000000\n7891000000001',
        'parametros_cartaz': '2. Parâmetros do Cartaz',
        'aviso_legenda': '(Preencher os campos abaixo força a pesquisa de UM SÓ produto)',
        'validade_produto': 'Validade do Produto:',
        'vigencia_oferta': 'Vigência da Oferta:',
        'descricao_manual': 'Descrição Manual (Opcional):',
        'descricao_placeholder': 'Sobrescreve a descrição do banco',
        'tipo_embalagem': 'Tipo Embalagem:',
        'tipo_padrao': 'Padrão (Venda/Atac/Master)',
        'tipo_venda': 'Apenas Venda',
        'tipo_master': 'Apenas Master',
        'e_oferta': 'É Oferta?',
        'nao': 'Não',
        'sim': 'Sim (Fundo Amarelo)',
        'formato_impressao': '3. Formato de Impressão',
        'meia_a4': 'Meia A4 (Paisagem)',
        'a4_vertical': 'A4 (Vertical)',
        'a3_vertical': 'A3 (Vertical)',
        'gerar_cartazes': 'Gerar Cartaz(es)',
        'imprimir_cartazes': 'Imprimir Cartaz(es)',
        'preview_placeholder': 'A pré-visualização dos seus cartazes aparecerá aqui.',
        
        // Mensagens de erro e sucesso
        'erro_api': 'Erro ao conectar com a API',
        'erro_dados': 'Erro ao processar dados',
        'sucesso_geracao': 'Gerado com sucesso!',
        
        // Campos de dados
        'preco_varejo': 'Preço Varejo',
        'preco_atacado': 'Preço Atacado',
        'preco_master': 'Preço Master',
        'codigo_barras': 'Código de Barras',
        'descricao': 'Descrição',
        'validade': 'Validade',
        'oferta_ate': 'Oferta até',
        'unidade': 'Unidade',
        'peso': 'Peso',
        'volume': 'Volume'
    },
    
    'en': {
        // Main Menu
        'portal_titulo': 'Tools Portal',
        'portal_subtitulo': 'Select the module you want to use:',
        'etiquetas_titulo': 'Product Labels',
        'etiquetas_descricao': 'Product label generator (105x29mm format).',
        'cartazes_titulo': 'Poster Generator',
        'cartazes_descricao': 'Module to generate price posters (A4, A3, etc).',
        
        // Navigation
        'voltar_menu': 'Back to Main Menu',
        
        // Product Labels
        'etiqueta_titulo': 'Product Label Generator',
        'filial_label': 'Branch:',
        'filial_2': 'Branch 2',
        'filial_3': 'Branch 3',
        'codigos_label': 'Enter Auxiliary Codes (one per line):',
        'codigos_placeholder': 'Ex: 789001\n789002\n789003',
        'gerar_etiquetas': 'Generate Labels',
        'imprimir_etiquetas': 'Print Labels',
        'erro_codigo_obrigatorio': 'Please enter at least one auxiliary code.',
        
        // Posters
        'cartaz_titulo': 'Poster Generator',
        'pesquisar_produto': '1. Search Product (Use ONLY one field)',
        'filial_select': 'Branch:',
        'cod_internos': 'Internal Codes (one per line):',
        'cod_auxiliares': 'Auxiliary Codes (one per line):',
        'cod_internos_placeholder': '12345\n12346\n12347',
        'cod_auxiliares_placeholder': '7891000000000\n7891000000001',
        'parametros_cartaz': '2. Poster Parameters',
        'aviso_legenda': '(Filling the fields below forces the search of ONLY ONE product)',
        'validade_produto': 'Product Expiry:',
        'vigencia_oferta': 'Offer Validity:',
        'descricao_manual': 'Manual Description (Optional):',
        'descricao_placeholder': 'Overrides database description',
        'tipo_embalagem': 'Package Type:',
        'tipo_padrao': 'Standard (Retail/Wholesale/Master)',
        'tipo_venda': 'Retail Only',
        'tipo_master': 'Master Only',
        'e_oferta': 'Is Offer?',
        'nao': 'No',
        'sim': 'Yes (Yellow Background)',
        'formato_impressao': '3. Print Format',
        'meia_a4': 'Half A4 (Landscape)',
        'a4_vertical': 'A4 (Vertical)',
        'a3_vertical': 'A3 (Vertical)',
        'gerar_cartazes': 'Generate Poster(s)',
        'imprimir_cartazes': 'Print Poster(s)',
        'preview_placeholder': 'Your poster preview will appear here.',
        
        // Error and success messages
        'erro_api': 'Error connecting to API',
        'erro_dados': 'Error processing data',
        'sucesso_geracao': 'Generated successfully!',
        
        // Data fields
        'preco_varejo': 'Retail Price',
        'preco_atacado': 'Wholesale Price',
        'preco_master': 'Master Price',
        'codigo_barras': 'Barcode',
        'descricao': 'Description',
        'validade': 'Expiry',
        'oferta_ate': 'Offer until',
        'unidade': 'Unit',
        'peso': 'Weight',
        'volume': 'Volume'
    },
    
    'es': {
        // Menú Principal
        'portal_titulo': 'Portal de Herramientas',
        'portal_subtitulo': 'Seleccione el módulo que desea utilizar:',
        'etiquetas_titulo': 'Etiquetas de Producto',
        'etiquetas_descricao': 'Generador de etiquetas de producto (formato 105x29mm).',
        'cartazes_titulo': 'Generador de Carteles',
        'cartazes_descricao': 'Módulo para generar carteles de precio (A4, A3, etc).',
        
        // Navegación
        'voltar_menu': 'Volver al Menú Principal',
        
        // Etiquetas de Producto
        'etiqueta_titulo': 'Generador de Etiquetas de Producto',
        'filial_label': 'Sucursal:',
        'filial_2': 'Sucursal 2',
        'filial_3': 'Sucursal 3',
        'codigos_label': 'Ingrese los Códigos Auxiliares (uno por línea):',
        'codigos_placeholder': 'Ej: 789001\n789002\n789003',
        'gerar_etiquetas': 'Generar Etiquetas',
        'imprimir_etiquetas': 'Imprimir Etiquetas',
        'erro_codigo_obrigatorio': 'Por favor, ingrese al menos un código auxiliar.',
        
        // Carteles
        'cartaz_titulo': 'Generador de Carteles',
        'pesquisar_produto': '1. Buscar Producto (Use SOLO un campo)',
        'filial_select': 'Sucursal:',
        'cod_internos': 'Códigos Internos (uno por línea):',
        'cod_auxiliares': 'Códigos Auxiliares (uno por línea):',
        'cod_internos_placeholder': '12345\n12346\n12347',
        'cod_auxiliares_placeholder': '7891000000000\n7891000000001',
        'parametros_cartaz': '2. Parámetros del Cartel',
        'aviso_legenda': '(Llenar los campos abajo fuerza la búsqueda de UN SOLO producto)',
        'validade_produto': 'Vencimiento del Producto:',
        'vigencia_oferta': 'Vigencia de la Oferta:',
        'descricao_manual': 'Descripción Manual (Opcional):',
        'descricao_placeholder': 'Sobrescribe la descripción de la base de datos',
        'tipo_embalagem': 'Tipo de Empaque:',
        'tipo_padrao': 'Estándar (Venta/Mayor/Master)',
        'tipo_venda': 'Solo Venta',
        'tipo_master': 'Solo Master',
        'e_oferta': '¿Es Oferta?',
        'nao': 'No',
        'sim': 'Sí (Fondo Amarillo)',
        'formato_impressao': '3. Formato de Impresión',
        'meia_a4': 'Media A4 (Paisaje)',
        'a4_vertical': 'A4 (Vertical)',
        'a3_vertical': 'A3 (Vertical)',
        'gerar_cartazes': 'Generar Cartel(es)',
        'imprimir_cartazes': 'Imprimir Cartel(es)',
        'preview_placeholder': 'La vista previa de sus carteles aparecerá aquí.',
        
        // Mensajes de error y éxito
        'erro_api': 'Error al conectar con la API',
        'erro_dados': 'Error al procesar datos',
        'sucesso_geracao': '¡Generado con éxito!',
        
        // Campos de datos
        'preco_varejo': 'Precio Minorista',
        'preco_atacado': 'Precio Mayorista',
        'preco_master': 'Precio Master',
        'codigo_barras': 'Código de Barras',
        'descricao': 'Descripción',
        'validade': 'Vencimiento',
        'oferta_ate': 'Oferta hasta',
        'unidade': 'Unidad',
        'peso': 'Peso',
        'volume': 'Volumen'
    }
};

// Função para obter tradução
function t(chave, idioma = 'pt') {
    return idiomas[idioma] && idiomas[idioma][chave] ? idiomas[idioma][chave] : chave;
}

// Função para aplicar traduções na página
function aplicarTraducoes(idioma = 'pt') {
    // Aplicar traduções em elementos com data-t
    document.querySelectorAll('[data-t]').forEach(elemento => {
        const chave = elemento.getAttribute('data-t');
        const texto = t(chave, idioma);
        
        if (elemento.tagName === 'INPUT' && elemento.type === 'text') {
            elemento.placeholder = texto;
        } else if (elemento.tagName === 'TEXTAREA') {
            elemento.placeholder = texto;
        } else {
            elemento.textContent = texto;
        }
    });
    
    // Aplicar traduções em títulos
    const titulos = document.querySelectorAll('h1, h2, h3, title');
    titulos.forEach(titulo => {
        const chave = titulo.getAttribute('data-t');
        if (chave) {
            titulo.textContent = t(chave, idioma);
        }
    });
}

// Função para mudar idioma
function mudarIdioma(novoIdioma) {
    localStorage.setItem('idioma_selecionado', novoIdioma);
    aplicarTraducoes(novoIdioma);
}

// Carregar idioma salvo ou usar padrão
function carregarIdioma() {
    const idiomaSalvo = localStorage.getItem('idioma_selecionado') || 'pt';
    aplicarTraducoes(idiomaSalvo);
    return idiomaSalvo;
}

// Exportar para uso global
window.idiomas = idiomas;
window.t = t;
window.aplicarTraducoes = aplicarTraducoes;
window.mudarIdioma = mudarIdioma;
window.carregarIdioma = carregarIdioma;

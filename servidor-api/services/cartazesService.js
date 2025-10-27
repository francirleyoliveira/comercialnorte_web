// services/cartazesService.js
// Lógica de negócio para cartazes

const db = require('../db');
const queries = require('../queries/cartazes');

/**
 * Busca dados para geração de cartazes
 * @param {Object} params - Parâmetros da busca
 * @returns {Promise<Array>} Lista de produtos para cartazes
 */
async function buscarCartazes(params) {
    const {
        filial,
        dtValidade,
        dtOferta,
        descEditada,
        tipoEmbalagem,
        tipoOferta,
        searchBy,
        searchValue,
        searchValues
    } = params;

    // Validação
    if (!filial || !searchBy) {
        throw new Error('Filial e tipo de pesquisa são obrigatórios');
    }

    const isBatchSearch = Array.isArray(searchValues) && searchValues.length > 0;
    const isSingleSearch = typeof searchValue === 'string' && searchValue.trim() !== '';

    if (!isSingleSearch && !isBatchSearch) {
        throw new Error('Nenhum código de pesquisa fornecido');
    }

    // Prepara a query base
    const { sql: baseSQL } = queries.getCartazesPorCodigos();

    // Adiciona filtro de pesquisa
    const codes = isBatchSearch ? searchValues : [];
    const searchFilter = queries.addSearchFilter(searchBy, isSingleSearch, codes);
    const sql = baseSQL + searchFilter + ' ORDER BY DESCRICAO ASC';

    // Prepara os binds
    const bindParams = {
        CODFILIAL: filial,
        DTVALIDADEPRODUTO: dtValidade ? new Date(dtValidade) : null,
        DTVIGENCIAOFERTA: dtOferta ? new Date(dtOferta) : null,
        DESCRICAOEDIT: descEditada || null,
        tipoembalagem: tipoEmbalagem || 'PADRAO',
        oferta: tipoOferta || 'N'
    };

    // Adiciona binds de pesquisa
    if (isSingleSearch) {
        bindParams.searchValue = searchValue.trim();
    } else if (isBatchSearch) {
        searchValues.forEach((cod, index) => {
            bindParams[`id${index}`] = cod.trim();
        });
    }

    // Executa a query
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(sql, bindParams, {
            outFormat: require('oracledb').OUT_FORMAT_OBJECT
        });

        return result.rows;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

/**
 * Valida parâmetros especiais de cartaz
 * @param {Object} params - Parâmetros a validar
 * @returns {Object} Resultado da validação
 */
function validarParametrosCartaz(params) {
    const { dtValidade, dtOferta, descEditada, searchValue, searchValues } = params;
    
    const temParametrosEspeciais = dtValidade || dtOferta || descEditada;
    const totalCodigos = searchValues ? searchValues.length : (searchValue ? 1 : 0);

    if (temParametrosEspeciais && totalCodigos > 1) {
        return {
            valido: false,
            mensagem: 'Parâmetros especiais (validade, oferta, descrição) só podem ser usados com um único produto'
        };
    }

    return { valido: true };
}

module.exports = {
    buscarCartazes,
    validarParametrosCartaz
};
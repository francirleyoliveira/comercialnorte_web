// services/etiquetasService.js
// Lógica de negócio para etiquetas

const db = require('../db');
const queries = require('../queries/etiquetas');

/**
 * Busca etiquetas por códigos auxiliares
 * @param {string} filial - Código da filial
 * @param {Array<string>} codigos - Lista de códigos auxiliares
 * @returns {Promise<Array>} Lista de etiquetas
 */
async function buscarEtiquetas(filial, codigos) {
    // Validação
    if (!filial || !Array.isArray(codigos) || codigos.length === 0) {
        throw new Error('Filial e códigos são obrigatórios');
    }

    // Sanitiza os códigos
    const codigosSanitizados = codigos
        .map(cod => cod.trim())
        .filter(cod => cod.length > 0);

    if (codigosSanitizados.length === 0) {
        throw new Error('Nenhum código válido fornecido');
    }

    // Prepara a query
    const { sql } = queries.getEtiquetasPorCodigos(codigosSanitizados);

    // Prepara os binds
    const bindParams = { filial };
    codigosSanitizados.forEach((cod, index) => {
        bindParams[`id${index}`] = cod;
    });

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
 * Formata os dados das etiquetas para resposta
 * @param {Array} etiquetas - Lista de etiquetas brutas do banco
 * @returns {Array} Etiquetas formatadas
 */
function formatarEtiquetas(etiquetas) {
    return etiquetas.map(etiqueta => ({
        codigoAuxiliar: etiqueta.CODAUXILIAR,
        codigoProduto: etiqueta.CODPROD,
        descricao: etiqueta.DESCRICAO || 'Produto sem descrição',
        embalagem: etiqueta.EMBALAGEM || 'UN',
        quantidade: etiqueta.QTUNIT || 1
    }));
}

module.exports = {
    buscarEtiquetas,
    formatarEtiquetas
};
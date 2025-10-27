// queries/etiquetas.js
// Queries SQL relacionadas a etiquetas

/**
 * Query para buscar etiquetas por códigos auxiliares
 * @param {Array<string>} codigos - Lista de códigos (será convertida em binds)
 * @returns {Object} { sql, requiresBinds: true }
 */
const getEtiquetasPorCodigos = (codigos) => {
    // Cria os placeholders para os binds (:id0, :id1, :id2...)
    const inBinds = codigos.map((_, index) => `:id${index}`);
    
    const sql = `
        SELECT DISTINCT 
            a.CODAUXILIAR, 
            a.CODPROD,
            CASE 
                WHEN A.DESCRICAOECF IS NULL THEN (
                    SELECT DESCRICAO 
                    FROM pcprodut 
                    WHERE CODPROD = A.CODPROD
                )
                ELSE A.DESCRICAOECF
            END AS DESCRICAO,
            a.EMBALAGEM, 
            a.QTUNIT 
        FROM pcembalagem a
        INNER JOIN pcprodut b ON a.CODPROD = b.CODPROD
        WHERE 1=1
            AND A.DTINATIVO IS NULL
            AND B.DTEXCLUSAO IS NULL
            AND A.CODFILIAL = :filial
            AND A.PERMITEIMPRESSAOETIQUETA = 'S'
            AND A.EMBALAGEM NOT LIKE '%VIST%'
            AND A.QTUNIT = (
                SELECT MAX(QTUNIT) 
                FROM pcembalagem 
                WHERE CODFILIAL = :filial
                    AND CODPROD = A.CODPROD 
                    AND DTINATIVO IS NULL 
                    AND PERMITEIMPRESSAOETIQUETA = 'S' 
                    AND EMBALAGEM NOT LIKE '%VIST%'
            )
            AND A.CODPROD IN (
                SELECT codprod 
                FROM pcembalagem 
                WHERE CODAUXILIAR IN (${inBinds.join(',')})
            )
        ORDER BY A.CODPROD, A.CODAUXILIAR
    `;
    
    return {
        sql,
        requiresBinds: true
    };
};

module.exports = {
    getEtiquetasPorCodigos
};
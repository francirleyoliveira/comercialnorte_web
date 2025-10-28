// queries/cartazes.js
// Queries SQL relacionadas a cartazes (simplificada e modular)

/**
 * Subquery: Busca código auxiliar mais recente
 */
const getCodigoAuxiliarSubquery = () => `
    CASE 
        WHEN (
            SELECT DISTINCT PCMOV.CODAUXILIAR
            FROM PCMOV 
            WHERE DTMOV >= TRUNC(SYSDATE)
                AND PCMOV.CODPROD = tblpreco.codprod
                AND PCMOV.NUMTRANSVENDA = (
                    SELECT MAX(NUMTRANSVENDA) 
                    FROM PCMOV 
                    WHERE CODPROD = tblpreco.codprod 
                        AND PCMOV.CODFILIAL = :CODFILIAL
                        AND PCMOV.DTMOV = (
                            SELECT PCEST.DTULTSAIDA 
                            FROM PCEST 
                            WHERE CODPROD = tblpreco.codprod 
                                AND CODFILIAL = :CODFILIAL
                        )
                )
        ) IS NULL
        THEN (
            SELECT pcembalagem.CODAUXILIAR 
            FROM pcembalagem
            WHERE pcembalagem.CODPROD = tblpreco.codprod
                AND pcembalagem.QTUNIT = tblpreco.qtunit
                AND pcembalagem.CODFILIAL = :CODFILIAL
                AND pcembalagem.DTINATIVO IS NULL
                AND ROWNUM = 1
        )
        ELSE (
            SELECT DISTINCT PCMOV.CODAUXILIAR
            FROM PCMOV 
            WHERE DTMOV >= TRUNC(SYSDATE)
                AND PCMOV.CODPROD = tblpreco.codprod
                AND PCMOV.NUMTRANSVENDA = (
                    SELECT MAX(NUMTRANSVENDA) 
                    FROM PCMOV 
                    WHERE CODPROD = tblpreco.codprod
                        AND PCMOV.CODAUXILIAR <> tblpreco.codprod 
                        AND PCMOV.CODFILIAL = :CODFILIAL 
                        AND PCMOV.DTMOV = (
                            SELECT PCEST.DTULTSAIDA 
                            FROM PCEST 
                            WHERE CODPROD = tblpreco.codprod 
                                AND CODFILIAL = :CODFILIAL
                        )
                )
        )
    END as codauxiliar
`;

/**
 * Subquery: Tabela de preços de venda
 */
const getTabelaPrecoVenda = () => `
    (
        SELECT 
            e.codauxiliar, 
            e.qtunit, 
            e.embalagem, 
            e.qtminimaatacado, 
            e.descricaoecf, 
            e.codprod, 
            buscaprecos(e.codfilial, '1', e.codauxiliar, TRUNC(SYSDATE)) as preco 
        FROM pcembalagem e 
        WHERE e.codfilial = :CODFILIAL
            AND e.embalagem NOT LIKE '%VISTA%'
            AND e.permiteimpressaoetiqueta = 'S'
            AND e.qtunit = (
                SELECT MIN(qtunit) 
                FROM pcembalagem 
                WHERE codfilial = e.codfilial 
                    AND codprod = e.codprod 
                    AND permiteimpressaoetiqueta = 'S'
            )
            AND e.dtinativo IS NULL
    ) tblpreco
`;

/**
 * Subquery: Tabela de preços de caixa/master
 */
const getTabelaPrecoCaixa = () => `
    (
        SELECT 
            nvl(coluna_preco(tblprecocx.preco,'PVENDA'),0) as precocx, 
            tblprecocx.embalagem, 
            tblprecocx.qtunit, 
            tblprecocx.codprod, 
            tblprecocx.codfilial
        FROM (
            SELECT 
                e.codauxiliar, 
                e.embalagem, 
                e.qtunit, 
                e.codprod, 
                e.codfilial, 
                buscaprecos(e.codfilial, '1', e.codauxiliar, TRUNC(SYSDATE)) as preco 
            FROM pcembalagem e 
            WHERE e.codfilial = :CODFILIAL 
                AND e.embalagem NOT LIKE '%VISTA%'
                AND e.permiteimpressaoetiqueta <> 'N' 
                AND e.dtinativo IS NULL
        ) tblprecocx
        WHERE tblprecocx.qtunit = (
            SELECT MAX(qtunit) 
            FROM pcembalagem 
            WHERE codfilial = tblprecocx.codfilial 
                AND permiteimpressaoetiqueta <> 'N' 
                AND dtinativo IS NULL 
                AND codprod = tblprecocx.codprod
        )
        AND tblprecocx.codfilial = :CODFILIAL
    ) tblprecocx
`;

/**
 * Subquery: Parâmetros de data e tipo
 */
const getParametrosSubquery = () => `
    (
        SELECT 
            TO_CHAR(:DTVALIDADEPRODUTO, 'DD"/"MM"/"YYYY','NLS_DATE_LANGUAGE=PORTUGUESE') as VALIDADEPRODUTO,
            TO_CHAR(:DTVIGENCIAOFERTA, 'DD"/"MM"/"YYYY','NLS_DATE_LANGUAGE=PORTUGUESE') as VIGENCIAOFERTA,
            'Validade do Produto:' as vlp,
            '*Oferta Válida até:' as vlo,
            :DESCRICAOEDIT as DESCRICAOEDIT,
            :tipoembalagem as tipoembalagem,
            :oferta as tipooferta
        FROM DUAL
    )
`;

/**
 * Query principal para buscar dados de cartazes
 */
const getCartazesPorCodigos = () => {
    const sql = `
        SELECT DISTINCT
            tblpreco.codprod,
            ${getCodigoAuxiliarSubquery()},
            
            -- Preço principal baseado no tipo
            CASE 
                WHEN tipoembalagem = 'VENDA' 
                THEN nvl(coluna_preco(tblpreco.preco,'PVENDA'),0) 
                ELSE tblprecocx.precocx 
            END as PRECO,
            
            -- Tipo de embalagem
            CASE 
                WHEN tblpreco.embalagem = 'BARRA' AND tipoembalagem = 'VENDA' 
                    THEN 'PRECO DO KG/BARRA INTEIRA'
                WHEN tipoembalagem = 'MASTER' 
                    THEN tblprecocx.embalagem
                WHEN tipoembalagem = 'VENDA' 
                    THEN tblpreco.embalagem 
            END as EMBA,
            
            -- Descrição do produto
            CASE 
                WHEN tblpreco.descricaoecf IS NULL
                THEN pcprodut.descricao
                ELSE tblpreco.descricaoecf
            END as DESCRICAO,
            
            -- Preços individuais
            nvl(coluna_preco(tblpreco.preco,'PVENDA'),0) as pvenda,
            nvl(coluna_preco(tblpreco.preco,'PVENDAATAC'),0) as pvendaatac,
            (tblprecocx.precocx/tblprecocx.qtunit) as p,
            
            -- Quantidade mínima atacado
            CASE 
                WHEN (tblpreco.qtminimaatacado <= 2) OR (tblpreco.qtminimaatacado IS NULL)
                THEN NULL
                ELSE 'A PARTIR DE ' || tblpreco.qtminimaatacado
            END as QTMINIATAC,
            
            -- Dados de embalagem
            tblpreco.qtminimaatacado,
            tblpreco.qtunit,
            tblpreco.embalagem,
            tblprecocx.precocx,
            
            CASE 
                WHEN tblprecocx.embalagem IS NULL THEN NULL
                ELSE tblprecocx.embalagem 
            END as embalagemcx,
            
            tblprecocx.qtunit as qtunitcx,
            pcprodut.dirfotoprod,
            DESCRICAOEDIT,
            
            -- Validade do produto (condicional)
            CASE 
                WHEN :DTVALIDADEPRODUTO < TRUNC(SYSDATE) THEN NULL
                ELSE vlp
            END as VALPRODUTO,
            
            CASE 
                WHEN :DTVALIDADEPRODUTO < TRUNC(SYSDATE) THEN NULL
                ELSE VALIDADEPRODUTO
            END as DTVALPRODUTO,
            
            -- Vigência da oferta (condicional)
            CASE 
                WHEN :DTVIGENCIAOFERTA < TRUNC(SYSDATE) THEN NULL
                ELSE VIGENCIAOFERTA
            END as FIMOFERTA,
            
            CASE 
                WHEN :DTVIGENCIAOFERTA < TRUNC(SYSDATE) THEN NULL
                ELSE vlo
            END as OFERTA,
            
            tipooferta,
            CASE 
                WHEN tipooferta = 'N' THEN NULL 
                ELSE 'R:\\800\\RELFUNDO\\MeiaA4Promo.PNG' 
            END as DIRRELFUNDO
            
        FROM 
            ${getTabelaPrecoVenda()},
            ${getTabelaPrecoCaixa()},
            pcprodut,
            ${getParametrosSubquery()}
            
        WHERE 1=1 
            AND tblprecocx.codprod(+) = tblpreco.codprod
            AND pcprodut.codprod = tblpreco.codprod
            AND pcprodut.dtexclusao IS NULL
    `;
    
    return {
        sql,
        requiresBinds: true
    };
};

/**
 * Adiciona filtro de pesquisa à query
 * @param {string} searchBy - 'codprod' ou 'codauxiliar'
 * @param {boolean} isSingle - Se é pesquisa única ou múltipla
 * @param {Array<string>} codes - Lista de códigos (se múltipla)
 */
const addSearchFilter = (searchBy, isSingle, codes = []) => {
    if (isSingle) {
        if (searchBy === 'codprod') {
            return ' AND tblpreco.codprod = :searchValue';
        } else {
            return ' AND tblpreco.codprod IN (SELECT codprod FROM pcembalagem WHERE codauxiliar = :searchValue)';
        }
    } else {
        const inBinds = codes.map((_, index) => `:id${index}`);
        
        if (searchBy === 'codprod') {
            return ` AND tblpreco.codprod IN (${inBinds.join(',')})`;
        } else {
            return ` AND tblpreco.codprod IN (SELECT codprod FROM pcembalagem WHERE codauxiliar IN (${inBinds.join(',')}))`;
        }
    }
};

module.exports = {
    getCartazesPorCodigos,
    addSearchFilter
};
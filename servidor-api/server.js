/* --- Importação das bibliotecas --- */
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path'); // <-- ADICIONE ESTA LINHA

/* --- INICIALIZAÇÃO DO MODO THICK --- */
try {
  // CONFIRA SE ESTE CAMINHO AINDA ESTÁ CORRETO!
  // (O caminho para o seu "Cliente_Oracle_11G_64Bits")
  oracledb.initOracleClient({ libDir: 'C:\instantclient_11_2' }); 
  console.log("[Servidor] Oracle Client inicializado em Modo Thick.");
} catch (err) {
  console.error("[Servidor] ERRO AO INICIALIZAR O ORACLE CLIENT:", err);
  process.exit(1); 
}

/* --- 1. CONFIGURAÇÃO DO BANCO DE DADOS --- */
const dbConfig = {
    user: "COMERCIALNORTE",
    password: "usr14cnor",
    connectString: "192.168.0.199:1521/WINT" 
};

/* --- 2. INICIALIZAÇÃO DO SERVIDOR --- */
const app = express();
const port = 3000;
app.use(cors()); 
// **NOVO**: Adicionamos o 'express.json()' para o servidor entender o JSON enviado pelo frontend
app.use(express.json()); 

/*
 * =======================================================
 * SERVIR O FRONTEND (FICHEIROS ESTÁTICOS)
 * =======================================================
 */
// Define o caminho absoluto para a pasta do seu frontend
const frontendPath = path.join(__dirname, '..', 'gerador-web');
//                                   ^-- Diretório atual (servidor-api)
//                                      ^-- Volta uma pasta (para D:\)
//                                          ^-- Entra na pasta gerador-web

console.log(`[Servidor] Servindo arquivos do Frontend de: ${frontendPath}`);

// Faz o servidor servir os ficheiros HTML, CSS, JS dessa pasta
app.use(express.static(frontendPath));

// Redireciona a raiz '/' para o 'index.html' do frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* --- Ponto 2: Servidor de Imagens Estáticas --- */
// Mapeia o URL '/imagens' para a sua pasta de rede
app.use('/imagens', express.static('R:\\FOTOS PRODUTOS'));

/* --- 3. CRIAÇÃO DA NOVA ROTA DA API --- */
// Mudamos de app.get para app.post, pois vamos enviar uma lista de dados (JSON)
app.post('/api/etiquetas', async (req, res) => {
    
    // Pega os dados enviados pelo frontend (ex: { filial: "2", codigos: ["123", "456"] })
    const { filial, codigos } = req.body;

    // Validação inicial
    if (!filial || !codigos || codigos.length === 0) {
        return res.status(400).json({ error: 'Filial ou códigos não fornecidos' });
    }

    let connection;
    try {
        // 1. Conecta ao banco
        connection = await oracledb.getConnection(dbConfig);
        console.log(`[Servidor] Conectado. Buscando ${codigos.length} códigos para Filial: ${filial}`);

        // 2. Construção da Query Dinâmica (para o 'IN' clause)
        // Isso é crucial para a segurança e para a query funcionar
        const bindParams = { filial: filial }; // Parâmetro :filial
        const inBinds = [];

        codigos.forEach((cod, index) => {
            const bindName = `id${index}`; // Cria :id0, :id1, :id2, ...
            bindParams[bindName] = cod.trim(); // Adiciona o código ao objeto de binds
            inBinds.push(`:${bindName}`); // Adiciona o nome do bind à lista
        });
        
        // A sua query, modificada para usar os binds dinâmicos
        // Trocamos a subquery complexa por uma busca direta no CODAUXILIAR,
        // conforme sua descrição ("utilizando a coluna de 'CODAUXILIAR'")
        const query = `
            SELECT DISTINCT a.CODAUXILIAR, a.CODPROD,
                CASE WHEN A.DESCRICAOECF IS NULL
                    THEN (SELECT DESCRICAO FROM pcprodut WHERE CODPROD = A.CODPROD)
                    ELSE A.DESCRICAOECF
                END AS DESCRICAO,
                a.EMBALAGEM, a.QTUNIT 
            FROM pcembalagem a
            JOIN pcprodut b ON a.CODPROD = b.CODPROD
            WHERE A.DTINATIVO IS NULL
                AND B.DTEXCLUSAO IS NULL
                AND A.CODFILIAL = :filial
                AND A.QTUNIT = (SELECT MAX(QTUNIT) 
                                FROM pcembalagem 
                                WHERE CODFILIAL = :filial
                                AND CODPROD = A.CODPROD 
                                AND DTINATIVO IS NULL 
                                AND PERMITEIMPRESSAOETIQUETA = 'S' 
                                AND EMBALAGEM NOT LIKE '%VIST%')
                AND A.PERMITEIMPRESSAOETIQUETA = 'S'
                AND A.EMBALAGEM NOT LIKE '%VIST%'
                AND A.CODPROD IN (select codprod from pcembalagem WHERE CODAUXILIAR IN (${inBinds.join(',')})) 
            ORDER BY A.CODPROD, A.CODAUXILIAR
        `;

        // 3. Executa a query
        const result = await connection.execute(
            query,
            bindParams, // Passa todos os binds (ex: { filial: "2", id0: "123", id1: "456" })
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 4. Verifica se encontrou
        if (result.rows.length === 0) {
            console.log(`[Servidor] Nenhum produto encontrado.`);
            return res.status(404).json({ error: 'Nenhum produto encontrado com esses critérios.' });
        }

        // 5. Devolve a LISTA (array) de produtos para o frontend
        console.log(`[Servidor] ${result.rows.length} etiquetas encontradas.`);
        res.json(result.rows);

    } catch (err) {
        console.error("[Servidor] Erro ao buscar etiquetas:", err);
        res.status(500).json({ error: 'Erro interno no servidor' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("[Servidor] Erro ao fechar conexão:", err);
            }
        }
    }
});

// A nova rota que o Módulo 2 vai chamar
/*
 * =======================================================
 * ENDPOINT ATUALIZADO: MÓDULO 2 (GERADOR DE CARTAZES v2)
 * (Este código envia um ARRAY, que é o que o frontend espera)
 * =======================================================
 */
app.post('/api/cartaz', async (req, res) => {

    // 1. Recebe TODOS os parâmetros
    const {
        filial,
        dtValidade,
        dtOferta,
        descEditada,
        tipoEmbalagem,
        tipoOferta,
        searchBy, // 'codprod' ou 'codauxiliar'
        searchValue, // Um código único (string)
        searchValues // Múltiplos códigos (array)
    } = req.body;

    // Validação inicial
    if (!filial || (!searchValue && !searchValues) || !searchBy) {
        return res.status(400).json({ error: 'Filial ou critério de pesquisa não fornecido' });
    }

    // Define se a pesquisa é múltipla (em lote) ou única
    const isBatchSearch = Array.isArray(searchValues) && searchValues.length > 0;
    const isSingleSearch = typeof searchValue === 'string' && searchValue.trim() !== '';

    let connection;
    try {
        // 2. Conecta ao banco
        connection = await oracledb.getConnection(dbConfig);
        console.log(`[Servidor] Módulo 2: Conectado. Processando pedido de cartaz.`);

        // 3. Monta os parâmetros de BIND
        const bindParams = {
            CODFILIAL: filial,
            DTVALIDADEPRODUTO: dtValidade ? new Date(dtValidade) : null,
            DTVIGENCIAOFERTA: dtOferta ? new Date(dtOferta) : null,
            DESCRICAOEDIT: descEditada || null,
            tipoembalagem: tipoEmbalagem,
            oferta: tipoOferta,
        };

        // 4. Esta é a sua query SQL (REL8042.SQL)
        let query = `
            SELECT DISTINCT
                tblpreco.codprod,
                
                CASE 
                    WHEN (SELECT DISTINCT PCMOV.CODAUXILIAR
                            FROM PCMOV 
                            WHERE DTMOV >=TRUNC(SYSDATE)
                            AND PCMOV.CODPROD=tblpreco.codprod
                            AND PCMOV.NUMTRANSVENDA = (SELECT MAX(NUMTRANSVENDA) 
                                                        FROM PCMOV 
                                                        WHERE CODPROD=tblpreco.codprod 
                                                        AND PCMOV.CODFILIAL=:CODFILIAL
                                                        AND PCMOV.DTMOV=(SELECT PCEST.DTULTSAIDA FROM PCEST WHERE CODPROD=tblpreco.codprod AND CODFILIAL=:CODFILIAL))) IS NULL
                    
                    THEN (select pcembalagem.CODAUXILIAR from pcembalagem
                                where pcembalagem.CODPROD=tblpreco.codprod
                                and pcembalagem.QTUNIT=tblpreco.qtunit
                                and pcembalagem.CODFILIAL=:CODFILIAL
                                and pcembalagem.DTINATIVO is null
                                and ROWNUM = 1)
                    
                    ELSE (SELECT DISTINCT PCMOV.CODAUXILIAR
                            FROM PCMOV 
                            WHERE DTMOV >=TRUNC(SYSDATE)
                            AND PCMOV.CODPROD=tblpreco.codprod
                            AND PCMOV.NUMTRANSVENDA = (SELECT MAX(NUMTRANSVENDA) 
                                                        FROM PCMOV 
                                                        WHERE CODPROD=tblpreco.codprod
                                                        AND PCMOV.CODAUXILIAR<>tblpreco.codprod 
                                                        AND PCMOV.CODFILIAL=:CODFILIAL 
                                                        AND PCMOV.DTMOV=(SELECT PCEST.DTULTSAIDA FROM PCEST WHERE CODPROD=tblpreco.codprod AND CODFILIAL=:CODFILIAL)))
                END codauxiliar,
                
                CASE WHEN tipoembalagem = 'VENDA' THEN nvl(coluna_preco(tblpreco.preco,'PVENDA'),0) ELSE tblprecocx.precocx END PRECO,
                
                CASE 
                WHEN tblpreco.embalagem = 'BARRA' AND tipoembalagem = 'VENDA' THEN 'PRECO DO KG/BARRA INTEIRA'
                WHEN tipoembalagem = 'MASTER' THEN tblprecocx.embalagem
                WHEN tipoembalagem = 'VENDA' THEN tblpreco.embalagem 
                END EMBA,
                
                CASE 
                    WHEN tblpreco.descricaoecf IS NULL
                    THEN pcprodut.descricao
                    ELSE tblpreco.descricaoecf
                END DESCRICAO,   
                
                nvl(coluna_preco(tblpreco.preco,'PVENDA'),0) pvenda,                             
                nvl(coluna_preco(tblpreco.preco,'PVENDAATAC'),0) pvendaatac,
                
                (tblprecocx.precocx/tblprecocx.qtunit)p,
                
                CASE 
                    WHEN (tblpreco.qtminimaatacado <= 2) or (tblpreco.qtminimaatacado is null)  THEN NULL
                    ELSE ('A PARTIR DE '||tblpreco.qtminimaatacado||'') 
                END QTMINIATAC,
                
                tblpreco.qtminimaatacado,
                tblpreco.qtunit,
                tblpreco.embalagem,
                
                tblprecocx.precocx,
                
                case when tblprecocx.embalagem is null
                then null
                else ''||tblprecocx.embalagem||':' 
                end embalagemcx,
                
                tblprecocx.qtunit as qtunitcx,
                
                pcprodut.dirfotoprod,
                
                DESCRICAOEDIT,
                
                (case when :DTVALIDADEPRODUTO < TRUNC(SYSDATE)
                    then null
                    else vlp
                end) as VALPRODUTO,
                
                (case when :DTVALIDADEPRODUTO < TRUNC(SYSDATE)
                    then null
                    else VALIDADEPRODUTO
                end) as DTVALPRODUTO,
                
                (case when :DTVIGENCIAOFERTA < TRUNC(SYSDATE)
                    then null
                    else VIGENCIAOFERTA
                end) as FIMOFERTA,
                
                (case when :DTVIGENCIAOFERTA < TRUNC(SYSDATE)
                    then null
                    else vlo
                end) as OFERTA,
                
                tipooferta,
                CASE WHEN tipooferta='N' THEN NULL ELSE 'R:\\800\\RELFUNDO\\MeiaA4Promo.PNG' END DIRRELFUNDO     
                
            FROM
                (select e.codauxiliar, e.qtunit, e.embalagem, e.qtminimaatacado, e.descricaoecf, e.codprod, buscaprecos(e.codfilial, '1', e.codauxiliar, trunc(sysdate)) preco 
                    from pcembalagem e 
                    where e.codfilial=:CODFILIAL
                    AND e.embalagem NOT like ('%VISTA%')  
                    and e.permiteimpressaoetiqueta='S'
                    and e.qtunit=(select min (qtunit) from pcembalagem where codfilial=e.codfilial and codprod=e.codprod and permiteimpressaoetiqueta='S')  
                    and e.dtinativo is null) tblpreco
                
                ,( SELECT nvl(coluna_preco(tblprecocx.preco,'PVENDA'),0) precocx, tblprecocx.embalagem, tblprecocx.qtunit, tblprecocx.codprod, tblprecocx.codfilial
                FROM (select e.codauxiliar, e.embalagem, e.qtunit, e.codprod, e.codfilial, buscaprecos(e.codfilial, '1', e.codauxiliar, trunc(sysdate)) preco 
                        from pcembalagem e 
                        where e.codfilial=:CODFILIAL 
                        AND e.embalagem NOT like ('%VISTA%')
                        AND e.permiteimpressaoetiqueta <> 'N' 
                        and e.dtinativo is null) tblprecocx
                WHERE tblprecocx.qtunit=(select max (qtunit) from pcembalagem where codfilial=tblprecocx.codfilial AND permiteimpressaoetiqueta <> 'N' and dtinativo is null and codprod=tblprecocx.codprod)
                AND tblprecocx.codfilial=:CODFILIAL  
                )tblprecocx
                
                ,pcprodut
                
                ,(SELECT (TO_CHAR(:DTVALIDADEPRODUTO, 'DD"/"MM"/"YYYY','NLS_DATE_LANGUAGE=PORTUGUESE')) VALIDADEPRODUTO
            , (TO_CHAR(:DTVIGENCIAOFERTA, 'DD"/"MM"/"YYYY','NLS_DATE_LANGUAGE=PORTUGUESE')) VIGENCIAOFERTA
            , 'Validade do Produto:' vlp
            , '*Oferta Válida até:'  vlo
            , (:DESCRICAOEDIT) DESCRICAOEDIT
            , (:tipoembalagem) tipoembalagem
            , (:oferta) tipooferta
            
                FROM DUAL)
                
            WHERE 1=1 
            AND tblprecocx.codprod(+)=tblpreco.codprod
            AND pcprodut.codprod=tblpreco.codprod
            AND pcprodut.dtexclusao is null
        `; // Fim da string da query

        // 5. Lógica de Pesquisa Dinâmica (Ponto 4)
        if (isSingleSearch) {
            bindParams.searchValue = searchValue;
            if (searchBy === 'codprod') {
                query += ` AND tblpreco.codprod = :searchValue`;
            } else if (searchBy === 'codauxiliar') {
                query += ` AND tblpreco.codprod in (select codprod from pcembalagem where codauxiliar = :searchValue)`;
            }
        } else if (isBatchSearch) {
            const inBinds = [];
            searchValues.forEach((cod, index) => {
                const bindName = `id${index}`;
                bindParams[bindName] = cod.trim();
                inBinds.push(`:${bindName}`);
            });

            if (searchBy === 'codprod') {
                query += ` AND tblpreco.codprod IN (${inBinds.join(',')})`;
            } else if (searchBy === 'codauxiliar') {
                query += ` AND tblpreco.codprod in (select codprod from pcembalagem where codauxiliar IN (${inBinds.join(',')}))`;
            }
        } else {
            return res.status(400).json({ error: 'Tipo de pesquisa inválido' });
        }
        
        query += ` ORDER BY descricao ASC`;

        // 6. Executa a query
        const result = await connection.execute(
            query,
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 7. Devolve o resultado (SEMPRE como um array)
        if (result.rows.length === 0) {
            console.log(`[Servidor] Módulo 2: Nenhum produto encontrado.`);
            return res.status(404).json({ error: 'Nenhum produto encontrado com esses critérios.' });
        }
        
        console.log(`[Servidor] Módulo 2: ${result.rows.length} produtos encontrados.`);
        
        // A MUDANÇA CRUCIAL: Envia a lista de resultados (array)
        res.json(result.rows); 

    } catch (err) {
        console.error("[Servidor] Módulo 2: Erro ao buscar cartaz:", err);
        res.status(500).json({ error: 'Erro interno no servidor' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("[Servidor] Erro ao fechar conexão:", err);
            }
        }
    }
});

/* --- 4. INICIA O SERVIDOR --- */
app.listen(port, () => {
    console.log(`=================================================`);
    console.log(`  Servidor de etiquetas rodando! 🚀`);
    console.log(`  Acesse em http://localhost:${port}`);
    console.log(`=================================================`);
});
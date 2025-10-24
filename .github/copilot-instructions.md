# Instruções para Agentes de IA - Gerador Web Comercial Norte

Este documento fornece orientações essenciais para trabalhar com o projeto Gerador Web Comercial Norte.

## Arquitetura do Projeto

O projeto é dividido em dois componentes principais:

### 1. Servidor API (`/servidor-api`)
- Backend Node.js/Express que se conecta ao Oracle Database
- Principais endpoints:
  - `/api/etiquetas` (POST): Gera etiquetas de produtos
  - `/api/cartaz` (POST): Gera cartazes de preços
- Conexão Oracle configurada em `dbConfig` em `server.js`

### 2. Frontend (`/gerador-web`)
- Interface web estática (HTML/CSS/JS)
- Servida diretamente pelo backend Express
- Módulos principais:
  - `modulo_etiqueta_produto`: Gerador de etiquetas
  - `modulo_cartaz`: Gerador de cartazes

## Dependências Críticas

1. **Oracle Client**
- Requer Oracle Instant Client 11g (64-bits)
- Caminho padrão: `C:\instantclient_11_2`
- Configurado no modo "Thick" para compatibilidade

2. **Recursos de Rede**
- Imagens servidas de `R:\FOTOS PRODUTOS`
- Banco Oracle em `192.168.0.199:1521/WINT`

## Fluxos de Dados Importantes

1. **Fluxo de Etiquetas**:
- Frontend envia: `{ filial, codigos[] }`
- API consulta Oracle usando `CODAUXILIAR`
- Retorna detalhes do produto: código, descrição, embalagem, etc.

2. **Fluxo de Cartazes**:
- Frontend envia: `{ filial, dtValidade, dtOferta, descEditada, tipoEmbalagem, tipoOferta, searchBy, searchValue/searchValues }`
- API executa query complexa (REL8042.SQL) 
- Retorna dados formatados para impressão

## Convenções do Projeto

1. **Consultas Oracle**
- Usar bind params para segurança (`bindParams` em todas queries)
- Tratar casos de CODAUXILIAR nulo
- Respeitar restrições de embalagem (`NOT LIKE '%VIST%'`)

2. **Manipulação de Erros**
- Validação dos parâmetros de entrada
- Log detalhado com prefixo "[Servidor]"
- Fechamento explícito de conexões Oracle

## Comandos Essenciais

```bash
# Iniciar servidor API
cd servidor-api
npm start

# Frontend disponível em
http://localhost:3000
```

## Arquivos de Referência

- `server.js`: Configurações principais e endpoints
- `modulo_cartaz.js`: Lógica do gerador de cartazes
- `modulo_etiqueta_produto.js`: Lógica do gerador de etiquetas

## Notas de Segurança

1. Sempre use bind parameters em queries Oracle
2. Valide todos os inputs do frontend
3. Mantenha as credenciais do banco seguras
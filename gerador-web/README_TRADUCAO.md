# Sistema de Tradução - Gerador Web

## 🌐 Idiomas Suportados

- **Português (pt)** - Idioma padrão
- **English (en)** - Inglês
- **Español (es)** - Espanhol

## 📁 Arquivos do Sistema de Tradução

### `idiomas.js`
Arquivo principal que contém:
- Todas as traduções em 3 idiomas
- Funções para aplicar traduções
- Sistema de persistência do idioma selecionado

### Arquivos Modificados
- `index.html` - Menu principal com seletor de idioma
- `modulo_etiqueta_produto.html` - Módulo de etiquetas traduzido
- `modulo_cartaz.html` - Módulo de cartazes traduzido
- `modulo_etiqueta_produto.js` - Mensagens de erro traduzidas
- `modulo_cartaz.js` - Mensagens de erro traduzidas
- `style_menu.css` - Estilos para seletor de idioma
- `modulo_etiqueta_produto.css` - Estilos para seletor de idioma
- `modulo_cartaz.css` - Estilos para seletor de idioma

## 🔧 Como Funciona

### 1. Atributos `data-t`
Todos os elementos traduzíveis possuem o atributo `data-t` com a chave da tradução:

```html
<h1 data-t="portal_titulo">Portal de Ferramentas</h1>
<button data-t="gerar_etiquetas">Gerar Etiquetas</button>
```

### 2. Função `t(chave, idioma)`
Retorna a tradução para uma chave específica:

```javascript
t('portal_titulo', 'en') // Retorna "Tools Portal"
t('gerar_etiquetas', 'es') // Retorna "Generar Etiquetas"
```

### 3. Função `aplicarTraducoes(idioma)`
Aplica todas as traduções na página atual:

```javascript
aplicarTraducoes('en') // Traduz toda a página para inglês
```

### 4. Função `mudarIdioma(novoIdioma)`
Muda o idioma e salva a preferência:

```javascript
mudarIdioma('es') // Muda para espanhol e salva no localStorage
```

### 5. Função `carregarIdioma()`
Carrega o idioma salvo ou usa o padrão:

```javascript
const idiomaAtual = carregarIdioma() // Retorna 'pt', 'en' ou 'es'
```

## 🎨 Seletor de Idiomas

Cada página possui um seletor de idiomas no canto superior direito:

```html
<div class="seletor-idioma">
    <label for="idioma-select">🌐</label>
    <select id="idioma-select" onchange="mudarIdioma(this.value)">
        <option value="pt">Português</option>
        <option value="en">English</option>
        <option value="es">Español</option>
    </select>
</div>
```

## 📝 Adicionando Novas Traduções

### 1. Adicionar chave no arquivo `idiomas.js`:

```javascript
const idiomas = {
    'pt': {
        'nova_chave': 'Texto em Português',
        // ... outras traduções
    },
    'en': {
        'nova_chave': 'Text in English',
        // ... outras traduções
    },
    'es': {
        'nova_chave': 'Texto en Español',
        // ... outras traduções
    }
};
```

### 2. Usar no HTML:

```html
<span data-t="nova_chave">Texto padrão</span>
```

### 3. Usar no JavaScript:

```javascript
alert(t('nova_chave'));
```

## 🔄 Persistência

O idioma selecionado é salvo no `localStorage` e carregado automaticamente na próxima visita.

## 🚀 Como Usar

1. Abra qualquer página do sistema
2. Clique no seletor de idiomas (🌐) no canto superior direito
3. Escolha o idioma desejado
4. A página será traduzida instantaneamente
5. Sua preferência será salva automaticamente

## 🎯 Funcionalidades

- ✅ Tradução completa da interface
- ✅ Mensagens de erro traduzidas
- ✅ Persistência da preferência de idioma
- ✅ Seletor visual intuitivo
- ✅ Aplicação automática das traduções
- ✅ Suporte a 3 idiomas (PT, EN, ES)
- ✅ Fácil adição de novos idiomas
- ✅ Sistema modular e extensível

## 🔧 Manutenção

Para adicionar um novo idioma:

1. Adicione o novo idioma no objeto `idiomas` em `idiomas.js`
2. Adicione a opção no seletor de todos os HTMLs
3. Teste todas as funcionalidades no novo idioma

Para modificar traduções existentes, edite diretamente o arquivo `idiomas.js`.

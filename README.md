# Incident Atlas

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![DuckDB](https://img.shields.io/badge/DuckDB-Latest-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-red.svg)

Sistema de análise e visualização de acidentes industriais: desenvolvido para auxiliar na gestão de segurança do trabalho em ambientes industriais, com foco em mineração e metalurgia.

## Sobre o Projeto

O **Incident Atlas** é uma aplicação web desenvolvida em Flask que permite:

- **Visualização interativa** de dados históricos de acidentes industriais (2016-2017)
- **Filtros avançados** por gênero, país, período e outros
- **Mapa de calor corporal** mostrando as partes do corpo mais afetadas
- **Gráficos dinâmicos** mensais, setores e localizações
- **Sistema de ações prioritárias** baseadas em análise de dados históricos

### Funcionalidades Principais

#### Página Inicial (Home)

- Card com total de acidentes registrados
- Estatísticas por país (Brasil, EUA, Canadá)
- Distribuição por gênero com percentuais
- Período de análise dos dados
- Recorde de dias sem acidentes graves
- Mapa de calor do corpo humano com filtro por gênero
- Gráficos de tendência mensal e localização
- Lista de próximas ações a fazer

#### Dashboard

- Filtros interativos (gênero, países, período)
- Cartões de estatísticas em tempo real
- Gráfico de acidentes por mês
- Gráfico de potencial de acidentes por setor
- Gráfico de acidentes por localização
- Mapa de calor do corpo com dados filtrados
- Lista constando todos os incidentes, podendo filtrar por um campo de pesquisa

## Como Rodar o Projeto

### Pré-requisitos

- **Python 3** instalado
- **Git** (para clonar o repositório)

### 1. Clonar o Repositório

```bash
git clone https://github.com/EduFrancaDev/Incident-Atlas.git
```

### 2. Criar Ambiente Virtual

#### No Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### No Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Instalar Dependências

```bash
pip install -r requirements.txt
```

As dependências incluem:

- **Flask**: Framework web
- **DuckDB**: Banco de dados
- **Pandas**: Manipulação de dados

### 4. Inicializar o Banco de Dados

O banco de dados será criado automaticamente na primeira execução. Se você quiser forçar a recriação:

```bash
python scripts/subir_csv_para_db.py
```

### 5. Executar a Aplicação

```bash
python app.py
```

### 6. Parar o Servidor

Pressione `Ctrl + C` no terminal onde o servidor está rodando.

## 🔧 Configuração no VS Code

O projeto inclui configurações prontas para VS Code:

## Estrutura de Dados

### Tabela: `acidentes`

| Coluna                     | Tipo         | Descrição                     |
| -------------------------- | ------------ | ----------------------------- |
| `id`                       | INTEGER      | Identificador único           |
| `Data`                     | TIMESTAMP    | Data do acidente              |
| `Pais`                     | VARCHAR(100) | País onde ocorreu             |
| `Estado`                   | VARCHAR(200) | Estado/Província              |
| `Setor_Industrial`         | VARCHAR(100) | Setor (Mineração, Metalurgia) |
| `Nivel_Acidente`           | VARCHAR(50)  | Nível real do acidente        |
| `Nivel_Acidente_Potencial` | VARCHAR(50)  | Potencial de gravidade        |
| `Genero`                   | VARCHAR(20)  | Gênero do trabalhador         |
| `Tipo_Trabalhador`         | VARCHAR(50)  | Tipo de contratação           |
| `Risco_Critico`            | VARCHAR(200) | Risco crítico associado       |
| `Descricao`                | TEXT         | Descrição detalhada           |
| `Parte_Corpo`              | VARCHAR(50)  | Parte do corpo afetada        |

## API Endpoints

### Estatísticas Gerais

- `GET /api/statistics` - Estatísticas agregadas globais
- `GET /api/dashboard/stats?gender=Homem&country=Brasil` - Stats com filtros

### Gráficos

- `GET /api/charts/monthly?range=6` - Dados mensais (últimos 6 meses)
- `GET /api/charts/sectors` - Distribuição por setores
- `GET /api/charts/locations?filterCountry=Brasil` - Top localizações

### Acidentes

- `GET /api/accidents` - Lista todos os acidentes
- `GET /api/accidents/filtered?page=1&perPage=10&search=mão` - Acidentes filtrados e paginados

### Mapa de Calor

- `GET /api/heatmap/bodyparts?gender=Mulher` - Partes do corpo afetadas

### Segurança

- `GET /api/safety-record` - Recorde de dias sem acidentes graves

### Ações Prioritárias

- `GET /api/next-actions` - Próximas ações baseadas em análise de dados

## Tecnologias Utilizadas

### Backend

- **Python 3**
- **Flask**
- **DuckDB**
- **Pandas**

### Frontend

- **HTML5 / CSS3**
- **JavaScript**
- **Chart.js**
- **Fetch API**

## Scripts Disponíveis

### Importação e ETL

```bash
# Importar CSV para o banco de dados
python scripts/subir_csv_para_db.py

# Adicionar campo "Parte do Corpo" baseado em análise de descrições
python scripts/adicionar_parte_corpo.py

# Remover registros duplicados
python scripts/remover_duplicatas.py
```

### Tradução (Já Executados)

```bash
# Traduzir cabeçalhos do CSV
python scripts/traducoes/traduzir_cabecalhos.py

# Traduzir descrições dos acidentes
python scripts/traducoes/traduzir_descricoes.py
```

## Autor

**Eduardo França**

- GitHub: [@EduFrancaDev](https://github.com/EduFrancaDev)
- LinkedIn: (https://www.linkedin.com/in/eduardo8franca/)

---

Projeto foi desenvolvido para fins educacionais e de demonstração. Os dados são fictícios e/ou anonimizados para proteger a privacidade.

**Dê uma estrela!!**

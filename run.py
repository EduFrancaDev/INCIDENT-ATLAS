from flask import Flask, render_template, jsonify, g, request
import duckdb
from scripts.subir_csv_para_db import subir_csv_para_db
import json
from datetime import date, datetime

app = Flask(__name__, template_folder='template', static_folder='static')

app.config['DATABASE'] = 'acidentes.duckdb'

def get_db():
    """Obtém a conexão com o banco de dados"""
    if 'db' not in g:
        g.db = duckdb.connect(app.config['DATABASE'])
    return g.db

def init_db():
    """Inicializa o banco de dados"""
    db = duckdb.connect(app.config['DATABASE'])
    db.execute("""
    CREATE TABLE IF NOT EXISTS acidentes (
        id INTEGER PRIMARY KEY,
        Data TIMESTAMP,
        Pais VARCHAR(100),
        Estado VARCHAR(200),
        Setor_Industrial VARCHAR(100),
        Nivel_Acidente VARCHAR(50),
        Nivel_Acidente_Potencial VARCHAR(50),
        Genero VARCHAR(20),
        Tipo_Trabalhador VARCHAR(50),
        Risco_Critico VARCHAR(200),
        Descricao TEXT,
        Parte_Corpo VARCHAR(50)
    )
    """)
    result = db.execute("SELECT COUNT(*) FROM acidentes").fetchall()
    if result[0][0] == 0:
        subir_csv_para_db(db)
    db.close()

@app.teardown_appcontext
def close_db(error):
    """Fechar a conexão com o banco de dados quando terminar a requisição"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/accidents')
def get_accidents():
    """Endpoint API para retornar dados de acidentes em JSON"""
    db = get_db()
    
    # Buscar todos os acidentes
    result = db.execute("""
        SELECT 
            id,
            Data as date,
            Pais as country,
            Estado as local,
            Setor_Industrial as sector,
            Nivel_Acidente as accidentLevel,
            Nivel_Acidente_Potencial as potentialLevel,
            Genero as gender,
            Tipo_Trabalhador as employeeType,
            Risco_Critico as criticalRisk,
            Descricao as description,
            Parte_Corpo as bodyPart
        FROM acidentes
        ORDER BY Data DESC
    """).fetchall()
    
    # Converter para lista de dicionários
    columns = ['id', 'date', 'country', 'local', 'sector', 'accidentLevel', 
               'potentialLevel', 'gender', 'employeeType', 'criticalRisk', 'description', 'bodyPart']
    
    accidents = []
    for row in result:
        accident = {}
        for i, col in enumerate(columns):
            value = row[i]
            # Converter date para string
            if col == 'date' and value:
                accident[col] = value.isoformat() if hasattr(value, 'isoformat') else str(value)
            else:
                accident[col] = value
        accidents.append(accident)
    
    return jsonify(accidents)

def extract_body_part(description):
    """Extrai a parte do corpo afetada baseada na descrição"""
    description_lower = description.lower() if description else ''
    
    # Palavras-chave para cada parte do corpo
    body_parts_keywords = {
        'hands': ['mão', 'mãos', 'dedo', 'dedos', 'hand', 'finger', 'fingers', 'pulso'],
        'feet': ['pé', 'pés', 'foot', 'feet', 'tornozelo', 'ankle', 'calcanhar'],
        'left-leg': ['perna esquerda', 'left leg', 'coxa esquerda'],
        'right-leg': ['perna direita', 'right leg', 'coxa direita', 'perna'],
        'face': ['rosto', 'face', 'olho', 'olhos', 'eye', 'eyes', 'nariz', 'boca', 'testa', 'bochecha'],
        'neck': ['pescoço', 'neck', 'garganta', 'throat'],
        'left-arm': ['braço esquerdo', 'left arm'],
        'right-arm': ['braço direito', 'right arm', 'braço'],
        'trunk': ['tronco', 'trunk', 'peito', 'chest', 'abdomen', 'costas', 'back', 'quadril', 'hip']
    }
    
    # Verificar qual parte do corpo foi mencionada
    for part, keywords in body_parts_keywords.items():
        for keyword in keywords:
            if keyword in description_lower:
                return part
    
    # Valor padrão se não encontrar nenhuma correspondência
    return 'trunk'

@app.route('/api/statistics')
def get_statistics():
    """Endpoint API para retornar estatísticas agregadas"""
    db = get_db()
    
    # Estatísticas por gênero
    gender_stats = db.execute("""
        SELECT Genero, COUNT(*) as count
        FROM acidentes
        GROUP BY Genero
    """).fetchall()
    
    # Estatísticas por país
    country_stats = db.execute("""
        SELECT Pais, COUNT(*) as count
        FROM acidentes
        GROUP BY Pais
        ORDER BY count DESC
    """).fetchall()
    
    # Estatísticas por setor
    sector_stats = db.execute("""
        SELECT Setor_Industrial, COUNT(*) as count
        FROM acidentes
        GROUP BY Setor_Industrial
    """).fetchall()
    
    # Estatísticas por mês
    month_stats = db.execute("""
        SELECT 
            strftime(Data, '%Y-%m') as month,
            COUNT(*) as count
        FROM acidentes
        GROUP BY month
        ORDER BY month
    """).fetchall()
    
    # Estatísticas por local
    location_stats = db.execute("""
        SELECT Estado, Pais, COUNT(*) as count
        FROM acidentes
        GROUP BY Estado, Pais
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()
    
    # Estatísticas por parte do corpo
    bodypart_stats = db.execute("""
        SELECT Parte_Corpo, COUNT(*) as count
        FROM acidentes
        GROUP BY Parte_Corpo
        ORDER BY count DESC
    """).fetchall()
    
    return jsonify({
        'gender': [{'gender': row[0], 'count': row[1]} for row in gender_stats],
        'countries': [{'country': row[0], 'count': row[1]} for row in country_stats],
        'sectors': [{'sector': row[0], 'count': row[1]} for row in sector_stats],
        'months': [{'month': row[0], 'count': row[1]} for row in month_stats],
        'locations': [{'local': row[0], 'country': row[1], 'count': row[2]} for row in location_stats],
        'bodyParts': [{'bodyPart': row[0], 'count': row[1]} for row in bodypart_stats]
    })

@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    """Endpoint API para retornar estatísticas do dashboard com filtros"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')  # ['Homem', 'Mulher']
    countries = request.args.getlist('country')  # ['Brasil', 'EUA']
    start_date = request.args.get('startDate')  # '2016-01-01'
    end_date = request.args.get('endDate')  # '2017-12-31'
    
    # Construir cláusula WHERE dinâmica
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Estatísticas de gênero
    query = f"""
        SELECT Genero, COUNT(*) as count
        FROM acidentes
        WHERE {where_clause}
        GROUP BY Genero
    """
    gender_stats = db.execute(query, list(params.values())).fetchall()
    
    # Total de acidentes
    query = f"""
        SELECT COUNT(*) as total
        FROM acidentes
        WHERE {where_clause}
    """
    total_result = db.execute(query, list(params.values())).fetchone()
    total = total_result[0] if total_result else 0
    
    # Calcular porcentagens
    women_count = next((row[1] for row in gender_stats if row[0] == 'Mulher'), 0)
    men_count = next((row[1] for row in gender_stats if row[0] == 'Homem'), 0)
    
    women_percent = round(women_count / total * 100, 1) if total > 0 else 0
    men_percent = round(men_count / total * 100, 1) if total > 0 else 0
    
    # Calcular dias do período
    query = f"""
        SELECT 
            MIN(Data) as min_date,
            MAX(Data) as max_date
        FROM acidentes
        WHERE {where_clause}
    """
    date_range = db.execute(query, list(params.values())).fetchone()
    
    return jsonify({
        'total': total,
        'women': {
            'count': women_count,
            'percent': women_percent
        },
        'men': {
            'count': men_count,
            'percent': men_percent
        },
        'countriesCount': len(countries) if countries else 0,
        'dateRange': {
            'start': date_range[0].isoformat() if date_range and date_range[0] else None,
            'end': date_range[1].isoformat() if date_range and date_range[1] else None
        }
    })

@app.route('/api/charts/monthly')
def get_monthly_chart_data():
    """Endpoint API para retornar dados do gráfico mensal com filtros"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')
    countries = request.args.getlist('country')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    range_months = request.args.get('range', 'all')  # 'all', '6', '3', '1'
    
    # Construir cláusula WHERE
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Query para dados mensais
    query = f"""
        SELECT 
            strftime(Data, '%Y-%m') as month,
            COUNT(*) as count
        FROM acidentes
        WHERE {where_clause}
        GROUP BY month
        ORDER BY month
    """
    
    if range_months != 'all':
        months_limit = int(range_months)
        query += f" LIMIT {months_limit}"
    
    monthly_data = db.execute(query, list(params.values())).fetchall()
    
    # Formatar labels (Jan, Fev, Mar...)
    month_names = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
        '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
        '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    }
    
    labels = []
    data = []
    for row in monthly_data:
        month_str = row[0]  # '2016-01'
        month_num = month_str.split('-')[1]
        labels.append(month_names.get(month_num, month_num))
        data.append(row[1])
    
    return jsonify({
        'labels': labels,
        'data': data
    })

@app.route('/api/charts/sectors')
def get_sectors_chart_data():
    """Endpoint API para retornar dados do gráfico de setores com filtros"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')
    countries = request.args.getlist('country')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    # Construir cláusula WHERE
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Query para dados de setores
    query = f"""
        SELECT Setor_Industrial, COUNT(*) as count
        FROM acidentes
        WHERE {where_clause}
        GROUP BY Setor_Industrial
        ORDER BY count DESC
    """
    
    sector_data = db.execute(query, list(params.values())).fetchall()
    
    # Organizar dados nos 3 setores esperados
    sectors = {
        'Mineração': 0,
        'Metalurgia': 0,
        'Outros': 0
    }
    
    for row in sector_data:
        sector_name = row[0]
        count = row[1]
        if sector_name in sectors:
            sectors[sector_name] = count
        else:
            sectors['Outros'] += count
    
    return jsonify({
        'labels': list(sectors.keys()),
        'data': list(sectors.values())
    })

@app.route('/api/charts/locations')
def get_locations_chart_data():
    """Endpoint API para retornar dados do gráfico de localização com filtros"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')
    countries = request.args.getlist('country')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    filter_country = request.args.get('filterCountry', 'all')  # Filtro adicional do dropdown
    
    # Construir cláusula WHERE
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if filter_country != 'all':
        idx = len(params) + 1
        where_clauses.append(f"Pais = ${idx}")
        params[f'${idx}'] = filter_country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Query para dados de localização
    query = f"""
        SELECT Estado, COUNT(*) as count
        FROM acidentes
        WHERE {where_clause}
        GROUP BY Estado
        ORDER BY count DESC
        LIMIT 6
    """
    
    location_data = db.execute(query, list(params.values())).fetchall()
    
    labels = [row[0] for row in location_data]
    data = [row[1] for row in location_data]
    
    return jsonify({
        'labels': labels,
        'data': data
    })

@app.route('/api/heatmap/bodyparts')
def get_bodyparts_heatmap_data():
    """Endpoint API para retornar dados do mapa de calor com filtros"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')
    countries = request.args.getlist('country')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    # Construir cláusula WHERE
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Query para partes do corpo
    query = f"""
        SELECT Parte_Corpo, COUNT(*) as count
        FROM acidentes
        WHERE {where_clause} AND Parte_Corpo != 'Não especificado'
        GROUP BY Parte_Corpo
        ORDER BY count DESC
    """
    
    bodypart_data = db.execute(query, list(params.values())).fetchall()
    
    # Retornar dados brutos (JS fará o mapeamento para o SVG)
    return jsonify({
        'bodyParts': [{'part': row[0], 'count': row[1]} for row in bodypart_data]
    })

@app.route('/api/accidents/filtered')
def get_filtered_accidents():
    """Endpoint API para retornar acidentes filtrados com paginação"""
    db = get_db()
    
    # Obter parâmetros de filtro
    genders = request.args.getlist('gender')
    countries = request.args.getlist('country')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    search_query = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('perPage', 10))
    
    # Construir cláusula WHERE
    where_clauses = []
    params = {}
    
    if genders:
        placeholders = ', '.join([f'${i+1}' for i in range(len(genders))])
        where_clauses.append(f"Genero IN ({placeholders})")
        for i, gender in enumerate(genders):
            params[f'${i+1}'] = gender
    
    if countries:
        start_idx = len(params)
        placeholders = ', '.join([f'${i+start_idx+1}' for i in range(len(countries))])
        where_clauses.append(f"Pais IN ({placeholders})")
        for i, country in enumerate(countries):
            params[f'${i+start_idx+1}'] = country
    
    if start_date:
        idx = len(params) + 1
        where_clauses.append(f"Data >= ${idx}")
        params[f'${idx}'] = start_date
    
    if end_date:
        idx = len(params) + 1
        where_clauses.append(f"Data <= ${idx}")
        params[f'${idx}'] = end_date
    
    # Adicionar busca textual
    if search_query:
        idx = len(params) + 1
        search_pattern = f'%{search_query}%'
        where_clauses.append(f"""
            (Pais ILIKE ${idx} OR 
             Estado ILIKE ${idx} OR 
             Descricao ILIKE ${idx} OR 
             Nivel_Acidente ILIKE ${idx} OR 
             Risco_Critico ILIKE ${idx} OR
             Setor_Industrial ILIKE ${idx})
        """)
        params[f'${idx}'] = search_pattern
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Calcular offset
    offset = (page - 1) * per_page
    
    # Query para acidentes filtrados
    query = f"""
        SELECT 
            id,
            Data as date,
            Pais as country,
            Estado as local,
            Setor_Industrial as sector,
            Nivel_Acidente as accidentLevel,
            Nivel_Acidente_Potencial as potentialLevel,
            Genero as gender,
            Tipo_Trabalhador as employeeType,
            Risco_Critico as criticalRisk,
            Descricao as description,
            Parte_Corpo as bodyPart
        FROM acidentes
        WHERE {where_clause}
        ORDER BY Data DESC
        LIMIT {per_page} OFFSET {offset}
    """
    
    result = db.execute(query, list(params.values())).fetchall()
    
    # Converter para lista de dicionários
    columns = ['id', 'date', 'country', 'local', 'sector', 'accidentLevel', 
               'potentialLevel', 'gender', 'employeeType', 'criticalRisk', 'description', 'bodyPart']
    
    accidents = []
    for row in result:
        accident = {}
        for i, col in enumerate(columns):
            value = row[i]
            if col == 'date' and value:
                accident[col] = value.isoformat() if hasattr(value, 'isoformat') else str(value)
            else:
                accident[col] = value
        accidents.append(accident)
    
    return jsonify(accidents)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
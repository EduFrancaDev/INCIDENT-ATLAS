from flask import Flask, render_template, jsonify, g
import duckdb
from scripts.subir_csv_para_db import subir_csv_para_db
import json
from datetime import date

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
        Data DATE,
        Countries VARCHAR(100),
        Local VARCHAR(200),
        Industry_Sector VARCHAR(100),
        Accident_Level VARCHAR(50),
        Potential_Accident_Level VARCHAR(50),
        Genre VARCHAR(20),
        Employee_or_Third_Party VARCHAR(50),
        Critical_Risk VARCHAR(200),
        Description TEXT
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
            Countries as country,
            Local as local,
            Industry_Sector as sector,
            Accident_Level as accidentLevel,
            Potential_Accident_Level as potentialLevel,
            Genre as gender,
            Employee_or_Third_Party as employeeType,
            Critical_Risk as criticalRisk,
            Description as description
        FROM acidentes
        ORDER BY Data DESC
    """).fetchall()
    
    # Converter para lista de dicionários
    columns = ['id', 'date', 'country', 'local', 'sector', 'accidentLevel', 
               'potentialLevel', 'gender', 'employeeType', 'criticalRisk', 'description']
    
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
        
        # Mapear parte do corpo baseada na descrição
        accident['bodyPart'] = extract_body_part(accident.get('description', ''))
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
        SELECT Genre, COUNT(*) as count
        FROM acidentes
        GROUP BY Genre
    """).fetchall()
    
    # Estatísticas por país
    country_stats = db.execute("""
        SELECT Countries, COUNT(*) as count
        FROM acidentes
        GROUP BY Countries
        ORDER BY count DESC
    """).fetchall()
    
    # Estatísticas por setor
    sector_stats = db.execute("""
        SELECT Industry_Sector, COUNT(*) as count
        FROM acidentes
        GROUP BY Industry_Sector
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
        SELECT Local, Countries, COUNT(*) as count
        FROM acidentes
        GROUP BY Local, Countries
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()
    
    return jsonify({
        'gender': [{'gender': row[0], 'count': row[1]} for row in gender_stats],
        'countries': [{'country': row[0], 'count': row[1]} for row in country_stats],
        'sectors': [{'sector': row[0], 'count': row[1]} for row in sector_stats],
        'months': [{'month': row[0], 'count': row[1]} for row in month_stats],
        'locations': [{'local': row[0], 'country': row[1], 'count': row[2]} for row in location_stats]
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
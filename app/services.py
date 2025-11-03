"""
Serviços - Toda a lógica de negócio da aplicação
"""
from datetime import datetime, timedelta
from app.utils import ConstrutorConsulta, formatar_data, formatar_rotulo_mes


# ==================== SERVIÇO DE ACIDENTES ====================

class ServicoAcidentes:
    """Serviço para operações com acidentes"""
    
    def __init__(self, bd):
        self.bd = bd
    
    def obter_todos_acidentes(self):
        """Retorna todos os acidentes ordenados por data"""
        resultado = self.bd.execute("""
            SELECT 
                id, Data as date, Pais as country, Estado as local,
                Setor_Industrial as sector, Nivel_Acidente as accidentLevel,
                Nivel_Acidente_Potencial as potentialLevel, Genero as gender,
                Tipo_Trabalhador as employeeType, Risco_Critico as criticalRisk,
                Descricao as description, Parte_Corpo as bodyPart
            FROM acidentes
            ORDER BY Data DESC
        """).fetchall()
        
        return self._formatar_acidentes(resultado)
    
    def obter_acidentes_filtrados(self, pagina=1, por_pagina=10, consulta_busca=''):
        """Retorna acidentes filtrados com paginação"""
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data()
        
        if consulta_busca:
            colunas_busca = ['Pais', 'Estado', 'Descricao', 'Nivel_Acidente',
                            'Risco_Critico', 'Setor_Industrial']
            construtor_consulta.adicionar_filtro_busca(consulta_busca, colunas_busca)
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        deslocamento = (pagina - 1) * por_pagina
        
        consulta = f"""
            SELECT 
                id, Data as date, Pais as country, Estado as local,
                Setor_Industrial as sector, Nivel_Acidente as accidentLevel,
                Nivel_Acidente_Potencial as potentialLevel, Genero as gender,
                Tipo_Trabalhador as employeeType, Risco_Critico as criticalRisk,
                Descricao as description, Parte_Corpo as bodyPart
            FROM acidentes
            WHERE {clausula_where}
            ORDER BY Data DESC
            LIMIT {por_pagina} OFFSET {deslocamento}
        """
        
        resultado = self.bd.execute(consulta, parametros).fetchall()
        return self._formatar_acidentes(resultado)
    
    def _formatar_acidentes(self, resultado):
        """Formata resultado da query em lista de dicionários"""
        colunas = ['id', 'date', 'country', 'local', 'sector', 'accidentLevel', 
                   'potentialLevel', 'gender', 'employeeType', 'criticalRisk', 
                   'description', 'bodyPart']
        
        acidentes = []
        for linha in resultado:
            acidente = {}
            for i, col in enumerate(colunas):
                valor = linha[i]
                acidente[col] = formatar_data(valor) if col == 'date' else valor
            acidentes.append(acidente)
        
        return acidentes


# ==================== SERVIÇO DE ESTATÍSTICAS ====================

class ServicoEstatisticas:
    """Serviço para calcular estatísticas agregadas"""
    
    def __init__(self, bd):
        self.bd = bd
    
    def obter_todas_estatisticas(self):
        """Retorna todas as estatísticas agregadas"""
        return {
            'gender': self._obter_estatisticas_genero(),
            'countries': self._obter_estatisticas_pais(),
            'sectors': self._obter_estatisticas_setor(),
            'months': self._obter_estatisticas_mes(),
            'locations': self._obter_estatisticas_localizacao(),
            'bodyParts': self._obter_estatisticas_parte_corpo()
        }
    
    def _obter_estatisticas_genero(self):
        resultado = self.bd.execute("""
            SELECT Genero, COUNT(*) as count
            FROM acidentes GROUP BY Genero
        """).fetchall()
        return [{'gender': linha[0], 'count': linha[1]} for linha in resultado]
    
    def _obter_estatisticas_pais(self):
        resultado = self.bd.execute("""
            SELECT Pais, COUNT(*) as count
            FROM acidentes GROUP BY Pais ORDER BY count DESC
        """).fetchall()
        return [{'country': linha[0], 'count': linha[1]} for linha in resultado]
    
    def _obter_estatisticas_setor(self):
        resultado = self.bd.execute("""
            SELECT Setor_Industrial, COUNT(*) as count
            FROM acidentes GROUP BY Setor_Industrial
        """).fetchall()
        return [{'sector': linha[0], 'count': linha[1]} for linha in resultado]
    
    def _obter_estatisticas_mes(self):
        resultado = self.bd.execute("""
            SELECT strftime(Data, '%Y-%m') as month, COUNT(*) as count
            FROM acidentes GROUP BY month ORDER BY month
        """).fetchall()
        return [{'month': linha[0], 'count': linha[1]} for linha in resultado]
    
    def _obter_estatisticas_localizacao(self):
        resultado = self.bd.execute("""
            SELECT Estado, Pais, COUNT(*) as count
            FROM acidentes GROUP BY Estado, Pais ORDER BY count DESC LIMIT 10
        """).fetchall()
        return [{'local': linha[0], 'country': linha[1], 'count': linha[2]} for linha in resultado]
    
    def _obter_estatisticas_parte_corpo(self):
        resultado = self.bd.execute("""
            SELECT Parte_Corpo, COUNT(*) as count
            FROM acidentes GROUP BY Parte_Corpo ORDER BY count DESC
        """).fetchall()
        return [{'bodyPart': linha[0], 'count': linha[1]} for linha in resultado]


# ==================== SERVIÇO DE DASHBOARD ====================

class ServicoDashboard:
    """Serviço para estatísticas do dashboard com filtros"""
    
    def __init__(self, bd):
        self.bd = bd
    
    def obter_estatisticas_dashboard(self):
        """Retorna estatísticas do dashboard com filtros aplicados"""
        from flask import request
        
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data()
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        
        # Estatísticas de gênero
        estatisticas_genero = self.bd.execute(f"""
            SELECT Genero, COUNT(*) as count
            FROM acidentes WHERE {clausula_where}
            GROUP BY Genero
        """, parametros).fetchall()
        
        # Total
        total = self.bd.execute(f"""
            SELECT COUNT(*) as total
            FROM acidentes WHERE {clausula_where}
        """, parametros).fetchone()[0]
        
        # Calcular porcentagens
        contagem_mulheres = next((linha[1] for linha in estatisticas_genero if linha[0] == 'Mulher'), 0)
        contagem_homens = next((linha[1] for linha in estatisticas_genero if linha[0] == 'Homem'), 0)
        percentual_mulheres = round(contagem_mulheres / total * 100, 1) if total > 0 else 0
        percentual_homens = round(contagem_homens / total * 100, 1) if total > 0 else 0
        
        # Range de datas
        intervalo_data = self.bd.execute(f"""
            SELECT MIN(Data) as min_date, MAX(Data) as max_date
            FROM acidentes WHERE {clausula_where}
        """, parametros).fetchone()
        
        paises = request.args.getlist('country')
        
        return {
            'total': total,
            'women': {'count': contagem_mulheres, 'percent': percentual_mulheres},
            'men': {'count': contagem_homens, 'percent': percentual_homens},
            'countriesCount': len(paises) if paises else 0,
            'dateRange': {
                'start': formatar_data(intervalo_data[0]) if intervalo_data and intervalo_data[0] else None,
                'end': formatar_data(intervalo_data[1]) if intervalo_data and intervalo_data[1] else None
            }
        }


# ==================== SERVIÇO DE GRÁFICOS ====================

class ServicoGraficos:
    """Serviço para gerar dados de gráficos"""
    
    def __init__(self, bd):
        self.bd = bd
    
    def obter_dados_grafico_mensal(self, intervalo_meses='all'):
        """Retorna dados do gráfico mensal"""
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data()
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        
        consulta = f"""
            SELECT strftime(Data, '%Y-%m') as month, COUNT(*) as count
            FROM acidentes WHERE {clausula_where}
            GROUP BY month ORDER BY month
        """
        
        if intervalo_meses != 'all':
            consulta += f" LIMIT {int(intervalo_meses)}"
        
        dados_mensais = self.bd.execute(consulta, parametros).fetchall()
        
        rotulos = [formatar_rotulo_mes(linha[0]) for linha in dados_mensais]
        dados = [linha[1] for linha in dados_mensais]
        
        return {'labels': rotulos, 'data': dados}
    
    def obter_dados_grafico_setores(self):
        """Retorna dados do gráfico de setores"""
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data()
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        
        dados_setores = self.bd.execute(f"""
            SELECT Setor_Industrial, COUNT(*) as count
            FROM acidentes WHERE {clausula_where}
            GROUP BY Setor_Industrial ORDER BY count DESC
        """, parametros).fetchall()
        
        setores = {'Mineração': 0, 'Metalurgia': 0, 'Outros': 0}
        for linha in dados_setores:
            nome_setor, contagem = linha[0], linha[1]
            if nome_setor in setores:
                setores[nome_setor] = contagem
            else:
                setores['Outros'] += contagem
        
        return {'labels': list(setores.keys()), 'data': list(setores.values())}
    
    def obter_dados_grafico_localizacoes(self, filtro_pais='all'):
        """Retorna dados do gráfico de localização"""
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data() \
                    .adicionar_filtro_customizado('Pais', filtro_pais)
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        
        dados_localizacoes = self.bd.execute(f"""
            SELECT Estado, COUNT(*) as count
            FROM acidentes WHERE {clausula_where}
            GROUP BY Estado ORDER BY count DESC LIMIT 6
        """, parametros).fetchall()
        
        return {
            'labels': [linha[0] for linha in dados_localizacoes],
            'data': [linha[1] for linha in dados_localizacoes]
        }
    
    def obter_dados_mapa_calor_partes_corpo(self):
        """Retorna dados do mapa de calor de partes do corpo"""
        construtor_consulta = ConstrutorConsulta()
        construtor_consulta.adicionar_filtro_genero() \
                    .adicionar_filtro_pais() \
                    .adicionar_filtro_intervalo_data()
        
        clausula_where = construtor_consulta.obter_clausula_where()
        parametros = construtor_consulta.obter_parametros()
        
        dados_partes_corpo = self.bd.execute(f"""
            SELECT Parte_Corpo, COUNT(*) as count
            FROM acidentes WHERE {clausula_where} 
            AND Parte_Corpo != 'Não especificado'
            GROUP BY Parte_Corpo ORDER BY count DESC
        """, parametros).fetchall()
        
        return {
            'bodyParts': [{'part': linha[0], 'count': linha[1]} for linha in dados_partes_corpo]
        }


# ==================== SERVIÇO DE SEGURANÇA ====================

class ServicoSeguranca:
    """Serviço para calcular métricas de segurança"""
    
    def __init__(self, bd):
        self.bd = bd
    
    def obter_registro_seguranca(self):
        """Retorna dados do recorde de segurança"""
        acidentes_graves = self.bd.execute("""
            SELECT DISTINCT Data FROM acidentes
            WHERE Nivel_Acidente IN ('IV - Alto', 'V - Muito Alto', 'VI - Crítico')
               OR Nivel_Acidente_Potencial IN ('IV - Alto', 'V - Muito Alto', 'VI - Crítico')
            ORDER BY Data
        """).fetchall()
        
        if len(acidentes_graves) < 2:
            return {
                'recordDays': 0, 'recordStartDate': None, 'recordEndDate': None,
                'currentDaysSinceLast': 0, 'lastSevereAccidentDate': None
            }
        
        # Calcular maior intervalo
        dias_maximos, data_inicio, data_fim = 0, None, None
        for i in range(len(acidentes_graves) - 1):
            data_atual = acidentes_graves[i][0]
            proxima_data = acidentes_graves[i + 1][0]
            diferenca_dias = (proxima_data - data_atual).days
            
            if diferenca_dias > dias_maximos:
                dias_maximos = diferenca_dias
                data_inicio = data_atual
                data_fim = proxima_data
        
        # Dias desde último acidente grave
        ultimo_grave = acidentes_graves[-1][0]
        ultima_data_total = self.bd.execute("SELECT MAX(Data) FROM acidentes").fetchone()[0]
        dias_desde_ultimo = (ultima_data_total - ultimo_grave).days
        
        return {
            'recordDays': dias_maximos,
            'recordStartDate': formatar_data(data_inicio),
            'recordEndDate': formatar_data(data_fim),
            'currentDaysSinceLast': dias_desde_ultimo,
            'lastSevereAccidentDate': formatar_data(ultimo_grave)
        }


# ==================== SERVIÇO DE AÇÕES ====================

class ServicoAcoes:
    """Serviço para gerar ações recomendadas"""
    
    def __init__(self, bd):
        self.bd = bd
        self.data_base = datetime(2017, 7, 15)
    
    def obter_proximas_acoes(self):
        """Retorna próximas ações baseadas nos dados históricos"""
        acoes = []
        
        # Áreas críticas
        areas_criticas = self.bd.execute("""
            SELECT Estado as location, Pais as country, COUNT(*) as accident_count,
                   SUM(CASE WHEN Nivel_Acidente IN ('IV - Alto', 'V - Muito Alto', 'VI - Crítico')
                            OR Nivel_Acidente_Potencial IN ('IV - Alto', 'V - Muito Alto', 'VI - Crítico')
                       THEN 1 ELSE 0 END) as severe_count,
                   MAX(Data) as last_accident
            FROM acidentes WHERE Data >= DATE '2017-01-01'
            GROUP BY Estado, Pais HAVING COUNT(*) >= 3
            ORDER BY severe_count DESC, accident_count DESC LIMIT 5
        """).fetchall()
        
        if areas_criticas:
            acoes.extend(self._gerar_acoes_area(areas_criticas))
        
        # Partes do corpo afetadas
        if len(acoes) < 3:
            partes_corpo = self.bd.execute("""
                SELECT Parte_Corpo as body_part, COUNT(*) as count
                FROM acidentes WHERE Data >= DATE '2017-01-01'
                    AND Parte_Corpo IS NOT NULL AND Parte_Corpo != 'Não especificado'
                GROUP BY Parte_Corpo ORDER BY count DESC LIMIT 3
            """).fetchall()
            
            if partes_corpo:
                acoes.extend(self._gerar_acoes_parte_corpo(partes_corpo))
        
        # Garantir 3 ações
        while len(acoes) < 3:
            acoes.append(self._obter_acao_padrao())
        
        return acoes[:3]
    
    def _gerar_acoes_area(self, areas_criticas):
        acoes = []
        area_principal = areas_criticas[0]
        localizacao, pais, _, contagem_graves, _ = area_principal
        
        codigo_pais = {'Brasil': 'BR', 'EUA': 'US', 'Canadá': 'CA'}.get(pais, 'BR')
        
        if contagem_graves >= 5:
            acoes.append({
                'priority': 'urgent', 'status': 'in-progress',
                'title': 'Auditoria de segurança completa',
                'location': f'{localizacao} ({codigo_pais})',
                'responsible': 'Coordenador de Segurança',
                'deadline': (self.data_base + timedelta(days=2)).strftime('%d/%m/%Y'),
                'description': f'{contagem_graves} acidentes graves registrados nesta localidade'
            })
        elif contagem_graves >= 3:
            acoes.append({
                'priority': 'high', 'status': 'planned',
                'title': 'Reforço de protocolos de segurança',
                'location': f'{localizacao} ({codigo_pais})',
                'responsible': 'Supervisor de Operações',
                'deadline': (self.data_base + timedelta(days=5)).strftime('%d/%m/%Y'),
                'description': f'Área com {contagem_graves} acidentes graves recentes'
            })
        
        return acoes
    
    def _gerar_acoes_parte_corpo(self, partes_corpo):
        acoes = []
        if partes_corpo:
            nome_parte_corpo, contagem_parte_corpo = partes_corpo[0]
            sugestoes_epi = {
                'Mãos': 'luvas de proteção reforçadas',
                'Pés': 'calçados de segurança antiderrapantes',
                'Olhos': 'óculos de proteção e protetores faciais',
                'Cabeça': 'capacetes e proteção craniana',
                'Tronco': 'coletes de proteção'
            }
            epi = sugestoes_epi.get(nome_parte_corpo, 'EPIs adequados')
            
            acoes.append({
                'priority': 'medium', 'status': 'planned',
                'title': f'Revisão de EPI: {nome_parte_corpo.lower()}',
                'location': 'Setores de produção',
                'responsible': 'Gestor de Equipamentos',
                'deadline': (self.data_base + timedelta(days=10)).strftime('%d/%m/%Y'),
                'description': f'{contagem_parte_corpo} acidentes afetaram {nome_parte_corpo.lower()}. Sugestão: {epi}'
            })
        
        return acoes
    
    def _obter_acao_padrao(self):
        return {
            'priority': 'medium', 'status': 'planned',
            'title': 'Manutenção preventiva de equipamentos',
            'location': 'Todas as unidades',
            'responsible': 'Equipe de Manutenção',
            'deadline': (self.data_base + timedelta(days=14)).strftime('%d/%m/%Y'),
            'description': 'Inspeção regular de equipamentos e instalações'
        }

"""
Rotas da aplicação - Todos os endpoints
"""
from flask import render_template, jsonify, g, request
from app.services import (
    ServicoAcidentes, ServicoEstatisticas, ServicoDashboard,
    ServicoGraficos, ServicoSeguranca, ServicoAcoes
)


def registrar_rotas(app):
    """Registra todas as rotas na aplicação"""
    
    # ==================== PÁGINAS HTML ====================
    
    @app.route('/')
    @app.route('/home')
    def home():
        """Página inicial"""
        return render_template('home.html')
    
    @app.route('/dashboard')
    def dashboard():
        """Página do dashboard"""
        return render_template('dashboard.html')
    
    # ==================== API - ACIDENTES ====================
    
    @app.route('/api/accidents')
    def obter_acidentes():
        """Endpoint API para retornar todos os acidentes"""
        servico = ServicoAcidentes(g.bd)
        acidentes = servico.obter_todos_acidentes()
        return jsonify(acidentes)
    
    @app.route('/api/accidents/filtered')
    def obter_acidentes_filtrados():
        """Endpoint API para retornar acidentes filtrados com paginação"""
        servico = ServicoAcidentes(g.bd)
        
        pagina = int(request.args.get('page', 1))
        por_pagina = int(request.args.get('perPage', 10))
        consulta_busca = request.args.get('search', '').strip()
        
        acidentes = servico.obter_acidentes_filtrados(pagina, por_pagina, consulta_busca)
        return jsonify(acidentes)
    
    # ==================== API - ESTATÍSTICAS ====================
    
    @app.route('/api/statistics')
    def obter_estatisticas():
        """Endpoint API para retornar estatísticas agregadas"""
        servico = ServicoEstatisticas(g.bd)
        estatisticas = servico.obter_todas_estatisticas()
        return jsonify(estatisticas)
    
    @app.route('/api/safety-record')
    def obter_registro_seguranca():
        """Endpoint API para retornar dados do recorde de segurança"""
        servico = ServicoSeguranca(g.bd)
        registro = servico.obter_registro_seguranca()
        return jsonify(registro)
    
    @app.route('/api/next-actions')
    def obter_proximas_acoes():
        """Endpoint API para retornar próximas ações baseadas nos dados históricos"""
        servico = ServicoAcoes(g.bd)
        acoes = servico.obter_proximas_acoes()
        return jsonify(acoes)
    
    # ==================== API - DASHBOARD ====================
    
    @app.route('/api/dashboard/stats')
    def obter_estatisticas_dashboard():
        """Endpoint API para retornar estatísticas do dashboard com filtros"""
        servico = ServicoDashboard(g.bd)
        estatisticas = servico.obter_estatisticas_dashboard()
        return jsonify(estatisticas)
    
    # ==================== API - GRÁFICOS ====================
    
    @app.route('/api/charts/monthly')
    def obter_grafico_mensal():
        """Endpoint API para retornar dados do gráfico mensal"""
        servico = ServicoGraficos(g.bd)
        intervalo_meses = request.args.get('range', 'all')
        dados = servico.obter_dados_grafico_mensal(intervalo_meses)
        return jsonify(dados)
    
    @app.route('/api/charts/sectors')
    def obter_grafico_setores():
        """Endpoint API para retornar dados do gráfico de setores"""
        servico = ServicoGraficos(g.bd)
        dados = servico.obter_dados_grafico_setores()
        return jsonify(dados)
    
    @app.route('/api/charts/locations')
    def obter_grafico_localizacoes():
        """Endpoint API para retornar dados do gráfico de localização"""
        servico = ServicoGraficos(g.bd)
        filtro_pais = request.args.get('filterCountry', 'all')
        dados = servico.obter_dados_grafico_localizacoes(filtro_pais)
        return jsonify(dados)
    
    @app.route('/api/heatmap/bodyparts')
    def obter_mapa_calor_partes_corpo():
        """Endpoint API para retornar dados do mapa de calor"""
        servico = ServicoGraficos(g.bd)
        dados = servico.obter_dados_mapa_calor_partes_corpo()
        return jsonify(dados)

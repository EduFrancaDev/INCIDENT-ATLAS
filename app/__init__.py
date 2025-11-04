"""
Aplicação Flask - Incident Atlas
Arquitetura Simplificada
"""
from flask import Flask, g
from app.database import configurar_banco_dados, obter_bd


def criar_app():
    """Factory function para criar a aplicação Flask"""
    
    # Criar instância do Flask
    app = Flask(__name__, 
                template_folder='../template', 
                static_folder='../static')
    
    # Configurações
    app.config['DATABASE'] = 'acidentes.duckdb'
    app.config['DEBUG'] = True
    app.config['HOST'] = '0.0.0.0'
    app.config['PORT'] = 5001
    
    # Configurar banco de dados
    configurar_banco_dados(app)
    
    # Registrar g.bd para uso nas rotas
    @app.before_request
    def antes_requisicao():
        g.bd = obter_bd(app)
    
    # Registrar rotas
    from app.routes import registrar_rotas
    registrar_rotas(app)
    
    return app

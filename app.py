"""
Ponto de entrada da aplicação Radar de Acidentes
"""
from app import criar_app

# Criar aplicação
app = criar_app()

if __name__ == '__main__':
    # Executar servidor de desenvolvimento
    app.run(
        debug=app.config['DEBUG'],
        host=app.config['HOST'],
        port=app.config['PORT']
    )

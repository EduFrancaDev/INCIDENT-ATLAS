"""
Utilitários - Formatação e construção de queries
"""
from flask import request


# ==================== FORMATADORES ====================

def formatar_data(obj_data):
    """Formata um objeto de data para string ISO"""
    if obj_data:
        return obj_data.isoformat() if hasattr(obj_data, 'isoformat') else str(obj_data)
    return None


def formatar_rotulo_mes(str_mes):
    """
    Formata string de mês (YYYY-MM) para label (Mês/Ano)
    Exemplo: '2016-01' -> 'Jan/2016'
    """
    nomes_meses = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
        '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
        '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    }
    
    ano, numero_mes = str_mes.split('-')
    rotulo_mes = nomes_meses.get(numero_mes, numero_mes)
    return f'{rotulo_mes}/{ano}'


# ==================== CONSTRUTOR DE CONSULTAS ====================

class ConstrutorConsulta:
    """Classe auxiliar para construir queries SQL com filtros dinâmicos"""
    
    def __init__(self):
        self.clausulas_where = []
        self.parametros = {}
        self.contador_parametros = 0
    
    def adicionar_filtro_genero(self):
        """Adiciona filtro de gênero à query"""
        generos = request.args.getlist('gender')
        if generos:
            placeholders = []
            for genero in generos:
                placeholder = self._proximo_placeholder()
                placeholders.append(placeholder)
                self.parametros[placeholder] = genero
            self.clausulas_where.append(f"Genero IN ({', '.join(placeholders)})")
        return self
    
    def adicionar_filtro_pais(self):
        """Adiciona filtro de país à query"""
        paises = request.args.getlist('country')
        if paises:
            placeholders = []
            for pais in paises:
                placeholder = self._proximo_placeholder()
                placeholders.append(placeholder)
                self.parametros[placeholder] = pais
            self.clausulas_where.append(f"Pais IN ({', '.join(placeholders)})")
        return self
    
    def adicionar_filtro_intervalo_data(self):
        """Adiciona filtro de período de datas à query"""
        data_inicio = request.args.get('startDate')
        data_fim = request.args.get('endDate')
        
        if data_inicio:
            placeholder = self._proximo_placeholder()
            self.clausulas_where.append(f"Data >= {placeholder}")
            self.parametros[placeholder] = data_inicio
        
        if data_fim:
            placeholder = self._proximo_placeholder()
            self.clausulas_where.append(f"Data <= {placeholder}")
            self.parametros[placeholder] = data_fim
        
        return self
    
    def adicionar_filtro_customizado(self, coluna, valor):
        """Adiciona filtro customizado à query"""
        if valor and valor != 'all':
            placeholder = self._proximo_placeholder()
            self.clausulas_where.append(f"{coluna} = {placeholder}")
            self.parametros[placeholder] = valor
        return self
    
    def adicionar_filtro_busca(self, consulta_busca, colunas):
        """Adiciona filtro de busca textual em múltiplas colunas"""
        if consulta_busca and consulta_busca.strip():
            placeholder = self._proximo_placeholder()
            padrao_busca = f'%{consulta_busca.strip()}%'
            
            condicoes = [f"{col} ILIKE {placeholder}" for col in colunas]
            self.clausulas_where.append(f"({' OR '.join(condicoes)})")
            self.parametros[placeholder] = padrao_busca
        
        return self
    
    def obter_clausula_where(self):
        """Retorna a cláusula WHERE completa"""
        return " AND ".join(self.clausulas_where) if self.clausulas_where else "1=1"
    
    def obter_parametros(self):
        """Retorna os parâmetros para a query"""
        return list(self.parametros.values())
    
    def _proximo_placeholder(self):
        """Gera próximo placeholder ($1, $2, etc.)"""
        self.contador_parametros += 1
        return f'${self.contador_parametros}'
    
    def _placeholder_atual(self):
        """Retorna o placeholder atual"""
        return f'${self.contador_parametros}'

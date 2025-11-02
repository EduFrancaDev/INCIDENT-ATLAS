#!/usr/bin/env python3
"""
Script para traduzir os dados do CSV para português BR
"""
import pandas as pd
import sys

def traduzir_csv():
    # Ler o CSV
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    df = pd.read_csv(csv_path)
    
    print("=" * 80)
    print("INICIANDO TRADUÇÃO DOS DADOS")
    print("=" * 80)
    
    # 1. PAÍSES - 3 países: Brasil, EUA, Canadá
    print("\n1. Traduzindo PAÍSES...")
    print(f"   Antes: {sorted(df['Countries'].unique())}")
    
    paises_map = {
        'Country_01': 'Brasil',
        'Country_02': 'EUA', 
        'Country_03': 'Canadá'
    }
    df['Countries'] = df['Countries'].replace(paises_map)
    print(f"   Depois: {sorted(df['Countries'].unique())}")
    print(f"   ✓ {len(paises_map)} países traduzidos")
    
    # 2. LOCAIS - 12 locais: estados reais dos países
    print("\n2. Traduzindo LOCAIS (Estados)...")
    print(f"   Antes: {sorted(df['Local'].unique())}")
    
    # Brasil (Country_01) - 5 estados
    # EUA (Country_02) - 6 estados  
    # Canadá (Country_03) - 1 província
    locais_map = {
        # Brasil (Country_01) - 5 estados
        'Local_01': 'São Paulo',
        'Local_03': 'Minas Gerais',
        'Local_04': 'Rio de Janeiro',
        'Local_06': 'Bahia',
        'Local_11': 'Goiás',
        # EUA (Country_02) - 6 estados
        'Local_02': 'Texas',
        'Local_05': 'California',
        'Local_07': 'Arizona',
        'Local_08': 'Nevada',
        'Local_09': 'Florida',
        'Local_12': 'Colorado',
        # Canadá (Country_03) - 1 província
        'Local_10': 'Quebec'
    }
    df['Local'] = df['Local'].replace(locais_map)
    print(f"   Depois: {sorted(df['Local'].unique())}")
    print(f"   ✓ {len(locais_map)} estados traduzidos")
    
    # 3. SETOR - Mining, Metals, Others
    print("\n3. Traduzindo SETOR...")
    print(f"   Antes: {sorted(df['Industry Sector'].unique())}")
    
    setor_map = {
        'Mining': 'Mineração',
        'Metals': 'Metalurgia',
        'Others': 'Outros'
    }
    df['Industry Sector'] = df['Industry Sector'].replace(setor_map)
    print(f"   Depois: {sorted(df['Industry Sector'].unique())}")
    print(f"   ✓ {len(setor_map)} setores traduzidos")
    
    # 4. NÍVEL DE ACIDENTE - I, II, III, IV, V
    print("\n4. Traduzindo NÍVEL DE ACIDENTE...")
    print(f"   Antes: {sorted(df['Accident Level'].unique())}")
    
    nivel_map = {
        'I': 'I - Muito Baixo',
        'II': 'II - Baixo',
        'III': 'III - Médio',
        'IV': 'IV - Alto',
        'V': 'V - Muito Alto'
    }
    df['Accident Level'] = df['Accident Level'].replace(nivel_map)
    print(f"   Depois: {sorted(df['Accident Level'].unique())}")
    print(f"   ✓ {len(nivel_map)} níveis traduzidos")
    
    # 5. POTENCIAL NÍVEL DE ACIDENTE - I, II, III, IV, V, VI
    print("\n5. Traduzindo POTENCIAL NÍVEL DE ACIDENTE...")
    print(f"   Antes: {sorted(df['Potential Accident Level'].unique())}")
    
    potencial_map = {
        'I': 'I - Muito Baixo',
        'II': 'II - Baixo',
        'III': 'III - Médio',
        'IV': 'IV - Alto',
        'V': 'V - Muito Alto',
        'VI': 'VI - Crítico'
    }
    df['Potential Accident Level'] = df['Potential Accident Level'].replace(potencial_map)
    print(f"   Depois: {sorted(df['Potential Accident Level'].unique())}")
    print(f"   ✓ {len(potencial_map)} níveis potenciais traduzidos")
    
    # 6. GÊNERO - Male, Female
    print("\n6. Traduzindo GÊNERO...")
    print(f"   Antes: {sorted(df['Genre'].unique())}")
    
    genero_map = {
        'Male': 'Homem',
        'Female': 'Mulher'
    }
    df['Genre'] = df['Genre'].replace(genero_map)
    print(f"   Depois: {sorted(df['Genre'].unique())}")
    print(f"   ✓ {len(genero_map)} gêneros traduzidos")
    
    # 7. RISCO CRÍTICO
    print("\n7. Traduzindo RISCO CRÍTICO...")
    print(f"   Total de riscos únicos: {df['Critical Risk'].nunique()}")
    
    risco_map = {
        'Not applicable': 'Não aplicável',
        'Bees': 'Abelhas',
        'Blocking and isolation of energies': 'Bloqueio e isolamento de energias',
        'Burn': 'Queimadura',
        'Chemical substances': 'Substâncias químicas',
        'Confined space': 'Espaço confinado',
        'Cut': 'Corte',
        'Electrical Shock': 'Choque elétrico',
        'Electrical installation': 'Instalação elétrica',
        'Fall': 'Queda',
        'Fall prevention': 'Prevenção de queda',
        'Fall prevention (same level)': 'Prevenção de queda (mesmo nível)',
        'Individual protection equipment': 'Equipamento de proteção individual',
        'Liquid Metal': 'Metal líquido',
        'Machine Protection': 'Proteção de máquina',
        'Manual Tools': 'Ferramentas manuais',
        'Others': 'Outros',
        'Plates': 'Placas',
        'Poll': 'Pesquisa',
        'Power lock': 'Bloqueio de energia',
        'Pressed': 'Prensado',
        'Pressurized Systems': 'Sistemas pressurizados',
        'Pressurized Systems / Chemical Substances': 'Sistemas pressurizados / Substâncias químicas',
        'Projection': 'Projeção',
        'Projection of fragments': 'Projeção de fragmentos',
        'Projection/Burning': 'Projeção/Queimadura',
        'Projection/Choco': 'Projeção/Choque',
        'Projection/Manual Tools': 'Projeção/Ferramentas manuais',
        'Suspended Loads': 'Cargas suspensas',
        'Traffic': 'Tráfego',
        'Vehicles and Mobile Equipment': 'Veículos e equipamentos móveis',
        'Venomous Animals': 'Animais peçonhentos',
        'remains of choco': 'Restos de choque'
    }
    df['Critical Risk'] = df['Critical Risk'].replace(risco_map)
    print(f"   ✓ {len(risco_map)} riscos críticos traduzidos")
    
    # 8. COLUNA 'c' (Employee/Third Party)
    print("\n8. Traduzindo coluna 'c' (Tipo de Trabalhador)...")
    print(f"   Antes: {sorted(df['c'].unique())}")
    
    c_map = {
        'Employee': 'Funcionário',
        'Third Party': 'Terceiro',
        'Third Party (Remote)': 'Terceiro (Remoto)'
    }
    df['c'] = df['c'].replace(c_map)
    print(f"   Depois: {sorted(df['c'].unique())}")
    print(f"   ✓ {len(c_map)} tipos traduzidos")
    
    # Salvar o arquivo traduzido
    output_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    df.to_csv(output_path, index=False)
    
    print("\n" + "=" * 80)
    print("TRADUÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"Arquivo salvo em: {output_path}")
    print("=" * 80)
    print("\nOBS: A coluna 'Description' NÃO foi alterada, conforme solicitado.")
    
    return df

if __name__ == '__main__':
    traduzir_csv()

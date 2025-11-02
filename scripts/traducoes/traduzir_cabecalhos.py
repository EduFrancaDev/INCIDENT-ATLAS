#!/usr/bin/env python3
"""
Script para traduzir os cabeçalhos (nomes das colunas) do CSV para português BR
"""
import pandas as pd
from datetime import datetime

def traduzir_cabecalhos():
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    backup_path = f'data/backup_antes_traducao_cabecalhos_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    print("=" * 80)
    print("📝 TRADUÇÃO DOS CABEÇALHOS DO CSV PARA PORTUGUÊS BR")
    print("=" * 80)
    
    # Ler o CSV
    print("\n📖 Lendo arquivo CSV...")
    df = pd.read_csv(csv_path)
    
    print(f"\n📋 CABEÇALHOS ATUAIS (em inglês):")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col}")
    
    # Fazer backup
    print(f"\n💾 Criando backup em: {backup_path}")
    df.to_csv(backup_path, index=False)
    
    # Mapeamento de cabeçalhos inglês → português
    cabecalhos_map = {
        'id': 'id',  # Mantém id como está
        'Data': 'Data',  # Data já está em português
        'Countries': 'Pais',
        'Local': 'Estado',
        'Industry Sector': 'Setor_Industrial',
        'Accident Level': 'Nivel_Acidente',
        'Potential Accident Level': 'Nivel_Acidente_Potencial',
        'Genre': 'Genero',
        'c': 'Tipo_Trabalhador',
        'Critical Risk': 'Risco_Critico',
        'Description': 'Descricao'
    }
    
    print(f"\n🔄 TRADUZINDO CABEÇALHOS:")
    print(f"   (mantendo formato adequado para banco de dados)\n")
    
    for old_name, new_name in cabecalhos_map.items():
        if old_name in df.columns:
            if old_name != new_name:
                print(f"   {old_name:30s} → {new_name}")
            else:
                print(f"   {old_name:30s} (mantido)")
    
    # Renomear colunas
    df.rename(columns=cabecalhos_map, inplace=True)
    
    # Salvar CSV com cabeçalhos traduzidos
    print(f"\n💾 Salvando CSV com cabeçalhos traduzidos...")
    df.to_csv(csv_path, index=False)
    
    print(f"\n📋 CABEÇALHOS NOVOS (em português):")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col}")
    
    print("\n" + "=" * 80)
    print("✅ CABEÇALHOS TRADUZIDOS COM SUCESSO!")
    print("=" * 80)
    
    print(f"\n📁 ARQUIVOS:")
    print(f"   • Backup: {backup_path}")
    print(f"   • CSV Atualizado: {csv_path}")
    
    print(f"\n⚠️  IMPORTANTE:")
    print(f"   Você precisará atualizar:")
    print(f"   1. O banco DuckDB (executar atualizar_banco_duckdb.py)")
    print(f"   2. O arquivo run.py (queries SQL)")
    
    return df

if __name__ == '__main__':
    traduzir_cabecalhos()

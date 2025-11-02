#!/usr/bin/env python3
"""
Script para remover duplicatas do CSV de acidentes
Remove linhas completamente duplicadas (mesma data, local, descrição, etc.)
Mantém apenas a primeira ocorrência de cada acidente
"""
import pandas as pd
from datetime import datetime

def remover_duplicatas():
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    backup_path = f'data/backup_antes_remover_duplicatas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    print("=" * 80)
    print("🧹 REMOÇÃO DE DUPLICATAS DO CSV")
    print("=" * 80)
    
    # Ler o CSV
    print("\n📖 Lendo arquivo CSV...")
    df = pd.read_csv(csv_path)
    
    print(f"   Total de linhas: {len(df)}")
    
    # Fazer backup
    print(f"\n💾 Criando backup em: {backup_path}")
    df.to_csv(backup_path, index=False)
    
    # Identificar duplicatas (todas as colunas exceto 'id')
    colunas_comparacao = [col for col in df.columns if col != 'id']
    
    # Encontrar duplicatas
    duplicatas_antes = df[df.duplicated(subset=colunas_comparacao, keep=False)]
    
    print(f"\n🔍 DUPLICATAS ENCONTRADAS:")
    print(f"   • Linhas duplicadas: {len(duplicatas_antes)}")
    print(f"   • Grupos de duplicatas: {len(duplicatas_antes) // 2 if len(duplicatas_antes) > 0 else 0}")
    
    if len(duplicatas_antes) > 0:
        # Mostrar detalhes das duplicatas
        print(f"\n📋 DETALHES DOS GRUPOS DUPLICADOS:")
        
        grupos_vistos = set()
        contador = 0
        
        for idx, row in duplicatas_antes.sort_values(by=colunas_comparacao).iterrows():
            chave = tuple(row[col] for col in colunas_comparacao)
            
            if chave not in grupos_vistos:
                grupos_vistos.add(chave)
                contador += 1
                
                linhas_grupo = df[
                    (df[colunas_comparacao] == row[colunas_comparacao]).all(axis=1)
                ]
                
                print(f"\n   Grupo {contador}:")
                print(f"      IDs: {', '.join(map(str, linhas_grupo['id'].values))}")
                print(f"      Data: {row['Data']}")
                print(f"      Local: {row['Countries']} - {row['Local']}")
                print(f"      Descrição: {row['Description'][:80]}...")
        
        # Remover duplicatas mantendo a primeira ocorrência
        print(f"\n🧹 Removendo duplicatas...")
        df_limpo = df.drop_duplicates(subset=colunas_comparacao, keep='first')
        
        # Reorganizar IDs sequencialmente
        print(f"   Reorganizando IDs sequencialmente...")
        df_limpo = df_limpo.reset_index(drop=True)
        df_limpo['id'] = df_limpo.index
        
        # Salvar CSV limpo
        print(f"\n💾 Salvando CSV limpo...")
        df_limpo.to_csv(csv_path, index=False)
        
        print("\n" + "=" * 80)
        print("✅ DUPLICATAS REMOVIDAS COM SUCESSO!")
        print("=" * 80)
        print(f"\n📊 RESULTADO:")
        print(f"   • Linhas antes: {len(df)}")
        print(f"   • Linhas depois: {len(df_limpo)}")
        print(f"   • Linhas removidas: {len(df) - len(df_limpo)}")
        print(f"   • Redução: {((len(df) - len(df_limpo)) / len(df) * 100):.1f}%")
        
        print(f"\n📁 ARQUIVOS:")
        print(f"   • Backup: {backup_path}")
        print(f"   • CSV Limpo: {csv_path}")
        
        return df_limpo
    else:
        print("\n✅ Nenhuma duplicata encontrada!")
        print("   O arquivo já está limpo.")
        return df

if __name__ == '__main__':
    remover_duplicatas()

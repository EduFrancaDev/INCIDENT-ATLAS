#!/usr/bin/env python3
"""
Script para traduzir as descrições de acidentes de inglês para português BR
Usa a biblioteca deep-translator (Google Translate gratuito)
"""
import pandas as pd
import time
from deep_translator import GoogleTranslator
from datetime import datetime
import os

def traduzir_descricoes():
    # Configurações
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    backup_path = f'data/backup_antes_traducao_descricoes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    print("=" * 80)
    print("🌍 TRADUÇÃO AUTOMÁTICA DAS DESCRIÇÕES - INGLÊS → PORTUGUÊS BR")
    print("=" * 80)
    
    # Ler o CSV
    print("\n📖 Lendo arquivo CSV...")
    df = pd.read_csv(csv_path)
    
    # Fazer backup
    print(f"💾 Criando backup em: {backup_path}")
    df.to_csv(backup_path, index=False)
    
    # Inicializar tradutor
    translator = GoogleTranslator(source='en', target='pt')
    
    # Estatísticas
    total = len(df)
    print(f"\n📊 Total de descrições: {total}")
    print(f"📝 Caracteres totais: {df['Description'].str.len().sum():,}")
    print(f"\n⏳ Iniciando tradução... (pode levar alguns minutos)")
    print(f"💡 Dica: Adiciono delay entre traduções para evitar rate limit\n")
    
    # Traduzir cada descrição
    traducoes = []
    erros = []
    
    for idx, row in df.iterrows():
        try:
            # Mostrar progresso
            if idx % 10 == 0:
                progresso = (idx / total) * 100
                print(f"   [{idx}/{total}] - {progresso:.1f}% concluído...", end='\r')
            
            # Traduzir
            texto_original = row['Description']
            texto_traduzido = translator.translate(texto_original)
            traducoes.append(texto_traduzido)
            
            # Pequeno delay para evitar rate limit (50ms)
            time.sleep(0.05)
            
        except Exception as e:
            print(f"\n⚠️  Erro na linha {idx}: {str(e)}")
            erros.append({'linha': idx, 'erro': str(e)})
            # Em caso de erro, manter o texto original
            traducoes.append(row['Description'])
            time.sleep(1)  # Delay maior em caso de erro
    
    # Atualizar DataFrame
    df['Description'] = traducoes
    
    # Salvar arquivo traduzido
    print(f"\n\n💾 Salvando arquivo traduzido...")
    df.to_csv(csv_path, index=False)
    
    # Relatório final
    print("\n" + "=" * 80)
    print("✅ TRADUÇÃO CONCLUÍDA!")
    print("=" * 80)
    print(f"\n📊 ESTATÍSTICAS:")
    print(f"   ✅ Traduções bem-sucedidas: {total - len(erros)}")
    print(f"   ❌ Erros: {len(erros)}")
    print(f"   📈 Taxa de sucesso: {((total - len(erros)) / total * 100):.1f}%")
    
    if erros:
        print(f"\n⚠️  ERROS ENCONTRADOS:")
        for erro in erros[:5]:  # Mostrar apenas os 5 primeiros
            print(f"   • Linha {erro['linha']}: {erro['erro']}")
        if len(erros) > 5:
            print(f"   ... e mais {len(erros) - 5} erros")
    
    print(f"\n📁 ARQUIVOS:")
    print(f"   • Original (backup): {backup_path}")
    print(f"   • Traduzido: {csv_path}")
    
    print(f"\n🔍 PRÓXIMOS PASSOS:")
    print(f"   1. Revisar algumas descrições traduzidas")
    print(f"   2. Verificar se números e medidas foram preservados")
    print(f"   3. Corrigir manualmente termos técnicos se necessário")
    
    # Mostrar algumas amostras
    print(f"\n📋 AMOSTRAS DE TRADUÇÃO (primeiras 3):")
    print("=" * 80)
    for i in range(min(3, len(df))):
        print(f"\n🔹 Descrição {i+1}:")
        print(f"   Original: {df.iloc[i]['Description'][:150]}...")
        
    return df

if __name__ == '__main__':
    try:
        traduzir_descricoes()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tradução interrompida pelo usuário!")
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {str(e)}")
        raise

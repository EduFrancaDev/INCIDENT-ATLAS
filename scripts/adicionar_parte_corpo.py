#!/usr/bin/env python3
"""
Script para adicionar coluna 'Parte_Corpo' ao CSV
Analisa as descrições dos acidentes e identifica qual parte do corpo foi afetada
"""
import pandas as pd
import re
from datetime import datetime

def detectar_parte_corpo(descricao):
    """
    Detecta a parte do corpo afetada baseada na descrição do acidente
    Retorna a parte do corpo em português para o mapa de calor
    """
    if not descricao or pd.isna(descricao):
        return 'Não especificado'
    
    desc_lower = descricao.lower()
    
    # Dicionário de palavras-chave para cada parte do corpo
    # Ordem de prioridade: mais específico primeiro
    partes_corpo = {
        # Cabeça e Face
        'Olhos': [
            'olho', 'olhos', 'eye', 'eyes', 'córnea', 'pálpebra', 'visão', 
            'pupila', 'íris', 'retina', 'cego', 'cegueira'
        ],
        'Face': [
            'rosto', 'face', 'facial', 'bochecha', 'zigomático', 'maxilar',
            'queixo', 'testa', 'nariz', 'boca', 'lábio', 'dente', 'mandíbula'
        ],
        'Cabeça': [
            'cabeça', 'crânio', 'craniano', 'head', 'skull', 'couro cabeludo',
            'têmpora', 'occipital', 'frontal'
        ],
        'Orelha': [
            'orelha', 'ouvido', 'ear', 'audição', 'tímpano', 'auricular'
        ],
        'Pescoço': [
            'pescoço', 'cervical', 'neck', 'garganta', 'throat', 'traqueia',
            'laringe', 'nuca'
        ],
        
        # Membros Superiores - Específico para Esquerdo/Direito
        'Mão Esquerda': [
            'mão esquerda', 'left hand', 'dedo esquerdo', 'dedos esquerdos',
            'pulso esquerdo', 'palma esquerda', 'quirodáctilo esquerdo'
        ],
        'Mão Direita': [
            'mão direita', 'right hand', 'dedo direito', 'dedos direitos',
            'pulso direito', 'palma direita', 'quirodáctilo direito'
        ],
        'Braço Esquerdo': [
            'braço esquerdo', 'left arm', 'antebraço esquerdo', 
            'cotovelo esquerdo', 'úmero esquerdo', 'ombro esquerdo'
        ],
        'Braço Direito': [
            'braço direito', 'right arm', 'antebraço direito',
            'cotovelo direito', 'úmero direito', 'ombro direito'
        ],
        
        # Membros Superiores - Genérico
        'Mãos': [
            'mão', 'mãos', 'hand', 'hands', 'dedo', 'dedos', 'finger', 'fingers',
            'pulso', 'wrist', 'palma', 'punho', 'metacarpo', 'falange',
            'quirodáctilo', 'polegar', 'indicador', 'médio', 'anelar', 'mindinho'
        ],
        'Braços': [
            'braço', 'braços', 'arm', 'arms', 'antebraço', 'forearm',
            'cotovelo', 'elbow', 'úmero', 'rádio', 'ulna', 'ombro', 'shoulder'
        ],
        
        # Tronco
        'Tórax': [
            'tórax', 'peito', 'chest', 'peitoral', 'costela', 'esterno',
            'clavícula', 'escápula', 'rib'
        ],
        'Abdômen': [
            'abdômen', 'abdomen', 'barriga', 'belly', 'estômago', 'stomach',
            'abdominal', 'ventre', 'umbigo'
        ],
        'Costas': [
            'costas', 'back', 'dorsal', 'lombar', 'coluna', 'vértebra',
            'espinha', 'spine', 'lombo'
        ],
        'Quadril': [
            'quadril', 'hip', 'pelve', 'pélvico', 'ilíaco', 'sacro', 'cóccix'
        ],
        
        # Membros Inferiores - Específico para Esquerdo/Direito
        'Perna Esquerda': [
            'perna esquerda', 'left leg', 'coxa esquerda', 'joelho esquerdo',
            'canela esquerda', 'panturrilha esquerda', 'tíbia esquerda'
        ],
        'Perna Direita': [
            'perna direita', 'right leg', 'coxa direita', 'joelho direito',
            'canela direita', 'panturrilha direita', 'tíbia direita'
        ],
        'Pé Esquerdo': [
            'pé esquerdo', 'left foot', 'tornozelo esquerdo', 
            'calcanhar esquerdo', 'dedos do pé esquerdo'
        ],
        'Pé Direito': [
            'pé direito', 'right foot', 'tornozelo direito',
            'calcanhar direito', 'dedos do pé direito'
        ],
        
        # Membros Inferiores - Genérico
        'Pernas': [
            'perna', 'pernas', 'leg', 'legs', 'coxa', 'thigh', 
            'joelho', 'knee', 'canela', 'panturrilha', 'calf',
            'fêmur', 'tíbia', 'fíbula', 'patela'
        ],
        'Pés': [
            'pé', 'pés', 'foot', 'feet', 'tornozelo', 'ankle',
            'calcanhar', 'heel', 'dedos do pé', 'toe', 'toes',
            'metatarso', 'tarso', 'calcâneo', 'planta do pé'
        ],
        
        # Múltiplas partes
        'Múltiplas': [
            'várias partes', 'multiple', 'politraumatismo', 'politrauma',
            'corpo todo', 'whole body', 'várias regiões'
        ]
    }
    
    # Verificar cada parte do corpo
    # Ordem de prioridade: mais específico primeiro
    for parte, palavras_chave in partes_corpo.items():
        for palavra in palavras_chave:
            # Usar regex para buscar palavra completa
            if re.search(r'\b' + re.escape(palavra) + r'\b', desc_lower):
                return parte
    
    # Se não encontrou nada específico, retornar 'Não especificado'
    return 'Não especificado'

def adicionar_coluna_parte_corpo():
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    backup_path = f'data/backup_antes_adicionar_parte_corpo_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    print("=" * 80)
    print("🔍 ADICIONANDO COLUNA 'PARTE DO CORPO' AO CSV")
    print("=" * 80)
    
    # Ler CSV
    print("\n📖 Lendo arquivo CSV...")
    df = pd.read_csv(csv_path)
    print(f"   Total de registros: {len(df)}")
    
    # Backup
    print(f"\n💾 Criando backup em: {backup_path}")
    df.to_csv(backup_path, index=False)
    
    # Detectar parte do corpo para cada acidente
    print(f"\n🔍 Analisando descrições para detectar partes do corpo...")
    print(f"   (Isso pode levar alguns segundos...)\n")
    
    partes_corpo = []
    for idx, row in df.iterrows():
        parte = detectar_parte_corpo(row['Descricao'])
        partes_corpo.append(parte)
        
        if (idx + 1) % 50 == 0:
            print(f"   Processado: {idx + 1}/{len(df)} acidentes...", end='\r')
    
    print(f"   Processado: {len(df)}/{len(df)} acidentes... ✅")
    
    # Adicionar coluna
    df['Parte_Corpo'] = partes_corpo
    
    # Estatísticas
    print(f"\n📊 ESTATÍSTICAS DAS PARTES DO CORPO DETECTADAS:")
    partes_count = df['Parte_Corpo'].value_counts()
    for parte, count in partes_count.items():
        percent = (count / len(df)) * 100
        print(f"   • {parte:20s}: {count:3d} acidentes ({percent:5.1f}%)")
    
    # Salvar CSV atualizado
    print(f"\n💾 Salvando CSV com nova coluna...")
    df.to_csv(csv_path, index=False)
    
    print("\n" + "=" * 80)
    print("✅ COLUNA 'PARTE_CORPO' ADICIONADA COM SUCESSO!")
    print("=" * 80)
    
    print(f"\n📁 ARQUIVOS:")
    print(f"   • Backup: {backup_path}")
    print(f"   • CSV Atualizado: {csv_path}")
    
    print(f"\n🔍 AMOSTRAS:")
    print(f"\n   Mostrando 5 exemplos de detecção:\n")
    amostras = df.sample(min(5, len(df)))
    for idx, row in amostras.iterrows():
        print(f"   #{row['id']} - {row['Parte_Corpo']}:")
        print(f"      {row['Descricao'][:100]}...")
        print()
    
    print(f"\n⚠️  PRÓXIMOS PASSOS:")
    print(f"   1. Atualizar o banco DuckDB")
    print(f"   2. Atualizar o run.py para retornar Parte_Corpo")
    
    return df

if __name__ == '__main__':
    adicionar_coluna_parte_corpo()

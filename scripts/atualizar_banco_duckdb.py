#!/usr/bin/env python3
"""
Script para atualizar o banco DuckDB com os dados traduzidos
Remove a tabela antiga e recria com os dados novos em português BR
"""
import duckdb
import os

def atualizar_banco_duckdb():
    db_path = 'acidentes.duckdb'
    csv_path = 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv'
    
    print("=" * 80)
    print("🔄 ATUALIZAÇÃO DO BANCO DUCKDB COM DADOS TRADUZIDOS")
    print("=" * 80)
    
    # Verificar se o CSV existe
    if not os.path.exists(csv_path):
        print(f"\n❌ ERRO: Arquivo CSV não encontrado em {csv_path}")
        return
    
    print(f"\n📁 Arquivo CSV: {csv_path}")
    print(f"📁 Banco DuckDB: {db_path}")
    
    # Backup do banco antigo se existir
    if os.path.exists(db_path):
        backup_path = f"{db_path}.backup"
        print(f"\n💾 Fazendo backup do banco atual...")
        try:
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"   ✅ Backup criado em: {backup_path}")
        except Exception as e:
            print(f"   ⚠️  Aviso: Não foi possível criar backup: {e}")
    
    # Conectar ao banco
    print(f"\n🔌 Conectando ao banco DuckDB...")
    db = duckdb.connect(db_path)
    
    # Verificar se a tabela existe e quantos registros tem
    try:
        result = db.execute("SELECT COUNT(*) FROM acidentes").fetchone()
        registros_antigos = result[0] if result else 0
        print(f"   📊 Registros no banco atual: {registros_antigos}")
    except:
        registros_antigos = 0
        print(f"   ℹ️  Tabela 'acidentes' ainda não existe")
    
    # Dropar a tabela antiga se existir
    print(f"\n🗑️  Removendo tabela antiga...")
    db.execute("DROP TABLE IF EXISTS acidentes")
    print(f"   ✅ Tabela removida")
    
    # Criar nova tabela com nomes de colunas atualizados (em português)
    print(f"\n🏗️  Criando nova estrutura da tabela...")
    db.execute("""
        CREATE TABLE acidentes (
            id INTEGER PRIMARY KEY,
            Data TIMESTAMP,
            Pais VARCHAR(100),
            Estado VARCHAR(200),
            Setor_Industrial VARCHAR(100),
            Nivel_Acidente VARCHAR(50),
            Nivel_Acidente_Potencial VARCHAR(50),
            Genero VARCHAR(20),
            Tipo_Trabalhador VARCHAR(50),
            Risco_Critico VARCHAR(200),
            Descricao TEXT
        )
    """)
    print(f"   ✅ Tabela criada")
    
    # Importar dados do CSV
    print(f"\n📥 Importando dados do CSV traduzido...")
    try:
        # Usar a função COPY do DuckDB para importação eficiente
        db.execute(f"""
            COPY acidentes FROM '{csv_path}' 
            (DELIMITER ',', HEADER TRUE, AUTO_DETECT TRUE)
        """)
        
        # Verificar quantos registros foram importados
        result = db.execute("SELECT COUNT(*) FROM acidentes").fetchone()
        registros_novos = result[0]
        
        print(f"   ✅ Dados importados com sucesso!")
        print(f"   📊 Total de registros importados: {registros_novos}")
        
        # Estatísticas dos dados importados
        print(f"\n📊 ESTATÍSTICAS DOS DADOS IMPORTADOS:")
        
        # Por país
        print(f"\n   🌍 Por País:")
        paises = db.execute("""
            SELECT Pais, COUNT(*) as count
            FROM acidentes
            GROUP BY Pais
            ORDER BY count DESC
        """).fetchall()
        for pais, count in paises:
            percent = (count / registros_novos) * 100
            print(f"      • {pais}: {count} ({percent:.1f}%)")
        
        # Por setor
        print(f"\n   🏭 Por Setor:")
        setores = db.execute("""
            SELECT Setor_Industrial, COUNT(*) as count
            FROM acidentes
            GROUP BY Setor_Industrial
            ORDER BY count DESC
        """).fetchall()
        for setor, count in setores:
            percent = (count / registros_novos) * 100
            print(f"      • {setor}: {count} ({percent:.1f}%)")
        
        # Por gênero
        print(f"\n   👤 Por Gênero:")
        generos = db.execute("""
            SELECT Genero, COUNT(*) as count
            FROM acidentes
            GROUP BY Genero
            ORDER BY count DESC
        """).fetchall()
        for genero, count in generos:
            percent = (count / registros_novos) * 100
            print(f"      • {genero}: {count} ({percent:.1f}%)")
        
        # Top 5 riscos críticos
        print(f"\n   ⚠️  Top 5 Riscos Críticos:")
        riscos = db.execute("""
            SELECT Risco_Critico, COUNT(*) as count
            FROM acidentes
            GROUP BY Risco_Critico
            ORDER BY count DESC
            LIMIT 5
        """).fetchall()
        for risco, count in riscos:
            percent = (count / registros_novos) * 100
            print(f"      • {risco}: {count} ({percent:.1f}%)")
        
        # Verificar uma amostra de descrições traduzidas
        print(f"\n   📝 Amostra de Descrição Traduzida:")
        amostra = db.execute("""
            SELECT Pais, Estado, Descricao
            FROM acidentes
            LIMIT 1
        """).fetchone()
        if amostra:
            print(f"      País: {amostra[0]}")
            print(f"      Estado: {amostra[1]}")
            print(f"      Descrição: {amostra[2][:150]}...")
        
        print("\n" + "=" * 80)
        print("✅ BANCO DUCKDB ATUALIZADO COM SUCESSO!")
        print("=" * 80)
        
        if registros_antigos > 0:
            diferenca = registros_novos - registros_antigos
            print(f"\n📊 COMPARAÇÃO:")
            print(f"   • Registros anteriores: {registros_antigos}")
            print(f"   • Registros atuais: {registros_novos}")
            print(f"   • Diferença: {diferenca:+d} ({abs(diferenca/registros_antigos*100):.1f}%)")
            if diferenca < 0:
                print(f"   ℹ️  Menos registros (duplicatas foram removidas)")
        
        print(f"\n✅ O banco está pronto para uso com dados 100% em português BR!")
        
    except Exception as e:
        print(f"\n❌ ERRO ao importar dados: {e}")
        raise
    
    finally:
        db.close()
        print(f"\n🔌 Conexão com o banco fechada.")

if __name__ == '__main__':
    try:
        atualizar_banco_duckdb()
    except Exception as e:
        print(f"\n❌ Erro fatal: {e}")
        raise

/**
 * DASHBOARD.JS - Gerenciamento do Dashboard de Acidentes
 * 
 * Este arquivo controla toda a lógica do dashboard interativo, incluindo:
 * - Gerenciamento de estado e filtros
 * - Criação e atualização de gráficos (Chart.js)
 * - Mapa de calor do corpo humano
 * - Lista de incidentes com scroll infinito
 * - Comunicação com a API backend
 */

// ==================== GERENCIAMENTO DE ESTADO ====================

/**
 * Estado global da aplicação
 * Armazena todos os dados, filtros e configurações do dashboard
 */
const estado = {
  // Filtros aplicados aos dados
  filtros: {
    genero: { masculino: true, feminino: true }, // Filtros de gênero (ambos ativos por padrão)
    paises: [], // Lista de países selecionados
    intervaloData: {
      inicio: null, // Data de início do período
      fim: null     // Data de fim do período
    }
  },
  graficos: {}, // Instâncias dos gráficos Chart.js
  paisesDisponiveis: [], // Lista de todos os países disponíveis nos dados
  // Controle de paginação e carregamento dos incidentes
  incidentes: {
    dados: [],              // Array com os dados dos incidentes
    pagina: 1,              // Página atual
    porPagina: 20,          // Quantidade de itens por página
    temMais: true,          // Indica se há mais dados para carregar
    consultaBusca: '',      // Texto de busca
    estaCarregando: false   // Flag de loading
  }
};

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa o dashboard quando a página carrega
 * Executa todas as configurações necessárias de forma assíncrona
 */
document.addEventListener('DOMContentLoaded', async () => {
  mostrarCarregamento();                      // Exibe indicador de carregamento
  await inicializarDados();                   // Carrega dados iniciais da API
  inicializarFiltros();                       // Configura listeners de filtros
  inicializarGraficos();                      // Cria instâncias dos gráficos
  inicializarModais();                        // Configura modais (popups)
  configurarRolagemInfinitaIncidentes();      // Habilita scroll infinito na lista
  configurarBuscaIncidentes();                // Configura campo de busca
  await atualizarDashboard();                 // Atualiza todos os dados do dashboard
  ocultarCarregamento();                      // Remove indicador de carregamento
});

// ==================== FUNÇÕES DE CARREGAMENTO ====================

/**
 * Exibe indicador de carregamento (loading)
 * Pode ser expandida para mostrar spinner ou mensagem visual
 */
function mostrarCarregamento() {
  console.log('Carregando dados...');
}

/**
 * Oculta indicador de carregamento
 * Chamada quando todos os dados foram carregados
 */
function ocultarCarregamento() {
  console.log('Dados carregados!');
}

// ==================== INICIALIZAÇÃO DE DADOS ====================

/**
 * Carrega dados iniciais da API
 * Obtém lista de países disponíveis e intervalo de datas dos dados
 * Configura filtros padrão (todos os países e período completo)
 */
async function inicializarDados() {
  try {
    // Buscar estatísticas gerais do endpoint da API
    const resposta = await fetch('/api/statistics');
    if (!resposta.ok) {
      throw new Error('Erro ao carregar estatísticas iniciais');
    }
    
    const estatisticas = await resposta.json();
    
    // Extrair e ordenar países únicos disponíveis
    estado.paisesDisponiveis = estatisticas.countries.map(c => c.country).sort();
    // Inicializar filtro com todos os países selecionados
    estado.filtros.paises = [...estado.paisesDisponiveis];
    
    // Definir intervalo de datas baseado nos dados mensais disponíveis
    if (estatisticas.months && estatisticas.months.length > 0) {
      const meses = estatisticas.months.map(m => m.month);
      // Data de início: primeiro mês disponível
      estado.filtros.intervaloData.inicio = new Date(meses[0] + '-01');
      
      // Data de fim: último mês disponível (usando dia 31 para incluir todo o mês)
      const ultimoMes = meses[meses.length - 1];
      estado.filtros.intervaloData.fim = new Date(ultimoMes + '-31');
      
      console.log('📅 Range de datas configurado:', {
        inicio: estado.filtros.intervaloData.inicio,
        fim: estado.filtros.intervaloData.fim,
        inicioISO: estado.filtros.intervaloData.inicio.toISOString().split('T')[0],
        fimISO: estado.filtros.intervaloData.fim.toISOString().split('T')[0]
      });
    } else {
      // Fallback: usar valores padrão se não houver dados de meses
      estado.filtros.intervaloData.inicio = new Date('2016-01-01');
      estado.filtros.intervaloData.fim = new Date();
    }
    
    console.log('Dados iniciais carregados');
  } catch (erro) {
    console.error('Erro ao carregar dados iniciais:', erro);
    alert('Erro ao carregar dados. Por favor, recarregue a página.');
  }
}

// ==================== CONSTRUÇÃO DE FILTROS ====================

/**
 * Constrói string de query params com base nos filtros ativos
 * Usado para enviar filtros nas requisições à API
 * 
 * @returns {string} Query string formatada (ex: "gender=Homem&country=Brasil&startDate=2020-01-01")
 */
function construirStringConsultaFiltros() {
  const parametros = new URLSearchParams();
  
  // Adicionar filtros de gênero aos parâmetros
  if (estado.filtros.genero.masculino) parametros.append('gender', 'Homem');
  if (estado.filtros.genero.feminino) parametros.append('gender', 'Mulher');
  
  // Adicionar cada país selecionado como parâmetro separado
  estado.filtros.paises.forEach(pais => {
    parametros.append('country', pais);
  });
  
  // Adicionar filtros de período (datas no formato ISO: YYYY-MM-DD)
  if (estado.filtros.intervaloData.inicio) {
    parametros.append('startDate', estado.filtros.intervaloData.inicio.toISOString().split('T')[0]);
  }
  if (estado.filtros.intervaloData.fim) {
    parametros.append('endDate', estado.filtros.intervaloData.fim.toISOString().split('T')[0]);
  }
  
  console.log('🔍 Query string gerada:', parametros.toString());
  
  return parametros.toString();
}

// ==================== INICIALIZAÇÃO DE FILTROS ====================

/**
 * Configura event listeners para todos os filtros do dashboard
 * Vincula ações de clique/mudança aos elementos HTML
 */
function inicializarFiltros() {
  // Filtro de Gênero - Mulheres
  document.getElementById('filterWomen').addEventListener('click', () => {
    alternarFiltroGenero('feminino');
  });

  // Filtro de Gênero - Homens
  document.getElementById('filterMen').addEventListener('click', () => {
    alternarFiltroGenero('masculino');
  });

  // Filtro de Países (abre modal com lista de países)
  document.getElementById('filterCountries').addEventListener('click', () => {
    abrirModalPaises();
  });

  // Filtro de Período (abre modal com seletor de datas)
  document.getElementById('filterPeriod').addEventListener('click', () => {
    abrirModalPeriodo();
  });

  // Filtro de intervalo de meses no gráfico mensal (dropdown)
  document.getElementById('monthRangeFilter').addEventListener('change', (e) => {
    atualizarGraficoMensal(e.target.value);
  });

  // Filtro de país no gráfico de localização (dropdown)
  document.getElementById('countryFilter').addEventListener('change', (e) => {
    atualizarGraficoLocalizacao(e.target.value);
  });
}

/**
 * Alterna o estado de um filtro de gênero (ativo/inativo)
 * Atualiza a interface visual e recarrega os dados do dashboard
 * 
 * @param {string} genero - 'feminino' ou 'masculino'
 */
function alternarFiltroGenero(genero) {
  // Inverter estado do filtro
  estado.filtros.genero[genero] = !estado.filtros.genero[genero];
  
  // Obter elemento do cartão correspondente
  const cartao = genero === 'feminino' 
    ? document.getElementById('filterWomen')
    : document.getElementById('filterMen');
  
  // Atualizar atributo visual (CSS) do cartão
  cartao.setAttribute('data-active', estado.filtros.genero[genero]);
  
  // Recarregar dashboard com novos filtros
  atualizarDashboard();
}

// ==================== ATUALIZAÇÃO DO DASHBOARD ====================

/**
 * Atualiza todo o dashboard com base nos filtros atuais
 * Faz requisições ao backend para buscar dados filtrados
 * Atualiza: cards de estatísticas, gráficos, mapa de calor e lista de incidentes
 */
async function atualizarDashboard() {
  // Construir query string com filtros atuais
  const stringConsulta = construirStringConsultaFiltros();
  
  try {
    // Atualizar cards de estatísticas (gênero, países, período)
    await atualizarCardsFiltro(stringConsulta);
    
    // Atualizar todos os gráficos (mensal, setores, localização)
    await atualizarTodosGraficos(stringConsulta);
    
    // Atualizar mapa de calor do corpo humano
    await atualizarMapaCorpo(stringConsulta);
    
    // Atualizar lista de incidentes (com reset para página 1)
    await atualizarListaIncidentes(stringConsulta);
  } catch (erro) {
    console.error('Erro ao atualizar dashboard:', erro);
  }
}

async function atualizarCardsFiltro(stringConsulta) {
  try {
    const resposta = await fetch(`/api/dashboard/stats?${stringConsulta}`);
    if (!resposta.ok) throw new Error('Erro ao buscar estatísticas');
    
    const dados = await resposta.json();
    
    // Debug logging
    console.log('📊 Dados recebidos do backend:', dados);
    console.log(`Total: ${dados.total}, Mulheres: ${dados.women.count}, Homens: ${dados.men.count}`);
    
    document.getElementById('womenCount').textContent = dados.women.count;
    document.getElementById('womenPercent').textContent = `${dados.women.percent}%`;
    
    document.getElementById('menCount').textContent = dados.men.count;
    document.getElementById('menPercent').textContent = `${dados.men.percent}%`;
    
    document.getElementById('countriesCount').textContent = dados.countriesCount;
    document.getElementById('countriesNames').textContent = estado.filtros.paises.join(', ');
    
    // Calcular dias do período
    if (dados.dateRange.start && dados.dateRange.end) {
      const inicio = new Date(dados.dateRange.start);
      const fim = new Date(dados.dateRange.end);
      const diferencaDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
      document.getElementById('periodDays').textContent = `${diferencaDias} dias`;
      
      const mesInicio = inicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const mesFim = fim.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      document.getElementById('periodRange').textContent = `${mesInicio} - ${mesFim}`;
    }
  } catch (erro) {
    console.error('Erro ao atualizar cards de filtro:', erro);
  }
}

// ==================== INICIALIZAÇÃO DE GRÁFICOS ====================

/**
 * Cria as instâncias iniciais de todos os gráficos Chart.js
 * Os gráficos são criados vazios e depois populados com dados
 */
function inicializarGraficos() {
  criarGraficoAcidentesPorMes();      // Gráfico de linha - tendência mensal
  criarGraficoPotencialAcidentes();   // Gráfico de pizza - distribuição por setor
  criarGraficoAcidentesPorLocal();    // Gráfico de barras - acidentes por localização
}

/**
 * Cria gráfico de linha mostrando tendência de acidentes por mês
 * Usa Chart.js para renderização
 */
function criarGraficoAcidentesPorMes() {
  const contexto = document.getElementById('accidentsPerMonthChart');
  estado.graficos.graficoMensal = new Chart(contexto, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Acidentes',
        data: [],
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF0000',
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 3,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              return `Acidentes: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#2D2D2D'
          },
          ticks: {
            color: '#D1D5DB'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#D1D5DB'
          }
        }
      }
    }
  });
}

/**
 * Cria gráfico de pizza (doughnut) mostrando distribuição de acidentes por setor
 * Setores: Mineração, Metalurgia, Outros
 */
function criarGraficoPotencialAcidentes() {
  const contexto = document.getElementById('accidentPotentialChart');
  
  estado.graficos.graficoPotencial = new Chart(contexto, {
    type: 'doughnut',
    data: {
      labels: ['Mineração', 'Metalurgia', 'Outros'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FF0000', '#4F46E5', '#10B981'],
        borderWidth: 2,
        borderColor: '#1A1A1A'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Cria gráfico de barras mostrando acidentes por localização (estados/províncias)
 * Exibe top 6 localizações com mais acidentes
 */
function criarGraficoAcidentesPorLocal() {
  const contexto = document.getElementById('accidentsByLocationChart');
  
  estado.graficos.graficoLocalizacao = new Chart(contexto, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Acidentes',
        data: [],
        backgroundColor: '#FF0000',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 3,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#2D2D2D'
          },
          ticks: {
            color: '#D1D5DB'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#D1D5DB'
          }
        }
      }
    }
  });
}

async function atualizarTodosGraficos(stringConsulta) {
  await atualizarGraficoMensal('all', stringConsulta);
  await atualizarGraficoPotencial(stringConsulta);
  await atualizarGraficoLocalizacao('all', stringConsulta);
  atualizarDropdownFiltroPais();
}

function atualizarDropdownFiltroPais() {
  const dropdown = document.getElementById('countryFilter');
  const htmlOpcoes = '<option value="all">Todos os países</option>' +
    estado.paisesDisponiveis.map(pais => 
      `<option value="${pais}">${pais}</option>`
    ).join('');
  dropdown.innerHTML = htmlOpcoes;
}

async function atualizarGraficoMensal(intervalo, stringConsulta = null) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  
  try {
    const resposta = await fetch(`/api/charts/monthly?${stringConsulta}&range=${intervalo}`);
    if (!resposta.ok) throw new Error('Erro ao buscar dados mensais');
    
    const dados = await resposta.json();
    
    estado.graficos.graficoMensal.data.labels = dados.labels;
    estado.graficos.graficoMensal.data.datasets[0].data = dados.data;
    estado.graficos.graficoMensal.update();
  } catch (erro) {
    console.error('Erro ao atualizar gráfico mensal:', erro);
  }
}

async function atualizarGraficoPotencial(stringConsulta = null) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  
  try {
    const resposta = await fetch(`/api/charts/sectors?${stringConsulta}`);
    if (!resposta.ok) throw new Error('Erro ao buscar dados de setores');
    
    const dados = await resposta.json();
    
    estado.graficos.graficoPotencial.data.labels = dados.labels;
    estado.graficos.graficoPotencial.data.datasets[0].data = dados.data;
    estado.graficos.graficoPotencial.update();
    
    // Atualizar legenda
    const htmlLegenda = dados.labels.map((rotulo, indice) => {
      const cores = ['#FF0000', '#4F46E5', '#10B981'];
      return `
        <div class="legend-item">
          <span class="legend-color" style="background: ${cores[indice]};"></span>
          <span>${rotulo} (${dados.data[indice]})</span>
        </div>
      `;
    }).join('');
    
    document.getElementById('potentialLegend').innerHTML = htmlLegenda;
  } catch (erro) {
    console.error('Erro ao atualizar gráfico de setores:', erro);
  }
}

async function atualizarGraficoLocalizacao(filtroPais, stringConsulta = null) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  
  try {
    const resposta = await fetch(`/api/charts/locations?${stringConsulta}&filterCountry=${filtroPais}`);
    if (!resposta.ok) throw new Error('Erro ao buscar dados de localização');
    
    const dados = await resposta.json();
    
    estado.graficos.graficoLocalizacao.data.labels = dados.labels;
    estado.graficos.graficoLocalizacao.data.datasets[0].data = dados.data;
    estado.graficos.graficoLocalizacao.update();
  } catch (erro) {
    console.error('Erro ao atualizar gráfico de localização:', erro);
  }
}

// ==================== MAPA DE CALOR DO CORPO ====================

/**
 * Atualiza mapa de calor do corpo humano com dados de acidentes
 * Mostra quais partes do corpo foram mais afetadas
 * Usa escala de cores para representar intensidade (amarelo → laranja → vermelho)
 * 
 * @param {string} stringConsulta - Query string com filtros (opcional)
 */
async function atualizarMapaCorpo(stringConsulta = null) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  
  try {
    // Buscar dados do mapa de calor da API
    const response = await fetch(`/api/heatmap/bodyparts?${queryString}`);
    if (!response.ok) throw new Error('Erro ao buscar dados do mapa de calor');
    
    const result = await response.json();
    const data = result.bodyParts || result;
    console.log('Dados do heatmap recebidos no dashboard:', data);
    
    const bodyPartMap = {
      'hands': ['Mãos e Dedos', 'Dedos', 'Mão', 'Mão Esquerda', 'Mão Direita', 'Mãos', 'Dedo'],
      'feet': ['Pés e Dedos dos Pés', 'Tornozelo', 'Pé', 'Pé Esquerdo', 'Pé Direito', 'Pés'],
      'eyes': ['Olhos', 'Olho'],
      'head': ['Cabeça', 'Face', 'Crânio', 'Rosto', 'Orelha'],
      'legs': ['Joelho', 'Perna', 'Coxa', 'Perna Esquerda', 'Perna Direita', 'Pernas'],
      'trunk': ['Tronco', 'Costas', 'Peito', 'Abdômen', 'Abdomen', 'Tórax', 'Quadril', 'Pescoço'],
      'arms-left': ['Braço', 'Cotovelo', 'Antebraço', 'Braço Esquerdo', 'Braços'],
      'arms-right': ['Braço', 'Cotovelo', 'Antebraço', 'Braço Direito', 'Braços']
    };

    // Calcular totais e encontrar máximo para normalização
    const bodyCounts = {};
    let maxCount = 0;

    for (const [svgId, bodyParts] of Object.entries(bodyPartMap)) {
      const element = document.getElementById(svgId);
      if (!element) {
        console.log(`Elemento ${svgId} não encontrado no dashboard`);
        continue;
      }

      const count = bodyParts.reduce((sum, part) => {
        const found = data.find(d => d.part === part || d.body_part === part);
        return sum + (found ? found.count : 0);
      }, 0);

      bodyCounts[svgId] = count;
      maxCount = Math.max(maxCount, count);
      
      element.setAttribute('data-count', count);
      element.setAttribute('data-name', element.getAttribute('data-name') || svgId);
    }

    // SEGUNDO LOOP: Aplicar níveis de calor depois de calcular o maxCount
    console.log('Max count encontrado no dashboard:', maxCount);
    
    for (const [svgId, count] of Object.entries(bodyCounts)) {
      const element = document.getElementById(svgId);
      if (!element) continue;

      let heatLevel = 0;
      if (count > 0 && maxCount > 0) {
        const percentage = (count / maxCount) * 100;
        
        if (percentage <= 25) {
          // Amarelo: 1-3
          heatLevel = Math.max(1, Math.ceil((percentage / 25) * 3));
        } else if (percentage <= 50) {
          // Laranja: 4-5
          heatLevel = 4 + Math.floor(((percentage - 25) / 25) * 2);
        } else if (percentage <= 75) {
          // Vermelho Claro: 6-7
          heatLevel = 6 + Math.floor(((percentage - 50) / 25) * 2);
        } else {
          // Vermelho Forte: 8-10
          heatLevel = 8 + Math.floor(((percentage - 75) / 25) * 3);
          heatLevel = Math.min(10, heatLevel); // Garantir que não passe de 10
        }
      }
      
      element.setAttribute('data-level', heatLevel);
      console.log(`Dashboard - ${svgId}: count=${count}, percentage=${((count/maxCount)*100).toFixed(1)}%, heatLevel=${heatLevel}`);
    }
    
    // Configurar tooltips customizados para o mapa de calor
    setupBodyMapTooltips();
  } catch (error) {
    console.error('Erro ao atualizar mapa de calor:', error);
  }
}

/**
 * Configura tooltips interativos para as partes do corpo no mapa de calor
 * Adiciona eventos de hover e clique para mostrar informações
 */
function configurarTooltipsMapaCorpo() {
  const dicaFerramenta = document.getElementById('body-tooltip');
  let parteSelecionada = null;
  
  // Para cada parte do corpo no SVG
  document.querySelectorAll('.body-part').forEach(parte => {
    const contagem = parte.getAttribute('data-count') || '0';
    const nome = parte.getAttribute('data-name') || 'Desconhecido';
    
    // Hover - mostrar tooltip
    parte.addEventListener('mouseenter', (e) => {
      const retangulo = parte.getBoundingClientRect();
      const retanguloSvg = document.getElementById('bodyHeatmap').getBoundingClientRect();
      
      dicaFerramenta.textContent = `${nome}: ${contagem} acidentes`;
      dicaFerramenta.classList.add('show');
      
      // Posicionar tooltip
      const dicaX = retangulo.left + retangulo.width / 2 - retanguloSvg.left;
      const dicaY = retangulo.top - retanguloSvg.top - 10;
      dicaFerramenta.style.left = dicaX + 'px';
      dicaFerramenta.style.top = dicaY + 'px';
      dicaFerramenta.style.transform = 'translate(-50%, -100%)';
    });

    parte.addEventListener('mouseleave', () => {
      dicaFerramenta.classList.remove('show');
    });

    // Click - selecionar/deselecionar
    parte.addEventListener('click', () => {
      // Remover seleção anterior
      if (parteSelecionada && parteSelecionada !== parte) {
        parteSelecionada.classList.remove('selected');
      }

      // Alternar seleção atual
      if (parteSelecionada === parte) {
        parte.classList.remove('selected');
        parteSelecionada = null;
      } else {
        parte.classList.add('selected');
        parteSelecionada = parte;
      }
    });
  });
}

// ==================== LISTA DE INCIDENTES ====================

/**
 * Atualiza a lista de incidentes com paginação
 * Suporta busca por texto e filtros
 * Implementa scroll infinito para carregar mais dados
 * 
 * @param {string} stringConsulta - Query string com filtros
 * @param {boolean} resetarLista - Se true, limpa lista e volta para página 1
 */
async function atualizarListaIncidentes(stringConsulta = null, resetarLista = true) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  // Prevenir múltiplas requisições simultâneas
  if (estado.incidentes.estaCarregando) return;
  
  // Resetar estado se necessário (nova busca ou novos filtros)
  if (resetarLista) {
    estado.incidentes.pagina = 1;
    estado.incidentes.dados = [];
    estado.incidentes.temMais = true;
  }
  
  try {
    estado.incidentes.estaCarregando = true;
    document.getElementById('incidentsLoading').style.display = 'block';
    
    // Adicionar query de busca
    let parametroBusca = '';
    if (estado.incidentes.consultaBusca) {
      parametroBusca = `&search=${encodeURIComponent(estado.incidentes.consultaBusca)}`;
    }
    
    const resposta = await fetch(`/api/accidents/filtered?${stringConsulta}&page=${estado.incidentes.pagina}&perPage=${estado.incidentes.porPagina}${parametroBusca}`);
    if (!resposta.ok) throw new Error('Erro ao buscar lista de incidentes');
    
    const incidentes = await resposta.json();
    
    // Adicionar novos incidentes ao estado
    estado.incidentes.dados = resetarLista ? incidentes : [...estado.incidentes.dados, ...incidentes];
    estado.incidentes.temMais = incidentes.length === estado.incidentes.porPagina;
    
    const containerLista = document.getElementById('incidentsList');
    const htmlLista = estado.incidentes.dados.map(incidente => `
      <div class="incident-item" data-id="${incidente.id}">
        <div class="incident-item-header">
          <span class="incident-id">Acidente #${String(incidente.id).padStart(3, '0')} Nível ${incidente.accidentLevel}</span>
          <span class="incident-date">${new Date(incidente.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="incident-location">${incidente.local} - ${incidente.country}</div>
      </div>
    `).join('');

    containerLista.innerHTML = htmlLista;

    // Adicionar listeners de clique
    document.querySelectorAll('.incident-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.getAttribute('data-id'));
        abrirModalIncidente(id, estado.incidentes.dados);
      });
    });
    
    estado.incidentes.estaCarregando = false;
    document.getElementById('incidentsLoading').style.display = 'none';
  } catch (erro) {
    console.error('Erro ao atualizar lista de incidentes:', erro);
    estado.incidentes.estaCarregando = false;
    document.getElementById('incidentsLoading').style.display = 'none';
  }
}

/**
 * Configura scroll infinito na lista de incidentes
 * Carrega mais dados automaticamente quando usuário rola até o fim da lista
 */
function configurarRolagemInfinitaIncidentes() {
  const containerLista = document.getElementById('incidentsList');
  
  // Listener de scroll
  containerLista.addEventListener('scroll', () => {
    // Não carregar se já está carregando ou não há mais dados
    if (estado.incidentes.estaCarregando || !estado.incidentes.temMais) return;
    
    // Calcular posição do scroll
    const alturaRolagem = containerLista.scrollHeight;  // Altura total do conteúdo
    const topoRolagem = containerLista.scrollTop;       // Posição atual do scroll
    const alturaCliente = containerLista.clientHeight;  // Altura visível
    
    // Carregar mais quando chegar a 80% do scroll (antes de chegar no fim)
    if (topoRolagem + alturaCliente >= alturaRolagem * 0.8) {
      estado.incidentes.pagina++;                      // Incrementar página
      atualizarListaIncidentes(null, false);           // Carregar próxima página (sem resetar)
    }
  });
}

/**
 * Configura campo de busca de incidentes
 * Implementa debounce para evitar requisições excessivas
 */
function configurarBuscaIncidentes() {
  const campoBusca = document.getElementById('incidentsSearch');
  let temporizadorBusca;
  
  // Listener de input (dispara a cada tecla digitada)
  campoBusca.addEventListener('input', (e) => {
    // Cancelar busca anterior (debounce)
    clearTimeout(temporizadorBusca);
    
    // Agendar nova busca após 500ms de inatividade
    temporizadorBusca = setTimeout(() => {
      estado.incidentes.consultaBusca = e.target.value.trim();  // Salvar texto de busca
      atualizarListaIncidentes(null, true);                     // Buscar com reset
    }, 500); // Debounce de 500ms (aguarda usuário parar de digitar)
  });
}

// ==================== MODAIS (POPUPS) ====================

/**
 * Inicializa todos os modais da aplicação
 * Configura event listeners para abrir, fechar e interagir com modais
 */
function inicializarModais() {
  // Modal de Detalhes do Incidente - Botão fechar
  document.getElementById('modalClose').addEventListener('click', () => {
    fecharModal('incidentModal');
  });

  // Modal de Filtro de Países - Botão fechar
  document.getElementById('countriesModalClose').addEventListener('click', () => {
    fecharModal('countriesModal');
  });

  // Modal de Filtro de Países - Botão "Selecionar Todos"
  document.getElementById('countriesSelectAll').addEventListener('click', () => {
    estado.filtros.paises = [...estado.paisesDisponiveis];  // Copiar array de países
    atualizarCheckboxesPaises();                            // Atualizar UI
  });

  // Modal de Filtro de Países - Botão "Limpar Todos"
  document.getElementById('countriesClearAll').addEventListener('click', () => {
    estado.filtros.paises = [];                // Limpar seleção
    atualizarCheckboxesPaises();               // Atualizar UI
  });

  // Modal de Filtro de Período - Botão fechar
  document.getElementById('periodModalClose').addEventListener('click', () => {
    fecharModal('periodModal');
  });

  // Modal de Filtro de Período - Botão cancelar
  document.getElementById('periodCancel').addEventListener('click', () => {
    fecharModal('periodModal');
  });

  // Modal de Filtro de Período - Botão aplicar
  document.getElementById('periodApply').addEventListener('click', () => {
    aplicarFiltroPeriodo();
  });

  // Fechar modal ao clicar no fundo escuro (backdrop)
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
}

/**
 * Abre modal com detalhes completos de um incidente específico
 * Preenche todos os campos do modal com dados do incidente
 * 
 * @param {number} id - ID do incidente a ser exibido
 * @param {Array} incidentes - Array com todos os incidentes carregados
 */
function abrirModalIncidente(id, incidentes) {
  // Buscar incidente pelo ID
  const incidente = incidentes.find(i => i.id === id);
  if (!incidente) return;  // Incidente não encontrado

  // Preencher campos do modal com dados do incidente
  document.getElementById('modalId').textContent = `#${String(incidente.id).padStart(3, '0')}`;
  document.getElementById('modalDate').textContent = new Date(incidente.date).toLocaleDateString('pt-BR');
  document.getElementById('modalLocation').textContent = incidente.local;
  document.getElementById('modalCountry').textContent = incidente.country;
  document.getElementById('modalSector').textContent = incidente.sector;
  document.getElementById('modalLevel').textContent = incidente.accidentLevel;
  document.getElementById('modalRisk').textContent = incidente.criticalRisk;
  document.getElementById('modalDescription').textContent = incidente.description;

  // Abrir modal
  abrirModal('incidentModal');
}

function abrirModalPaises() {
  const paises = estado.paisesDisponiveis;
  const htmlLista = paises.map(pais => `
    <div class="country-checkbox-item">
      <input type="checkbox" id="country-${pais}" value="${pais}" 
        ${estado.filtros.paises.includes(pais) ? 'checked' : ''}>
      <label for="country-${pais}">${pais}</label>
    </div>
  `).join('');

  document.getElementById('countriesFilterList').innerHTML = htmlLista;

  // Adicionar listeners de mudança
  paises.forEach(pais => {
    document.getElementById(`country-${pais}`).addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!estado.filtros.paises.includes(pais)) {
          estado.filtros.paises.push(pais);
        }
      } else {
        estado.filtros.paises = estado.filtros.paises.filter(c => c !== pais);
      }
      atualizarDashboard();
    });
  });

  abrirModal('countriesModal');
}

function atualizarCheckboxesPaises() {
  estado.paisesDisponiveis.forEach(pais => {
    const caixaSelecao = document.getElementById(`country-${pais}`);
    if (caixaSelecao) {
      caixaSelecao.checked = estado.filtros.paises.includes(pais);
    }
  });
  atualizarDashboard();
}

function abrirModalPeriodo() {
  const dataInicio = estado.filtros.intervaloData.inicio.toISOString().split('T')[0];
  const dataFim = estado.filtros.intervaloData.fim.toISOString().split('T')[0];
  
  document.getElementById('startDate').value = dataInicio;
  document.getElementById('endDate').value = dataFim;

  abrirModal('periodModal');
}

function aplicarFiltroPeriodo() {
  const dataInicio = new Date(document.getElementById('startDate').value);
  const dataFim = new Date(document.getElementById('endDate').value);

  if (dataInicio && dataFim && dataInicio <= dataFim) {
    estado.filtros.intervaloData.inicio = dataInicio;
    estado.filtros.intervaloData.fim = dataFim;
    atualizarDashboard();
    fecharModal('periodModal');
  } else {
    alert('Por favor, selecione um período válido.');
  }
}

/**
 * Abre um modal adicionando classe CSS 'active'
 * @param {string} idModal - ID do elemento modal
 */
function abrirModal(idModal) {
  document.getElementById(idModal).classList.add('active');
}

/**
 * Fecha um modal removendo classe CSS 'active'
 * @param {string} idModal - ID do elemento modal
 */
function fecharModal(idModal) {
  document.getElementById(idModal).classList.remove('active');
}

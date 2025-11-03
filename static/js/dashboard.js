// Gerenciamento de Estado
const estado = {
  filtros: {
    genero: { masculino: true, feminino: true },
    paises: [],
    intervaloData: {
      inicio: null,
      fim: null
    }
  },
  graficos: {},
  paisesDisponiveis: [],
  incidentes: {
    dados: [],
    pagina: 1,
    porPagina: 20,
    temMais: true,
    consultaBusca: '',
    estaCarregando: false
  }
};

// Inicializar Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  mostrarCarregamento();
  await inicializarDados();
  inicializarFiltros();
  inicializarGraficos();
  inicializarModais();
  configurarRolagemInfinitaIncidentes();
  configurarBuscaIncidentes();
  await atualizarDashboard();
  ocultarCarregamento();
});

// Funções de Carregamento
function mostrarCarregamento() {
  console.log('Carregando dados...');
}

function ocultarCarregamento() {
  console.log('Dados carregados!');
}

// Inicializar Dados
async function inicializarDados() {
  try {
    // Buscar países disponíveis e range de datas do endpoint de estatísticas
    const resposta = await fetch('/api/statistics');
    if (!resposta.ok) {
      throw new Error('Erro ao carregar estatísticas iniciais');
    }
    
    const estatisticas = await resposta.json();
    
    // Extrair países únicos
    estado.paisesDisponiveis = estatisticas.countries.map(c => c.country).sort();
    estado.filtros.paises = [...estado.paisesDisponiveis];
    
    // Definir range de datas baseado nos dados de meses
    if (estatisticas.months && estatisticas.months.length > 0) {
      const meses = estatisticas.months.map(m => m.month);
      estado.filtros.intervaloData.inicio = new Date(meses[0] + '-01');
      
      // Pegar a data máxima real do banco ao invés de calcular o último dia do mês
      const ultimoMes = meses[meses.length - 1];
      estado.filtros.intervaloData.fim = new Date(ultimoMes + '-31'); // Usar dia 31 para garantir incluir todo o mês
      
      console.log('📅 Range de datas configurado:', {
        inicio: estado.filtros.intervaloData.inicio,
        fim: estado.filtros.intervaloData.fim,
        inicioISO: estado.filtros.intervaloData.inicio.toISOString().split('T')[0],
        fimISO: estado.filtros.intervaloData.fim.toISOString().split('T')[0]
      });
    } else {
      // Fallback
      estado.filtros.intervaloData.inicio = new Date('2016-01-01');
      estado.filtros.intervaloData.fim = new Date();
    }
    
    console.log('Dados iniciais carregados');
  } catch (erro) {
    console.error('Erro ao carregar dados iniciais:', erro);
    alert('Erro ao carregar dados. Por favor, recarregue a página.');
  }
}

// Construir String de Consulta de Filtros
function construirStringConsultaFiltros() {
  const parametros = new URLSearchParams();
  
  // Adicionar filtros de gênero
  if (estado.filtros.genero.masculino) parametros.append('gender', 'Homem');
  if (estado.filtros.genero.feminino) parametros.append('gender', 'Mulher');
  
  // Adicionar filtros de países
  estado.filtros.paises.forEach(pais => {
    parametros.append('country', pais);
  });
  
  // Adicionar filtros de data
  if (estado.filtros.intervaloData.inicio) {
    parametros.append('startDate', estado.filtros.intervaloData.inicio.toISOString().split('T')[0]);
  }
  if (estado.filtros.intervaloData.fim) {
    parametros.append('endDate', estado.filtros.intervaloData.fim.toISOString().split('T')[0]);
  }
  
  console.log('🔍 Query string gerada:', parametros.toString());
  
  return parametros.toString();
}

// Filter Functions
function inicializarFiltros() {
  // Filtros de Gênero
  document.getElementById('filterWomen').addEventListener('click', () => {
    alternarFiltroGenero('feminino');
  });

  document.getElementById('filterMen').addEventListener('click', () => {
    alternarFiltroGenero('masculino');
  });

  // Filtro de Países
  document.getElementById('filterCountries').addEventListener('click', () => {
    abrirModalPaises();
  });

  // Filtro de Período
  document.getElementById('filterPeriod').addEventListener('click', () => {
    abrirModalPeriodo();
  });

  // Filtros de Gráficos
  document.getElementById('monthRangeFilter').addEventListener('change', (e) => {
    atualizarGraficoMensal(e.target.value);
  });

  document.getElementById('countryFilter').addEventListener('change', (e) => {
    atualizarGraficoLocalizacao(e.target.value);
  });
}

function alternarFiltroGenero(genero) {
  estado.filtros.genero[genero] = !estado.filtros.genero[genero];
  
  const cartao = genero === 'feminino' 
    ? document.getElementById('filterWomen')
    : document.getElementById('filterMen');
  
  cartao.setAttribute('data-active', estado.filtros.genero[genero]);
  atualizarDashboard();
}

// Atualizar Dashboard - Agora faz requisições ao backend
async function atualizarDashboard() {
  const stringConsulta = construirStringConsultaFiltros();
  
  try {
    // Atualizar cards de filtro
    await atualizarCardsFiltro(stringConsulta);
    
    // Atualizar todos os gráficos
    await atualizarTodosGraficos(stringConsulta);
    
    // Atualizar mapa de calor
    await atualizarMapaCorpo(stringConsulta);
    
    // Atualizar lista de incidentes
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

// Inicialização de Gráficos
function inicializarGraficos() {
  criarGraficoAcidentesPorMes();
  criarGraficoPotencialAcidentes();
  criarGraficoAcidentesPorLocal();
}

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

// Mapa do Corpo
async function atualizarMapaCorpo(stringConsulta = null) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  
  try {
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

// Configurar tooltips para o mapa de calor
function configurarTooltipsMapaCorpo() {
  const dicaFerramenta = document.getElementById('body-tooltip');
  let parteSelecionada = null;
  
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

// Lista de Incidentes
async function atualizarListaIncidentes(stringConsulta = null, resetarLista = true) {
  if (!stringConsulta) stringConsulta = construirStringConsultaFiltros();
  if (estado.incidentes.estaCarregando) return;
  
  // Resetar estado se necessário
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

// Scroll infinito para incidentes
function configurarRolagemInfinitaIncidentes() {
  const containerLista = document.getElementById('incidentsList');
  
  containerLista.addEventListener('scroll', () => {
    if (estado.incidentes.estaCarregando || !estado.incidentes.temMais) return;
    
    const alturaRolagem = containerLista.scrollHeight;
    const topoRolagem = containerLista.scrollTop;
    const alturaCliente = containerLista.clientHeight;
    
    // Carregar mais quando chegar a 80% do scroll
    if (topoRolagem + alturaCliente >= alturaRolagem * 0.8) {
      estado.incidentes.pagina++;
      atualizarListaIncidentes(null, false);
    }
  });
}

// Busca de incidentes
function configurarBuscaIncidentes() {
  const campoBusca = document.getElementById('incidentsSearch');
  let temporizadorBusca;
  
  campoBusca.addEventListener('input', (e) => {
    clearTimeout(temporizadorBusca);
    temporizadorBusca = setTimeout(() => {
      estado.incidentes.consultaBusca = e.target.value.trim();
      atualizarListaIncidentes(null, true);
    }, 500); // Debounce de 500ms
  });
}

// Funções de Modais
function inicializarModais() {
  // Modal de Incidente
  document.getElementById('modalClose').addEventListener('click', () => {
    fecharModal('incidentModal');
  });

  // Modal de Países
  document.getElementById('countriesModalClose').addEventListener('click', () => {
    fecharModal('countriesModal');
  });

  document.getElementById('countriesSelectAll').addEventListener('click', () => {
    estado.filtros.paises = [...estado.paisesDisponiveis];
    atualizarCheckboxesPaises();
  });

  document.getElementById('countriesClearAll').addEventListener('click', () => {
    estado.filtros.paises = [];
    atualizarCheckboxesPaises();
  });

  // Modal de Período
  document.getElementById('periodModalClose').addEventListener('click', () => {
    fecharModal('periodModal');
  });

  document.getElementById('periodCancel').addEventListener('click', () => {
    fecharModal('periodModal');
  });

  document.getElementById('periodApply').addEventListener('click', () => {
    aplicarFiltroPeriodo();
  });

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
}

function abrirModalIncidente(id, incidentes) {
  const incidente = incidentes.find(i => i.id === id);
  if (!incidente) return;

  document.getElementById('modalId').textContent = `#${String(incidente.id).padStart(3, '0')}`;
  document.getElementById('modalDate').textContent = new Date(incidente.date).toLocaleDateString('pt-BR');
  document.getElementById('modalLocation').textContent = incidente.local;
  document.getElementById('modalCountry').textContent = incidente.country;
  document.getElementById('modalSector').textContent = incidente.sector;
  document.getElementById('modalLevel').textContent = incidente.accidentLevel;
  document.getElementById('modalRisk').textContent = incidente.criticalRisk;
  document.getElementById('modalDescription').textContent = incidente.description;

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

function abrirModal(idModal) {
  document.getElementById(idModal).classList.add('active');
}

function fecharModal(idModal) {
  document.getElementById(idModal).classList.remove('active');
}

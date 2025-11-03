// Armazenamento global de dados
let dadosGlobais = null;

// Inicializar página inicial
document.addEventListener('DOMContentLoaded', async () => {
  await carregarDados();
  inicializarGraficos();
  inicializarMapaCalorCorpo();
  configurarFiltroGenero();
  configurarTooltipsContexto();
  await carregarProximasAcoes();
});

// Carregar dados da API
async function carregarDados() {
  try {
    const resposta = await fetch('/api/statistics');
    if (!resposta.ok) throw new Error('Erro ao carregar estatísticas');
    
    dadosGlobais = await resposta.json();
    
    // Atualizar todas as seções
    atualizarSecaoHeroi(dadosGlobais);
    atualizarCardsContexto(dadosGlobais);
    await atualizarContadoresSeguranca();
    
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
  }
}

function atualizarSecaoHeroi(dados) {
  // Calcular total de acidentes
  const total = dados.gender.reduce((soma, g) => soma + g.count, 0);
  
  // Atualizar título e subtítulo do herói
  document.getElementById('totalAccidents').textContent = `${total} acidentes`;
  document.getElementById('heroSubtitle').textContent = `${total} histórias. 1 missão.`;
}

function atualizarCardsContexto(dados) {
  // Calcular total para percentuais
  const total = dados.gender.reduce((soma, g) => soma + g.count, 0);
  
  // Atualizar operações globais por país
  if (dados.countries && dados.countries.length > 0) {
    // Brasil
    const dadosBrasil = dados.countries.find(c => c.country === 'Brasil' || c.country === 'Brazil');
    if (dadosBrasil && document.getElementById('brIncidents')) {
      document.getElementById('brIncidents').textContent = dadosBrasil.count;
    }
    
    // EUA
    const dadosEUA = dados.countries.find(c => c.country === 'EUA' || c.country === 'USA' || c.country === 'United States');
    if (dadosEUA && document.getElementById('usIncidents')) {
      document.getElementById('usIncidents').textContent = dadosEUA.count;
    }
    
    // Canadá
    const dadosCanada = dados.countries.find(c => c.country === 'Canadá' || c.country === 'Canada');
    if (dadosCanada && document.getElementById('caIncidents')) {
      document.getElementById('caIncidents').textContent = dadosCanada.count;
    }
  }
  
  // Contagem de mulheres (se existir)
  const dadosMulheres = dados.gender.find(g => g.gender === 'Mulher') || { count: 0 };
  const percentualMulheres = total > 0 ? (dadosMulheres.count / total * 100).toFixed(1) : 0;
  if (document.getElementById('womenCount')) {
    document.getElementById('womenCount').textContent = dadosMulheres.count;
    document.getElementById('womenPercent').textContent = `${percentualMulheres}%`;
    // Atualizar tooltip
    const tooltipPercentualMulheres = document.getElementById('womenPercentTooltip');
    if (tooltipPercentualMulheres) {
      tooltipPercentualMulheres.textContent = `${percentualMulheres}%`;
    }
  }
  
  // Contagem de homens (se existir)
  const dadosHomens = dados.gender.find(g => g.gender === 'Homem') || { count: 0 };
  const percentualHomens = total > 0 ? (dadosHomens.count / total * 100).toFixed(1) : 0;
  if (document.getElementById('menCount')) {
    document.getElementById('menCount').textContent = dadosHomens.count;
    document.getElementById('menPercent').textContent = `${percentualHomens}%`;
    // Atualizar tooltip
    const tooltipPercentualHomens = document.getElementById('menPercentTooltip');
    if (tooltipPercentualHomens) {
      tooltipPercentualHomens.textContent = `${percentualHomens}%`;
    }
  }
  
  // Países (se existir)
  if (document.getElementById('countriesCount')) {
    document.getElementById('countriesCount').textContent = dados.countries.length;
    const nomesPaises = dados.countries.map(c => c.country).slice(0, 3).join(', ');
    document.getElementById('countriesNames').textContent = nomesPaises;
  }
  
  // Período (se existir)
  if (dados.months && dados.months.length > 0) {
    const meses = dados.months.map(m => m.month);
    const dataInicio = new Date(meses[0] + '-01');
    const dataFim = new Date(meses[meses.length - 1] + '-01');
    
    // Calcular dias
    const diferencaDias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
    if (document.getElementById('periodDays')) {
      document.getElementById('periodDays').textContent = `${diferencaDias} dias`;
      // Atualizar tooltip
      const tooltipDiasPeriodo = document.getElementById('periodDaysTooltip');
      if (tooltipDiasPeriodo) {
        tooltipDiasPeriodo.textContent = `${diferencaDias} dias`;
      }
    }
    
    // Formatar datas
    const mesInicio = dataInicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    const mesFim = dataFim.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    if (document.getElementById('periodRange')) {
      document.getElementById('periodRange').textContent = `${mesInicio.charAt(0).toUpperCase() + mesInicio.slice(1)} - ${mesFim.charAt(0).toUpperCase() + mesFim.slice(1)}`;
    }
    
    // Atualizar última atualização
    const hoje = new Date();
    const diasAtras = Math.ceil((hoje - dataFim) / (1000 * 60 * 60 * 24));
    if (document.getElementById('lastUpdate')) {
      document.getElementById('lastUpdate').textContent = `Última atualização: ${diasAtras} dias atrás`;
    }
  }
}

// Atualizar estatísticas do herói
async function atualizarContadoresSeguranca() {
  try {
    const resposta = await fetch('/api/safety-record');
    if (!resposta.ok) {
      throw new Error('Erro ao carregar dados de segurança');
    }
    
    const dados = await resposta.json();
    const diasAtuais = dados.currentDaysSinceLast;
    const diasRecorde = dados.recordDays;
    
    document.getElementById('daysSinceAccident').textContent = diasAtuais;
    document.getElementById('recordDays').textContent = diasRecorde;
    
    const progresso = diasRecorde > 0 ? (diasAtuais / diasRecorde) * 100 : 0;
    const diasParaRecorde = Math.max(0, diasRecorde - diasAtuais);
    
    // Se já bateu o recorde, mostrar como 100%
    if (diasAtuais >= diasRecorde) {
      document.getElementById('progressPercent').textContent = '100%';
      document.getElementById('progressFill').style.width = '100%';
      const excesso = diasAtuais - diasRecorde;
      document.getElementById('daysToRecord').textContent = excesso;
      
      const elementoMensagem = document.querySelector('.safety-card:nth-child(2) .safety-message');
      if (elementoMensagem) {
        elementoMensagem.textContent = `Parabéns! Você bateu o recorde por ${excesso} dias!`;
      }
    } else {
      document.getElementById('progressPercent').textContent = `${Math.round(progresso)}%`;
      document.getElementById('progressFill').style.width = `${progresso}%`;
      document.getElementById('daysToRecord').textContent = diasParaRecorde;
    }
  } catch (erro) {
    console.error('Erro ao atualizar contadores de segurança:', erro);
  }
}

// Mapeamento de partes do corpo
const mapeamentoPartesCorpo = {
  'Face': 'face',
  'Rosto': 'face',
  'Pescoço': 'neck',
  'Tronco': 'trunk',
  'Peito': 'trunk',
  'Costas': 'trunk',
  'Abdomen': 'trunk',
  'Braço Esquerdo': 'left-arm',
  'Braço Direito': 'right-arm',
  'Braço': 'right-arm',
  'Mão Esquerda': 'left-hand',
  'Mão Direita': 'right-hand',
  'Mãos': 'left-hand', // Também atualizará right-hand
  'Perna Esquerda': 'left-leg',
  'Perna Direita': 'right-leg',
  'Perna': 'right-leg',
  'Pé Esquerdo': 'left-foot',
  'Pé Direito': 'right-foot',
  'Pés': 'left-foot' // Também atualizará right-foot
};

// Inicializar mapa de calor do corpo
function inicializarMapaCalorCorpo(filtroGenero = 'all') {
  const dicaFerramenta = document.getElementById('body-tooltip');
  let parteSelecionada = null;

  // Construir URL com filtro de gênero
  let url = '/api/heatmap/bodyparts';
  if (filtroGenero !== 'all') {
    const parametroGenero = filtroGenero === 'male' ? 'Homem' : 'Mulher';
    url += `?gender=${encodeURIComponent(parametroGenero)}`;
  }

  console.log('Buscando dados com filtro:', filtroGenero, 'URL:', url);

  fetch(url)
    .then(resposta => resposta.json())
    .then(resultado => {
      const dados = resultado.bodyParts || resultado;
      console.log('Dados do heatmap recebidos:', dados);
      
      const mapaPartesCorpo = {
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
      const contagensCorpo = {};
      let contagemMaxima = 0;

      for (const [idSvg, partesCorpo] of Object.entries(mapaPartesCorpo)) {
        const elemento = document.getElementById(idSvg);
        if (!elemento) {
          console.log(`Elemento ${idSvg} não encontrado`);
          continue;
        }

        const contagem = partesCorpo.reduce((soma, parte) => {
          const encontrado = dados.find(d => d.part === parte || d.body_part === parte);
          return soma + (encontrado ? encontrado.count : 0);
        }, 0);

        contagensCorpo[idSvg] = contagem;
        contagemMaxima = Math.max(contagemMaxima, contagem);
        
        elemento.setAttribute('data-count', contagem);
        elemento.setAttribute('data-name', elemento.getAttribute('data-name') || idSvg);
      }

      // Calcular níveis de calor após ter a contagemMaxima
      // 0: sem dados (cinza)
      // 1-3: Amarelo (1-25%) - Mínimo
      // 4-5: Laranja (26-50%) - Baixo
      // 6-7: Vermelho Claro (51-75%) - Médio
      // 8-10: Vermelho Forte (76-100%) - Alto
      for (const [idSvg, contagem] of Object.entries(contagensCorpo)) {
        const elemento = document.getElementById(idSvg);
        if (!elemento) continue;

        let nivelCalor = 0;
        if (contagem > 0 && contagemMaxima > 0) {
          const percentual = (contagem / contagemMaxima) * 100;
          
          if (percentual <= 25) {
            // Amarelo: 1-3
            nivelCalor = Math.max(1, Math.ceil((percentual / 25) * 3));
          } else if (percentual <= 50) {
            // Laranja: 4-5
            nivelCalor = 4 + Math.floor(((percentual - 25) / 25) * 2);
          } else if (percentual <= 75) {
            // Vermelho Claro: 6-7
            nivelCalor = 6 + Math.floor(((percentual - 50) / 25) * 2);
          } else {
            // Vermelho Forte: 8-10
            nivelCalor = 8 + Math.floor(((percentual - 75) / 25) * 3);
            nivelCalor = Math.min(10, nivelCalor); // Garantir que não passe de 10
          }
        }
        
        elemento.setAttribute('data-level', nivelCalor);
        console.log(`${idSvg}: count=${contagem}, maxCount=${contagemMaxima}, percentage=${((contagem/contagemMaxima)*100).toFixed(1)}%, heatLevel=${nivelCalor}`);
      }

      // Adicionar interatividade a cada parte do corpo
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
          const tooltipX = retangulo.left + retangulo.width / 2 - retanguloSvg.left;
          const tooltipY = retangulo.top - retanguloSvg.top - 10;
          dicaFerramenta.style.left = tooltipX + 'px';
          dicaFerramenta.style.top = tooltipY + 'px';
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

      // Atualizar os cards de estatísticas
      const totalLesoes = Object.values(contagensCorpo).reduce((soma, contagem) => soma + contagem, 0);
      console.log('Total de lesões:', totalLesoes);
      console.log('Contagens por parte:', contagensCorpo);
      
      // Mãos
      const contagemMaos = contagensCorpo['hands'] || 0;
      const percentualMaos = totalLesoes > 0 ? ((contagemMaos / totalLesoes) * 100).toFixed(0) : 0;
      const elementoContagemMaos = document.querySelector('.injury-stat-card.critical .stat-number');
      const elementoPercentualMaos = document.querySelector('.injury-stat-card.critical .stat-percent');
      const elementoPreenchimentoMaos = document.querySelector('.injury-stat-card.critical .injury-stat-fill');
      
      if (elementoContagemMaos) elementoContagemMaos.textContent = contagemMaos;
      if (elementoPercentualMaos) elementoPercentualMaos.textContent = `${percentualMaos}%`;
      if (elementoPreenchimentoMaos) elementoPreenchimentoMaos.style.width = `${percentualMaos}%`;

      // Pés
      const contagemPes = contagensCorpo['feet'] || 0;
      const percentualPes = totalLesoes > 0 ? ((contagemPes / totalLesoes) * 100).toFixed(0) : 0;
      const elementoContagemPes = document.querySelector('.injury-stat-card.medium .stat-number');
      const elementoPercentualPes = document.querySelector('.injury-stat-card.medium .stat-percent');
      const elementoPreenchimentoPes = document.querySelector('.injury-stat-card.medium .injury-stat-fill');
      
      if (elementoContagemPes) elementoContagemPes.textContent = contagemPes;
      if (elementoPercentualPes) elementoPercentualPes.textContent = `${percentualPes}%`;
      if (elementoPreenchimentoPes) elementoPreenchimentoPes.style.width = `${percentualPes}%`;

      // Olhos
      const contagemOlhos = contagensCorpo['eyes'] || 0;
      const percentualOlhos = totalLesoes > 0 ? ((contagemOlhos / totalLesoes) * 100).toFixed(0) : 0;
      const elementoContagemOlhos = document.querySelector('.injury-stat-card.low .stat-number');
      const elementoPercentualOlhos = document.querySelector('.injury-stat-card.low .stat-percent');
      const elementoPreenchimentoOlhos = document.querySelector('.injury-stat-card.low .injury-stat-fill');
      
      if (elementoContagemOlhos) elementoContagemOlhos.textContent = contagemOlhos;
      if (elementoPercentualOlhos) elementoPercentualOlhos.textContent = `${percentualOlhos}%`;
      if (elementoPreenchimentoOlhos) elementoPreenchimentoOlhos.style.width = `${percentualOlhos}%`;
    })
    .catch(erro => console.error('Erro ao carregar dados do heatmap:', erro));
}

// Configurar botões de filtro de gênero
function configurarFiltroGenero() {
  const botoesFiltro = document.querySelectorAll('.filter-btn');
  
  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      // Remover classe active de todos os botões
      botoesFiltro.forEach(btn => btn.classList.remove('active'));
      
      // Adicionar classe active ao botão clicado
      botao.classList.add('active');
      
      // Obter gênero selecionado
      const genero = botao.getAttribute('data-gender');
      
      // Recarregar heatmap com filtro
      inicializarMapaCalorCorpo(genero);
    });
  });
}

// Configurar tooltips dos cards de contexto para mobile (suporte a toque)
function configurarTooltipsContexto() {
  // Verificar se é dispositivo touch
  const eDispositivoToque = () => {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  };
  
  // Apenas adicionar comportamento de clique em dispositivos touch
  if (!eDispositivoToque()) {
    return; // Em desktop, deixar o CSS hover funcionar naturalmente
  }
  
  const cardsContexto = document.querySelectorAll('.context-card');
  
  cardsContexto.forEach(card => {
    const dicaFerramenta = card.querySelector('.context-tooltip');
    if (!dicaFerramenta) return;
    
    let dicaVisivel = false;
    
    // Para dispositivos touch, alternar o tooltip no toque
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Esconder outros tooltips
      cardsContexto.forEach(outroCard => {
        if (outroCard !== card) {
          const outraDica = outroCard.querySelector('.context-tooltip');
          if (outraDica) {
            outraDica.style.opacity = '0';
            outraDica.style.visibility = 'hidden';
            outraDica.style.transform = 'translateX(-50%) scale(0.8)';
          }
        }
      });
      
      // Alternar esta tooltip
      dicaVisivel = !dicaVisivel;
      if (dicaVisivel) {
        dicaFerramenta.style.opacity = '1';
        dicaFerramenta.style.visibility = 'visible';
        dicaFerramenta.style.transform = 'translateX(-50%) scale(1)';
      } else {
        dicaFerramenta.style.opacity = '0';
        dicaFerramenta.style.visibility = 'hidden';
        dicaFerramenta.style.transform = 'translateX(-50%) scale(0.8)';
      }
    });
  });
  
  // Fechar tooltips ao tocar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-card')) {
      cardsContexto.forEach(card => {
        const dicaFerramenta = card.querySelector('.context-tooltip');
        if (dicaFerramenta) {
          dicaFerramenta.style.opacity = '0';
          dicaFerramenta.style.visibility = 'hidden';
          dicaFerramenta.style.transform = 'translateX(-50%) scale(0.8)';
        }
      });
    }
  });
}

// Inicializar gráficos
function inicializarGraficos() {
  criarGraficoTendenciaMensal();
  criarGraficoLocalizacao();
}

async function criarGraficoTendenciaMensal() {
  try {
    // Usar a API de estatísticas para obter dados mensais
    if (!dadosGlobais || !dadosGlobais.months) {
      console.error('Dados mensais não disponíveis');
      return;
    }
    
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Processar dados mensais
    const rotulos = dadosGlobais.months.map(m => {
      const [ano, mes] = m.month.split('-');
      return `${nomesMeses[parseInt(mes) - 1]}/${ano}`;
    });
    
    const dados = dadosGlobais.months.map(m => m.count);
    
    // Encontrar mês máximo para insights
    const mesMaximo = dadosGlobais.months.reduce((max, m) => m.count > max.count ? m : max, dadosGlobais.months[0]);
    const [ano, mes] = mesMaximo.month.split('-');
    const nomeMesMaximo = nomesMeses[parseInt(mes) - 1];
    
    const contexto = document.getElementById('monthlyTrendChart');
    new Chart(contexto, {
      type: 'line',
      data: {
        labels: rotulos,
        datasets: [{
          label: 'Acidentes',
          data: dados,
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
              label: function(contexto) {
                return `Acidentes: ${contexto.parsed.y}`;
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
              color: '#D1D5DB',
              font: {
                size: 12
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#D1D5DB',
              font: {
                size: 12
              },
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  } catch (erro) {
    console.error('Erro ao criar gráfico mensal:', erro);
  }
}

async function criarGraficoLocalizacao() {
  try {
    // Usar a API de estatísticas para obter dados de localização
    if (!dadosGlobais || !dadosGlobais.locations) {
      console.error('Dados de localização não disponíveis');
      return;
    }
    
    // Obter top 6 localizações
    const topLocalizacoes = dadosGlobais.locations.slice(0, 6);
    const rotulos = topLocalizacoes.map(l => l.local);
    const dados = topLocalizacoes.map(l => l.count);
    
    // Encontrar localização máxima para insights
    const localizacaoMaxima = topLocalizacoes[0];
    
    const contexto = document.getElementById('locationChart');
    new Chart(contexto, {
      type: 'bar',
      data: {
        labels: rotulos,
        datasets: [{
          label: 'Acidentes',
          data: dados,
          backgroundColor: '#FF0000',
          borderRadius: 8,
          maxBarThickness: 80
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
              label: function(contexto) {
                return `Acidentes: ${contexto.parsed.y}`;
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
              color: '#D1D5DB',
              font: {
                size: 12
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#D1D5DB',
              font: {
                size: 12
              },
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      }
    });
  } catch (erro) {
    console.error('Erro ao criar gráfico de localização:', erro);
  }
}

// Carregar próximas ações da API
async function carregarProximasAcoes() {
  try {
    const resposta = await fetch('/api/next-actions');
    if (!resposta.ok) throw new Error('Erro ao carregar próximas ações');
    
    const acoes = await resposta.json();
    const listaAcoes = document.getElementById('actions-list');
    
    if (!listaAcoes) return;
    
    // Limpar estado de carregamento
    listaAcoes.innerHTML = '';
    
    // Rótulos de prioridade em português
    const rotulosPrioridade = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    
    // Rótulos de status em português
    const rotulosStatus = {
      'in-progress': 'Em andamento',
      'planned': 'Planejado',
      'completed': 'Concluído'
    };
    
    // Gerar cards de ação
    acoes.forEach((acao, indice) => {
      const cardAcao = document.createElement('div');
      cardAcao.className = `action-card ${acao.priority}`;
      cardAcao.style.animationDelay = `${indice * 0.15}s`;
      
      cardAcao.innerHTML = `
        <div class="action-header">
          <div>
            <span class="action-badge ${acao.priority}">${rotulosPrioridade[acao.priority]}</span>
            <span class="action-location">${acao.location}</span>
          </div>
          <span class="action-status ${acao.status}">${rotulosStatus[acao.status]}</span>
        </div>
        <h3>${acao.title}</h3>
        <p class="action-description">${acao.description}</p>
        <div class="action-meta">
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              <path d="M5 21V19C5 16.7909 6.79086 15 9 15H15C17.2091 15 19 16.7909 19 19V21" stroke="currentColor" stroke-width="2" />
            </svg>
            ${acao.responsible}
          </span>
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2" />
            </svg>
            Prazo: ${acao.deadline}
          </span>
        </div>
      `;
      
      listaAcoes.appendChild(cardAcao);
    });
    
  } catch (erro) {
    console.error('Erro ao carregar próximas ações:', erro);
    const listaAcoes = document.getElementById('actions-list');
    if (listaAcoes) {
      listaAcoes.innerHTML = `
        <div class="error-state">
          <p>⚠️ Não foi possível carregar as ações prioritárias</p>
        </div>
      `;
    }
  }
}

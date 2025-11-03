// Global data storage
let globalData = null;

// Initialize home page
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initializeCharts();
  initializeBodyHeatmap();
  setupGenderFilter();
  setupContextTooltips();
  await loadNextActions();
});

// Load data from API
async function loadData() {
  try {
    const response = await fetch('/api/statistics');
    if (!response.ok) throw new Error('Erro ao carregar estatísticas');
    
    globalData = await response.json();
    
    // Update all sections
    updateHeroSection(globalData);
    updateContextCards(globalData);
    await updateSafetyCounters();
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

function updateHeroSection(data) {
  // Calculate total accidents
  const total = data.gender.reduce((sum, g) => sum + g.count, 0);
  
  // Update hero title and subtitle
  document.getElementById('totalAccidents').textContent = `${total} acidentes`;
  document.getElementById('heroSubtitle').textContent = `${total} histórias. 1 missão.`;
}

function updateContextCards(data) {
  // Calculate total for percentages
  const total = data.gender.reduce((sum, g) => sum + g.count, 0);
  
  // Update global operations by country
  if (data.countries && data.countries.length > 0) {
    // Brasil
    const brasilData = data.countries.find(c => c.country === 'Brasil' || c.country === 'Brazil');
    if (brasilData && document.getElementById('brIncidents')) {
      document.getElementById('brIncidents').textContent = brasilData.count;
    }
    
    // EUA
    const usaData = data.countries.find(c => c.country === 'EUA' || c.country === 'USA' || c.country === 'United States');
    if (usaData && document.getElementById('usIncidents')) {
      document.getElementById('usIncidents').textContent = usaData.count;
    }
    
    // Canadá
    const canadaData = data.countries.find(c => c.country === 'Canadá' || c.country === 'Canada');
    if (canadaData && document.getElementById('caIncidents')) {
      document.getElementById('caIncidents').textContent = canadaData.count;
    }
  }
  
  // Women count (if exists)
  const womenData = data.gender.find(g => g.gender === 'Mulher') || { count: 0 };
  const womenPercent = total > 0 ? (womenData.count / total * 100).toFixed(1) : 0;
  if (document.getElementById('womenCount')) {
    document.getElementById('womenCount').textContent = womenData.count;
    document.getElementById('womenPercent').textContent = `${womenPercent}%`;
    // Update tooltip
    const womenPercentTooltip = document.getElementById('womenPercentTooltip');
    if (womenPercentTooltip) {
      womenPercentTooltip.textContent = `${womenPercent}%`;
    }
  }
  
  // Men count (if exists)
  const menData = data.gender.find(g => g.gender === 'Homem') || { count: 0 };
  const menPercent = total > 0 ? (menData.count / total * 100).toFixed(1) : 0;
  if (document.getElementById('menCount')) {
    document.getElementById('menCount').textContent = menData.count;
    document.getElementById('menPercent').textContent = `${menPercent}%`;
    // Update tooltip
    const menPercentTooltip = document.getElementById('menPercentTooltip');
    if (menPercentTooltip) {
      menPercentTooltip.textContent = `${menPercent}%`;
    }
  }
  
  // Countries (if exists)
  if (document.getElementById('countriesCount')) {
    document.getElementById('countriesCount').textContent = data.countries.length;
    const countryNames = data.countries.map(c => c.country).slice(0, 3).join(', ');
    document.getElementById('countriesNames').textContent = countryNames;
  }
  
  // Period (if exists)
  if (data.months && data.months.length > 0) {
    const months = data.months.map(m => m.month);
    const startDate = new Date(months[0] + '-01');
    const endDate = new Date(months[months.length - 1] + '-01');
    
    // Calculate days
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (document.getElementById('periodDays')) {
      document.getElementById('periodDays').textContent = `${daysDiff} dias`;
      // Update tooltip
      const periodDaysTooltip = document.getElementById('periodDaysTooltip');
      if (periodDaysTooltip) {
        periodDaysTooltip.textContent = `${daysDiff} dias`;
      }
    }
    
    // Format dates
    const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    const endMonth = endDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    if (document.getElementById('periodRange')) {
      document.getElementById('periodRange').textContent = `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} - ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)}`;
    }
    
    // Update last update
    const today = new Date();
    const daysAgo = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
    if (document.getElementById('lastUpdate')) {
      document.getElementById('lastUpdate').textContent = `Última atualização: ${daysAgo} dias atrás`;
    }
  }
}

// Update hero stats
async function updateSafetyCounters() {
  try {
    const response = await fetch('/api/safety-record');
    if (!response.ok) {
      throw new Error('Erro ao carregar dados de segurança');
    }
    
    const data = await response.json();
    const currentDays = data.currentDaysSinceLast;
    const recordDays = data.recordDays;
    
    document.getElementById('daysSinceAccident').textContent = currentDays;
    document.getElementById('recordDays').textContent = recordDays;
    
    const progress = recordDays > 0 ? (currentDays / recordDays) * 100 : 0;
    const daysToRecord = Math.max(0, recordDays - currentDays);
    
    // Se já bateu o recorde, mostrar como 100%
    if (currentDays >= recordDays) {
      document.getElementById('progressPercent').textContent = '100%';
      document.getElementById('progressFill').style.width = '100%';
      const excesso = currentDays - recordDays;
      document.getElementById('daysToRecord').textContent = excesso;
      
      const messageEl = document.querySelector('.safety-card:nth-child(2) .safety-message');
      if (messageEl) {
        messageEl.textContent = `Parabéns! Você bateu o recorde por ${excesso} dias!`;
      }
    } else {
      document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
      document.getElementById('progressFill').style.width = `${progress}%`;
      document.getElementById('daysToRecord').textContent = daysToRecord;
    }
  } catch (error) {
    console.error('Erro ao atualizar contadores de segurança:', error);
  }
}

// Body part mapping
const bodyPartMapping = {
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
  'Mãos': 'left-hand', // Will also update right-hand
  'Perna Esquerda': 'left-leg',
  'Perna Direita': 'right-leg',
  'Perna': 'right-leg',
  'Pé Esquerdo': 'left-foot',
  'Pé Direito': 'right-foot',
  'Pés': 'left-foot' // Will also update right-foot
};

// Initialize body heatmap
function initializeBodyHeatmap(genderFilter = 'all') {
  const tooltip = document.getElementById('body-tooltip');
  let selectedPart = null;

  // Construir URL com filtro de gênero
  let url = '/api/heatmap/bodyparts';
  if (genderFilter !== 'all') {
    const genderParam = genderFilter === 'male' ? 'Homem' : 'Mulher';
    url += `?gender=${encodeURIComponent(genderParam)}`;
  }

  console.log('Buscando dados com filtro:', genderFilter, 'URL:', url);

  fetch(url)
    .then(response => response.json())
    .then(result => {
      const data = result.bodyParts || result;
      console.log('Dados do heatmap recebidos:', data);
      
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
          console.log(`Elemento ${svgId} não encontrado`);
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

      // Calcular níveis de calor após ter o maxCount
      // 0: sem dados (cinza)
      // 1-3: Amarelo (1-25%) - Mínimo
      // 4-5: Laranja (26-50%) - Baixo
      // 6-7: Vermelho Claro (51-75%) - Médio
      // 8-10: Vermelho Forte (76-100%) - Alto
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
        console.log(`${svgId}: count=${count}, maxCount=${maxCount}, percentage=${((count/maxCount)*100).toFixed(1)}%, heatLevel=${heatLevel}`);
      }

      // Adicionar interatividade a cada parte do corpo
      document.querySelectorAll('.body-part').forEach(part => {
        const count = part.getAttribute('data-count') || '0';
        const name = part.getAttribute('data-name') || 'Desconhecido';
        
        // Hover - mostrar tooltip
        part.addEventListener('mouseenter', (e) => {
          const rect = part.getBoundingClientRect();
          const svgRect = document.getElementById('bodyHeatmap').getBoundingClientRect();
          
          tooltip.textContent = `${name}: ${count} acidentes`;
          tooltip.classList.add('show');
          
          // Posicionar tooltip
          const tooltipX = rect.left + rect.width / 2 - svgRect.left;
          const tooltipY = rect.top - svgRect.top - 10;
          tooltip.style.left = tooltipX + 'px';
          tooltip.style.top = tooltipY + 'px';
          tooltip.style.transform = 'translate(-50%, -100%)';
        });

        part.addEventListener('mouseleave', () => {
          tooltip.classList.remove('show');
        });

        // Click - selecionar/deselecionar
        part.addEventListener('click', () => {
          // Remover seleção anterior
          if (selectedPart && selectedPart !== part) {
            selectedPart.classList.remove('selected');
          }

          // Alternar seleção atual
          if (selectedPart === part) {
            part.classList.remove('selected');
            selectedPart = null;
          } else {
            part.classList.add('selected');
            selectedPart = part;
          }
        });
      });

      // Atualizar os cards de estatísticas
      const totalInjuries = Object.values(bodyCounts).reduce((sum, count) => sum + count, 0);
      console.log('Total de lesões:', totalInjuries);
      console.log('Contagens por parte:', bodyCounts);
      
      // Mãos
      const handsCount = bodyCounts['hands'] || 0;
      const handsPercent = totalInjuries > 0 ? ((handsCount / totalInjuries) * 100).toFixed(0) : 0;
      const handsCountEl = document.querySelector('.injury-stat-card.critical .stat-number');
      const handsPercentEl = document.querySelector('.injury-stat-card.critical .stat-percent');
      const handsFillEl = document.querySelector('.injury-stat-card.critical .injury-stat-fill');
      
      if (handsCountEl) handsCountEl.textContent = handsCount;
      if (handsPercentEl) handsPercentEl.textContent = `${handsPercent}%`;
      if (handsFillEl) handsFillEl.style.width = `${handsPercent}%`;

      // Pés
      const feetCount = bodyCounts['feet'] || 0;
      const feetPercent = totalInjuries > 0 ? ((feetCount / totalInjuries) * 100).toFixed(0) : 0;
      const feetCountEl = document.querySelector('.injury-stat-card.medium .stat-number');
      const feetPercentEl = document.querySelector('.injury-stat-card.medium .stat-percent');
      const feetFillEl = document.querySelector('.injury-stat-card.medium .injury-stat-fill');
      
      if (feetCountEl) feetCountEl.textContent = feetCount;
      if (feetPercentEl) feetPercentEl.textContent = `${feetPercent}%`;
      if (feetFillEl) feetFillEl.style.width = `${feetPercent}%`;

      // Olhos
      const eyesCount = bodyCounts['eyes'] || 0;
      const eyesPercent = totalInjuries > 0 ? ((eyesCount / totalInjuries) * 100).toFixed(0) : 0;
      const eyesCountEl = document.querySelector('.injury-stat-card.low .stat-number');
      const eyesPercentEl = document.querySelector('.injury-stat-card.low .stat-percent');
      const eyesFillEl = document.querySelector('.injury-stat-card.low .injury-stat-fill');
      
      if (eyesCountEl) eyesCountEl.textContent = eyesCount;
      if (eyesPercentEl) eyesPercentEl.textContent = `${eyesPercent}%`;
      if (eyesFillEl) eyesFillEl.style.width = `${eyesPercent}%`;
    })
    .catch(error => console.error('Erro ao carregar dados do heatmap:', error));
}

// Setup gender filter buttons
function setupGenderFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get selected gender
      const gender = button.getAttribute('data-gender');
      
      // Reload heatmap with filter
      initializeBodyHeatmap(gender);
    });
  });
}

// Setup context card tooltips for mobile (touch support)
function setupContextTooltips() {
  // Verificar se é dispositivo touch
  const isTouchDevice = () => {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  };
  
  // Apenas adicionar comportamento de clique em dispositivos touch
  if (!isTouchDevice()) {
    return; // Em desktop, deixar o CSS hover funcionar naturalmente
  }
  
  const contextCards = document.querySelectorAll('.context-card');
  
  contextCards.forEach(card => {
    const tooltip = card.querySelector('.context-tooltip');
    if (!tooltip) return;
    
    let tooltipVisible = false;
    
    // Para dispositivos touch, toggle o tooltip no toque
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Esconder outros tooltips
      contextCards.forEach(otherCard => {
        if (otherCard !== card) {
          const otherTooltip = otherCard.querySelector('.context-tooltip');
          if (otherTooltip) {
            otherTooltip.style.opacity = '0';
            otherTooltip.style.visibility = 'hidden';
            otherTooltip.style.transform = 'translateX(-50%) scale(0.8)';
          }
        }
      });
      
      // Toggle este tooltip
      tooltipVisible = !tooltipVisible;
      if (tooltipVisible) {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.style.transform = 'translateX(-50%) scale(1)';
      } else {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transform = 'translateX(-50%) scale(0.8)';
      }
    });
  });
  
  // Fechar tooltips ao tocar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-card')) {
      contextCards.forEach(card => {
        const tooltip = card.querySelector('.context-tooltip');
        if (tooltip) {
          tooltip.style.opacity = '0';
          tooltip.style.visibility = 'hidden';
          tooltip.style.transform = 'translateX(-50%) scale(0.8)';
        }
      });
    }
  });
}

// Initialize charts
function initializeCharts() {
  createMonthlyTrendChart();
  createLocationChart();
}

async function createMonthlyTrendChart() {
  try {
    // Use the statistics API to get monthly data
    if (!globalData || !globalData.months) {
      console.error('Dados mensais não disponíveis');
      return;
    }
    
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Process monthly data
    const labels = globalData.months.map(m => {
      const [year, month] = m.month.split('-');
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    });
    
    const data = globalData.months.map(m => m.count);
    
    // Find max month for insight
    const maxMonth = globalData.months.reduce((max, m) => m.count > max.count ? m : max, globalData.months[0]);
    const [year, month] = maxMonth.month.split('-');
    const maxMonthName = monthNames[parseInt(month) - 1];
    
    const ctx = document.getElementById('monthlyTrendChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Acidentes',
          data: data,
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
  } catch (error) {
    console.error('Erro ao criar gráfico mensal:', error);
  }
}

async function createLocationChart() {
  try {
    // Use the statistics API to get location data
    if (!globalData || !globalData.locations) {
      console.error('Dados de localização não disponíveis');
      return;
    }
    
    // Get top 6 locations
    const topLocations = globalData.locations.slice(0, 6);
    const labels = topLocations.map(l => l.local);
    const data = topLocations.map(l => l.count);
    
    // Find max location for insight
    const maxLocation = topLocations[0];
    
    const ctx = document.getElementById('locationChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Acidentes',
          data: data,
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
  } catch (error) {
    console.error('Erro ao criar gráfico de localização:', error);
  }
}

// Load next actions from API
async function loadNextActions() {
  try {
    const response = await fetch('/api/next-actions');
    if (!response.ok) throw new Error('Erro ao carregar próximas ações');
    
    const actions = await response.json();
    const actionsList = document.getElementById('actions-list');
    
    if (!actionsList) return;
    
    // Clear loading state
    actionsList.innerHTML = '';
    
    // Priority labels in Portuguese
    const priorityLabels = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    
    // Status labels in Portuguese
    const statusLabels = {
      'in-progress': 'Em andamento',
      'planned': 'Planejado',
      'completed': 'Concluído'
    };
    
    // Generate action cards
    actions.forEach((action, index) => {
      const actionCard = document.createElement('div');
      actionCard.className = `action-card ${action.priority}`;
      actionCard.style.animationDelay = `${index * 0.15}s`;
      
      actionCard.innerHTML = `
        <div class="action-header">
          <div>
            <span class="action-badge ${action.priority}">${priorityLabels[action.priority]}</span>
            <span class="action-location">${action.location}</span>
          </div>
          <span class="action-status ${action.status}">${statusLabels[action.status]}</span>
        </div>
        <h3>${action.title}</h3>
        <p class="action-description">${action.description}</p>
        <div class="action-meta">
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              <path d="M5 21V19C5 16.7909 6.79086 15 9 15H15C17.2091 15 19 16.7909 19 19V21" stroke="currentColor" stroke-width="2" />
            </svg>
            ${action.responsible}
          </span>
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2" />
            </svg>
            Prazo: ${action.deadline}
          </span>
        </div>
      `;
      
      actionsList.appendChild(actionCard);
    });
    
  } catch (error) {
    console.error('Erro ao carregar próximas ações:', error);
    const actionsList = document.getElementById('actions-list');
    if (actionsList) {
      actionsList.innerHTML = `
        <div class="error-state">
          <p>⚠️ Não foi possível carregar as ações prioritárias</p>
        </div>
      `;
    }
  }
}

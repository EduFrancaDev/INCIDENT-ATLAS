// State Management
const state = {
  filters: {
    gender: { male: true, female: true },
    countries: [],
    dateRange: {
      start: null,
      end: null
    }
  },
  charts: {},
  availableCountries: [],
  incidents: {
    data: [],
    page: 1,
    perPage: 20,
    hasMore: true,
    searchQuery: '',
    isLoading: false
  }
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await initializeData();
  initializeFilters();
  initializeCharts();
  initializeModals();
  setupIncidentsInfiniteScroll();
  setupIncidentsSearch();
  await updateDashboard();
  hideLoading();
});

// Loading Functions
function showLoading() {
  console.log('Carregando dados...');
}

function hideLoading() {
  console.log('Dados carregados!');
}

// Initialize Data
async function initializeData() {
  try {
    // Buscar países disponíveis e range de datas do endpoint de estatísticas
    const response = await fetch('/api/statistics');
    if (!response.ok) {
      throw new Error('Erro ao carregar estatísticas iniciais');
    }
    
    const stats = await response.json();
    
    // Extrair países únicos
    state.availableCountries = stats.countries.map(c => c.country).sort();
    state.filters.countries = [...state.availableCountries];
    
    // Definir range de datas baseado nos dados de meses
    if (stats.months && stats.months.length > 0) {
      const months = stats.months.map(m => m.month);
      state.filters.dateRange.start = new Date(months[0] + '-01');
      state.filters.dateRange.end = new Date(months[months.length - 1] + '-01');
      state.filters.dateRange.end.setMonth(state.filters.dateRange.end.getMonth() + 1);
      state.filters.dateRange.end.setDate(0); // Último dia do mês
    } else {
      // Fallback
      state.filters.dateRange.start = new Date('2016-01-01');
      state.filters.dateRange.end = new Date();
    }
    
    console.log('Dados iniciais carregados');
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
    alert('Erro ao carregar dados. Por favor, recarregue a página.');
  }
}

// Build Filter Query String
function buildFilterQueryString() {
  const params = new URLSearchParams();
  
  // Adicionar filtros de gênero
  if (state.filters.gender.male) params.append('gender', 'Homem');
  if (state.filters.gender.female) params.append('gender', 'Mulher');
  
  // Adicionar filtros de países
  state.filters.countries.forEach(country => {
    params.append('country', country);
  });
  
  // Adicionar filtros de data
  if (state.filters.dateRange.start) {
    params.append('startDate', state.filters.dateRange.start.toISOString().split('T')[0]);
  }
  if (state.filters.dateRange.end) {
    params.append('endDate', state.filters.dateRange.end.toISOString().split('T')[0]);
  }
  
  return params.toString();
}

// Filter Functions
function initializeFilters() {
  // Gender Filters
  document.getElementById('filterWomen').addEventListener('click', () => {
    toggleGenderFilter('female');
  });

  document.getElementById('filterMen').addEventListener('click', () => {
    toggleGenderFilter('male');
  });

  // Country Filter
  document.getElementById('filterCountries').addEventListener('click', () => {
    openCountriesModal();
  });

  // Period Filter
  document.getElementById('filterPeriod').addEventListener('click', () => {
    openPeriodModal();
  });

  // Chart Filters
  document.getElementById('monthRangeFilter').addEventListener('change', (e) => {
    updateMonthChart(e.target.value);
  });

  document.getElementById('countryFilter').addEventListener('change', (e) => {
    updateLocationChart(e.target.value);
  });
}

function toggleGenderFilter(gender) {
  state.filters.gender[gender] = !state.filters.gender[gender];
  
  const card = gender === 'female' 
    ? document.getElementById('filterWomen')
    : document.getElementById('filterMen');
  
  card.setAttribute('data-active', state.filters.gender[gender]);
  updateDashboard();
}

// Update Dashboard - Agora faz requisições ao backend
async function updateDashboard() {
  const queryString = buildFilterQueryString();
  
  try {
    // Atualizar cards de filtro
    await updateFilterCards(queryString);
    
    // Atualizar todos os gráficos
    await updateAllCharts(queryString);
    
    // Atualizar mapa de calor
    await updateBodyMap(queryString);
    
    // Atualizar lista de incidentes
    await updateIncidentsList(queryString);
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

async function updateFilterCards(queryString) {
  try {
    const response = await fetch(`/api/dashboard/stats?${queryString}`);
    if (!response.ok) throw new Error('Erro ao buscar estatísticas');
    
    const data = await response.json();
    
    document.getElementById('womenCount').textContent = data.women.count;
    document.getElementById('womenPercent').textContent = `${data.women.percent}%`;
    
    document.getElementById('menCount').textContent = data.men.count;
    document.getElementById('menPercent').textContent = `${data.men.percent}%`;
    
    document.getElementById('countriesCount').textContent = data.countriesCount;
    document.getElementById('countriesNames').textContent = state.filters.countries.join(', ');
    
    // Calcular dias do período
    if (data.dateRange.start && data.dateRange.end) {
      const start = new Date(data.dateRange.start);
      const end = new Date(data.dateRange.end);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      document.getElementById('periodDays').textContent = `${daysDiff} dias`;
      
      const startMonth = start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const endMonth = end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      document.getElementById('periodRange').textContent = `${startMonth} - ${endMonth}`;
    }
  } catch (error) {
    console.error('Erro ao atualizar cards de filtro:', error);
  }
}

// Chart Initialization
function initializeCharts() {
  createAccidentsPerMonthChart();
  createAccidentPotentialChart();
  createAccidentsByLocationChart();
}

function createAccidentsPerMonthChart() {
  const ctx = document.getElementById('accidentsPerMonthChart');
  state.charts.monthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Acidentes',
        data: [],
        borderColor: '#FA003F',
        backgroundColor: 'rgba(250, 0, 63, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FA003F',
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
          callbacks: {
            title: function(context) {
              // Converter label de "2016-01" para "Jan/2016"
              const label = context[0].label;
              if (!label || !label.includes('-')) return label;
              
              const parts = label.split('-');
              if (parts.length !== 2) return label;
              
              const year = parts[0];
              const month = parts[1];
              const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              const monthIndex = parseInt(month, 10) - 1;
              
              if (monthIndex >= 0 && monthIndex < 12) {
                return `${monthNames[monthIndex]}/${year}`;
              }
              return label;
            },
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
            color: '#E5E7EB'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function createAccidentPotentialChart() {
  const ctx = document.getElementById('accidentPotentialChart');
  
  state.charts.potentialChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Mineração', 'Metalurgia', 'Outros'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FA003F', '#4F46E5', '#10B981'],
        borderWidth: 2,
        borderColor: '#fff'
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

function createAccidentsByLocationChart() {
  const ctx = document.getElementById('accidentsByLocationChart');
  
  state.charts.locationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Acidentes',
        data: [],
        backgroundColor: '#FA003F',
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
            color: '#E5E7EB'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

async function updateAllCharts(queryString) {
  await updateMonthChart('all', queryString);
  await updatePotentialChart(queryString);
  await updateLocationChart('all', queryString);
  updateCountryFilterDropdown();
}

function updateCountryFilterDropdown() {
  const dropdown = document.getElementById('countryFilter');
  const optionsHtml = '<option value="all">Todos os países</option>' +
    state.availableCountries.map(country => 
      `<option value="${country}">${country}</option>`
    ).join('');
  dropdown.innerHTML = optionsHtml;
}

async function updateMonthChart(range, queryString = null) {
  if (!queryString) queryString = buildFilterQueryString();
  
  try {
    const response = await fetch(`/api/charts/monthly?${queryString}&range=${range}`);
    if (!response.ok) throw new Error('Erro ao buscar dados mensais');
    
    const data = await response.json();
    
    state.charts.monthChart.data.labels = data.labels;
    state.charts.monthChart.data.datasets[0].data = data.data;
    state.charts.monthChart.update();
  } catch (error) {
    console.error('Erro ao atualizar gráfico mensal:', error);
  }
}

async function updatePotentialChart(queryString = null) {
  if (!queryString) queryString = buildFilterQueryString();
  
  try {
    const response = await fetch(`/api/charts/sectors?${queryString}`);
    if (!response.ok) throw new Error('Erro ao buscar dados de setores');
    
    const data = await response.json();
    
    state.charts.potentialChart.data.labels = data.labels;
    state.charts.potentialChart.data.datasets[0].data = data.data;
    state.charts.potentialChart.update();
    
    // Update legend
    const legendHtml = data.labels.map((label, index) => {
      const colors = ['#FA003F', '#4F46E5', '#10B981'];
      return `
        <div class="legend-item">
          <span class="legend-color" style="background: ${colors[index]};"></span>
          <span>${label} (${data.data[index]})</span>
        </div>
      `;
    }).join('');
    
    document.getElementById('potentialLegend').innerHTML = legendHtml;
  } catch (error) {
    console.error('Erro ao atualizar gráfico de setores:', error);
  }
}

async function updateLocationChart(filterCountry, queryString = null) {
  if (!queryString) queryString = buildFilterQueryString();
  
  try {
    const response = await fetch(`/api/charts/locations?${queryString}&filterCountry=${filterCountry}`);
    if (!response.ok) throw new Error('Erro ao buscar dados de localização');
    
    const data = await response.json();
    
    state.charts.locationChart.data.labels = data.labels;
    state.charts.locationChart.data.datasets[0].data = data.data;
    state.charts.locationChart.update();
  } catch (error) {
    console.error('Erro ao atualizar gráfico de localização:', error);
  }
}

// Body Map
async function updateBodyMap(queryString = null) {
  if (!queryString) queryString = buildFilterQueryString();
  
  try {
    const response = await fetch(`/api/heatmap/bodyparts?${queryString}`);
    if (!response.ok) throw new Error('Erro ao buscar dados do mapa de calor');
    
    const data = await response.json();
    
    // Inicializar contadores
    const bodyPartCounts = {
      'hands': 0,
      'feet': 0,
      'left-leg': 0,
      'right-leg': 0,
      'face': 0,
      'neck': 0,
      'left-arm': 0,
      'right-arm': 0,
      'trunk': 0
    };
    
    // Mapear partes do corpo em português para as partes do SVG
    const bodyPartMapping = {
      'Face': 'face',
      'Cabeça': 'face',
      'Olhos': 'face',
      'Olho Esquerdo': 'face',
      'Olho Direito': 'face',
      'Pescoço': 'neck',
      'Tronco': 'trunk',
      'Tórax': 'trunk',
      'Abdômen': 'trunk',
      'Costas': 'trunk',
      'Mão Esquerda': 'hands',
      'Mão Direita': 'hands',
      'Mãos': 'hands',
      'Dedo': 'hands',
      'Dedos': 'hands',
      'Braço Esquerdo': 'left-arm',
      'Braço Direito': 'right-arm',
      'Perna Esquerda': 'left-leg',
      'Perna Direita': 'right-leg',
      'Pernas': 'right-leg',
      'Pé Esquerdo': 'feet',
      'Pé Direito': 'feet',
      'Pés': 'feet',
      'Tornozelo': 'feet',
      'Joelho': 'right-leg'
    };
    
    // Contar partes do corpo
    data.bodyParts.forEach(item => {
      const svgPart = bodyPartMapping[item.part];
      if (svgPart && bodyPartCounts[svgPart] !== undefined) {
        bodyPartCounts[svgPart] += item.count;
      }
    });
    
    // Calcular total para porcentagem
    const totalBodyParts = Object.values(bodyPartCounts).reduce((a, b) => a + b, 0);
    
    // Mapear nomes das partes do corpo para português
    const bodyPartNames = {
      'hands': 'Mãos/Dedos',
      'feet': 'Pés',
      'left-leg': 'Perna Esquerda',
      'right-leg': 'Perna Direita',
      'face': 'Face/Cabeça',
      'neck': 'Pescoço',
      'left-arm': 'Braço Esquerdo',
      'right-arm': 'Braço Direito',
      'trunk': 'Tronco'
    };
    
    // Update SVG elements
    Object.keys(bodyPartCounts).forEach(part => {
      const elements = document.querySelectorAll(`[data-part="${part}"]`);
      const count = bodyPartCounts[part];
      const percentage = totalBodyParts > 0 ? ((count / totalBodyParts) * 100).toFixed(1) : 0;
      let intensity = 'none';

      if (count >= 15) intensity = 'high';
      else if (count >= 8) intensity = 'medium';
      else if (count >= 3) intensity = 'low';
      else if (count >= 1) intensity = 'minimal';

      elements.forEach(el => {
        el.setAttribute('data-intensity', intensity);
        el.setAttribute('data-count', count);
        el.setAttribute('data-percentage', percentage);
        el.setAttribute('data-name', bodyPartNames[part]);
      });
    });
    
    // Configurar tooltips customizados para o mapa de calor
    setupBodyMapTooltips();
  } catch (error) {
    console.error('Erro ao atualizar mapa de calor:', error);
  }
}

// Configurar tooltips para o mapa de calor
function setupBodyMapTooltips() {
  const tooltip = document.getElementById('bodyMapTooltip');
  const bodyParts = document.querySelectorAll('.body-part');
  
  bodyParts.forEach(part => {
    part.addEventListener('mouseenter', (e) => {
      const name = part.getAttribute('data-name');
      const count = part.getAttribute('data-count');
      const percentage = part.getAttribute('data-percentage');
      
      if (name && count !== null) {
        tooltip.textContent = `${name}: ${count} (${percentage}%)`;
        tooltip.classList.add('active');
      }
    });
    
    part.addEventListener('mousemove', (e) => {
      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${e.clientY}px`;
    });
    
    part.addEventListener('mouseleave', () => {
      tooltip.classList.remove('active');
    });
  });
}

// Incidents List
async function updateIncidentsList(queryString = null, resetList = true) {
  if (!queryString) queryString = buildFilterQueryString();
  if (state.incidents.isLoading) return;
  
  // Reset state if needed
  if (resetList) {
    state.incidents.page = 1;
    state.incidents.data = [];
    state.incidents.hasMore = true;
  }
  
  try {
    state.incidents.isLoading = true;
    document.getElementById('incidentsLoading').style.display = 'block';
    
    // Adicionar query de busca
    let searchParam = '';
    if (state.incidents.searchQuery) {
      searchParam = `&search=${encodeURIComponent(state.incidents.searchQuery)}`;
    }
    
    const response = await fetch(`/api/accidents/filtered?${queryString}&page=${state.incidents.page}&perPage=${state.incidents.perPage}${searchParam}`);
    if (!response.ok) throw new Error('Erro ao buscar lista de incidentes');
    
    const incidents = await response.json();
    
    // Adicionar novos incidentes ao state
    state.incidents.data = resetList ? incidents : [...state.incidents.data, ...incidents];
    state.incidents.hasMore = incidents.length === state.incidents.perPage;
    
    const listContainer = document.getElementById('incidentsList');
    const listHtml = state.incidents.data.map(incident => `
      <div class="incident-item" data-id="${incident.id}">
        <div class="incident-item-header">
          <span class="incident-id">Acidente #${String(incident.id).padStart(3, '0')} Nível ${incident.accidentLevel}</span>
          <span class="incident-date">${new Date(incident.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="incident-location">${incident.local} - ${incident.country}</div>
      </div>
    `).join('');

    listContainer.innerHTML = listHtml;

    // Add click listeners
    document.querySelectorAll('.incident-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.getAttribute('data-id'));
        openIncidentModal(id, state.incidents.data);
      });
    });
    
    state.incidents.isLoading = false;
    document.getElementById('incidentsLoading').style.display = 'none';
  } catch (error) {
    console.error('Erro ao atualizar lista de incidentes:', error);
    state.incidents.isLoading = false;
    document.getElementById('incidentsLoading').style.display = 'none';
  }
}

// Scroll infinito para incidentes
function setupIncidentsInfiniteScroll() {
  const listContainer = document.getElementById('incidentsList');
  
  listContainer.addEventListener('scroll', () => {
    if (state.incidents.isLoading || !state.incidents.hasMore) return;
    
    const scrollHeight = listContainer.scrollHeight;
    const scrollTop = listContainer.scrollTop;
    const clientHeight = listContainer.clientHeight;
    
    // Carregar mais quando chegar a 80% do scroll
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      state.incidents.page++;
      updateIncidentsList(null, false);
    }
  });
}

// Busca de incidentes
function setupIncidentsSearch() {
  const searchInput = document.getElementById('incidentsSearch');
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.incidents.searchQuery = e.target.value.trim();
      updateIncidentsList(null, true);
    }, 500); // Debounce de 500ms
  });
}

// Modal Functions
function initializeModals() {
  // Incident Modal
  document.getElementById('modalClose').addEventListener('click', () => {
    closeModal('incidentModal');
  });

  // Countries Modal
  document.getElementById('countriesModalClose').addEventListener('click', () => {
    closeModal('countriesModal');
  });

  document.getElementById('countriesSelectAll').addEventListener('click', () => {
    state.filters.countries = [...state.availableCountries];
    updateCountriesCheckboxes();
  });

  document.getElementById('countriesClearAll').addEventListener('click', () => {
    state.filters.countries = [];
    updateCountriesCheckboxes();
  });

  // Period Modal
  document.getElementById('periodModalClose').addEventListener('click', () => {
    closeModal('periodModal');
  });

  document.getElementById('periodCancel').addEventListener('click', () => {
    closeModal('periodModal');
  });

  document.getElementById('periodApply').addEventListener('click', () => {
    applyPeriodFilter();
  });

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
}

function openIncidentModal(id, incidents) {
  const incident = incidents.find(i => i.id === id);
  if (!incident) return;

  document.getElementById('modalId').textContent = `#${String(incident.id).padStart(3, '0')}`;
  document.getElementById('modalDate').textContent = new Date(incident.date).toLocaleDateString('pt-BR');
  document.getElementById('modalLocation').textContent = incident.local;
  document.getElementById('modalCountry').textContent = incident.country;
  document.getElementById('modalSector').textContent = incident.sector;
  document.getElementById('modalLevel').textContent = incident.accidentLevel;
  document.getElementById('modalRisk').textContent = incident.criticalRisk;
  document.getElementById('modalDescription').textContent = incident.description;

  openModal('incidentModal');
}

function openCountriesModal() {
  const countries = state.availableCountries;
  const listHtml = countries.map(country => `
    <div class="country-checkbox-item">
      <input type="checkbox" id="country-${country}" value="${country}" 
        ${state.filters.countries.includes(country) ? 'checked' : ''}>
      <label for="country-${country}">${country}</label>
    </div>
  `).join('');

  document.getElementById('countriesFilterList').innerHTML = listHtml;

  // Add change listeners
  countries.forEach(country => {
    document.getElementById(`country-${country}`).addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!state.filters.countries.includes(country)) {
          state.filters.countries.push(country);
        }
      } else {
        state.filters.countries = state.filters.countries.filter(c => c !== country);
      }
      updateDashboard();
    });
  });

  openModal('countriesModal');
}

function updateCountriesCheckboxes() {
  state.availableCountries.forEach(country => {
    const checkbox = document.getElementById(`country-${country}`);
    if (checkbox) {
      checkbox.checked = state.filters.countries.includes(country);
    }
  });
  updateDashboard();
}

function openPeriodModal() {
  const startDate = state.filters.dateRange.start.toISOString().split('T')[0];
  const endDate = state.filters.dateRange.end.toISOString().split('T')[0];
  
  document.getElementById('startDate').value = startDate;
  document.getElementById('endDate').value = endDate;

  openModal('periodModal');
}

function applyPeriodFilter() {
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);

  if (startDate && endDate && startDate <= endDate) {
    state.filters.dateRange.start = startDate;
    state.filters.dateRange.end = endDate;
    updateDashboard();
    closeModal('periodModal');
  } else {
    alert('Por favor, selecione um período válido.');
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

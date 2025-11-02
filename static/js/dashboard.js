// Data Storage
let allAccidents = [];

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
  filteredData: [],
  availableCountries: []
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await loadAccidentsData();
  initializeFilters();
  initializeCharts();
  initializeModals();
  updateDashboard();
  hideLoading();
});

// Loading Functions
function showLoading() {
  // Pode adicionar um spinner/loading aqui se desejar
  console.log('Carregando dados...');
}

function hideLoading() {
  console.log('Dados carregados!');
}

// Load Data from API
async function loadAccidentsData() {
  try {
    const response = await fetch('/api/accidents');
    if (!response.ok) {
      throw new Error('Erro ao carregar dados dos acidentes');
    }
    
    allAccidents = await response.json();
    
    // Extrair países únicos
    state.availableCountries = [...new Set(allAccidents.map(a => a.country))].filter(Boolean).sort();
    state.filters.countries = [...state.availableCountries];
    
    // Definir range de datas baseado nos dados
    const dates = allAccidents.map(a => new Date(a.date)).filter(d => !isNaN(d));
    if (dates.length > 0) {
      state.filters.dateRange.start = new Date(Math.min(...dates));
      state.filters.dateRange.end = new Date(Math.max(...dates));
    } else {
      // Fallback se não houver datas válidas
      state.filters.dateRange.start = new Date('2016-01-01');
      state.filters.dateRange.end = new Date();
    }
    
    console.log(`${allAccidents.length} acidentes carregados`);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Erro ao carregar dados. Por favor, recarregue a página.');
    allAccidents = [];
  }
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

function updateDashboard() {
  // Filter data
  state.filteredData = allAccidents.filter(item => {
    const genderMatch = (item.gender === 'Male' && state.filters.gender.male) ||
                       (item.gender === 'Female' && state.filters.gender.female);
    const countryMatch = state.filters.countries.includes(item.country);
    const itemDate = new Date(item.date);
    const dateMatch = itemDate >= state.filters.dateRange.start && 
                     itemDate <= state.filters.dateRange.end;
    
    return genderMatch && countryMatch && dateMatch;
  });

  updateFilterCards();
  updateAllCharts();
  updateBodyMap();
  updateIncidentsList();
}

function updateFilterCards() {
  const total = state.filteredData.length;
  const women = state.filteredData.filter(d => d.gender === 'Female').length;
  const men = state.filteredData.filter(d => d.gender === 'Male').length;

  document.getElementById('womenCount').textContent = women;
  document.getElementById('womenPercent').textContent = total ? `${Math.round(women/total*100)}%` : '0%';
  
  document.getElementById('menCount').textContent = men;
  document.getElementById('menPercent').textContent = total ? `${Math.round(men/total*100)}%` : '0%';

  document.getElementById('countriesCount').textContent = state.filters.countries.length;
  document.getElementById('countriesNames').textContent = state.filters.countries.join(', ');

  const daysDiff = Math.ceil((state.filters.dateRange.end - state.filters.dateRange.start) / (1000 * 60 * 60 * 24));
  document.getElementById('periodDays').textContent = `${daysDiff} dias`;
  
  const startMonth = state.filters.dateRange.start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  const endMonth = state.filters.dateRange.end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  document.getElementById('periodRange').textContent = `${startMonth} - ${endMonth}`;
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
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Acidentes',
        data: [25, 35, 28, 42, 38, 30],
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
  
  const sectorData = {
    'Mineração': 0,
    'Metais': 0,
    'Outros': 0
  };

  state.filteredData.forEach(item => {
    if (sectorData[item.sector] !== undefined) {
      sectorData[item.sector]++;
    } else {
      sectorData['Outros']++;
    }
  });

  state.charts.potentialChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(sectorData),
      datasets: [{
        data: Object.values(sectorData),
        backgroundColor: ['#FA003F', '#4F46E5', '#10B981'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  // Update legend
  const legendHtml = Object.keys(sectorData).map((label, index) => {
    const colors = ['#FA003F', '#4F46E5', '#10B981'];
    return `
      <div class="legend-item">
        <span class="legend-color" style="background: ${colors[index]};"></span>
        <span>${label} (${sectorData[label]})</span>
      </div>
    `;
  }).join('');
  
  document.getElementById('potentialLegend').innerHTML = legendHtml;
}

function createAccidentsByLocationChart() {
  const ctx = document.getElementById('accidentsByLocationChart');
  
  const locationData = {};
  state.filteredData.forEach(item => {
    locationData[item.local] = (locationData[item.local] || 0) + 1;
  });

  const labels = Object.keys(locationData).slice(0, 6);
  const data = labels.map(label => locationData[label]);

  state.charts.locationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Acidentes',
        data: data,
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

function updateAllCharts() {
  updateMonthChart('all');
  updatePotentialChart();
  updateLocationChart('all');
}

function updateMonthChart(range) {
  // Filter data by range and update chart
  // This is a simplified version - would need more complex logic for actual filtering
  state.charts.monthChart.update();
}

function updatePotentialChart() {
  const sectorData = {
    'Mineração': 0,
    'Metais': 0,
    'Outros': 0
  };

  state.filteredData.forEach(item => {
    if (sectorData[item.sector] !== undefined) {
      sectorData[item.sector]++;
    } else {
      sectorData['Outros']++;
    }
  });

  state.charts.potentialChart.data.datasets[0].data = Object.values(sectorData);
  state.charts.potentialChart.update();

  // Update legend
  const legendHtml = Object.keys(sectorData).map((label, index) => {
    const colors = ['#FA003F', '#4F46E5', '#10B981'];
    return `
      <div class="legend-item">
        <span class="legend-color" style="background: ${colors[index]};"></span>
        <span>${label} (${sectorData[label]})</span>
      </div>
    `;
  }).join('');
  
  document.getElementById('potentialLegend').innerHTML = legendHtml;
}

function updateLocationChart(country) {
  let dataToUse = state.filteredData;
  
  if (country !== 'all') {
    dataToUse = state.filteredData.filter(d => d.country === country);
  }

  const locationData = {};
  dataToUse.forEach(item => {
    locationData[item.local] = (locationData[item.local] || 0) + 1;
  });

  const labels = Object.keys(locationData).slice(0, 6);
  const data = labels.map(label => locationData[label]);

  state.charts.locationChart.data.labels = labels;
  state.charts.locationChart.data.datasets[0].data = data;
  state.charts.locationChart.update();
}

// Body Map
function updateBodyMap() {
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

  state.filteredData.forEach(item => {
    if (item.bodyPart && bodyPartCounts[item.bodyPart] !== undefined) {
      bodyPartCounts[item.bodyPart]++;
    }
  });

  // Update SVG elements
  Object.keys(bodyPartCounts).forEach(part => {
    const elements = document.querySelectorAll(`[data-part="${part}"]`);
    const count = bodyPartCounts[part];
    let intensity = 'none';

    if (count >= 15) intensity = 'high';
    else if (count >= 8) intensity = 'medium';
    else if (count >= 3) intensity = 'low';
    else if (count >= 1) intensity = 'minimal';

    elements.forEach(el => {
      el.setAttribute('data-intensity', intensity);
      el.setAttribute('data-count', count);
    });
  });
}

// Incidents List
function updateIncidentsList() {
  const listContainer = document.getElementById('incidentsList');
  const listHtml = state.filteredData.slice(0, 10).map(incident => `
    <div class="incident-item" data-id="${incident.id}">
      <div class="incident-item-header">
        <span class="incident-id">Resumo de Acidente #${String(incident.id).padStart(3, '0')}</span>
        <span class="incident-date">${new Date(incident.date).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="incident-location">Processado em ${incident.date}</div>
    </div>
  `).join('');

  listContainer.innerHTML = listHtml;

  // Add click listeners
  document.querySelectorAll('.incident-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.getAttribute('data-id'));
      openIncidentModal(id);
    });
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

function openIncidentModal(id) {
  const incident = allAccidents.find(i => i.id === id);
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

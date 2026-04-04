// ===== Singapore Carbon Footprint Calculator - Core Logic =====

// --- Emission Factors (Singapore-specific) ---
const EMISSION_FACTORS = {
  electricity: 0.4, // kg CO2 per kWh (EMA Grid Emission Factor)

  // kg CO2 per km
  transport: {
    'mrt': 0.02,
    'bus': 0.05,
    'car-petrol': 0.18,
    'car-hybrid': 0.10,
    'car-ev': 0.05,
    'ride-hailing': 0.20,
  },

  // kg CO2 per day per person
  diet: {
    'meat-heavy': 3.3,
    'balanced': 2.5,
    'vegetarian': 1.7,
    'vegan': 1.5,
  },

  // Multiplier for eating out (higher emissions due to food waste, packaging)
  eatingOutExtra: 0.15, // 15% extra per meal eaten out vs home-cooked

  // Monthly waste base (kg CO2)
  wasteBase: 15,

  // Recycling reduction factor
  recycling: {
    'never': 1.0,
    'sometimes': 0.85,
    'often': 0.65,
  },

  // Plastic usage multiplier
  plastic: {
    'low': 0.8,
    'medium': 1.0,
    'high': 1.3,
  },

  // Online shopping add-on (kg CO2/month)
  onlineShopping: {
    'rarely': 2,
    'monthly': 5,
    'weekly': 15,
  },

  // Housing type multiplier (shared infrastructure effect)
  housing: {
    'hdb': 1.0,
    'condo': 1.15,
    'landed': 1.4,
  },
};

// Singapore average monthly CO2 per capita (~700 kg/month from ~8.5 tonnes/year)
const SG_AVERAGE = {
  energy: 140,
  transport: 180,
  food: 80,
  waste: 30,
  total: 430,
};

// --- DOM Elements ---
const $ = (id) => document.getElementById(id);

const inputs = {
  electricity: $('electricity'),
  householdSize: $('householdSize'),
  aircon: $('aircon'),
  housingType: $('housingType'),
  transportMode: $('transportMode'),
  weeklyDistance: $('weeklyDistance'),
  dietType: $('dietType'),
  mealsOut: $('mealsOut'),
  recycling: $('recycling'),
  plasticUsage: $('plasticUsage'),
  onlineShopping: $('onlineShopping'),
};

const displays = {
  totalCO2: $('totalCO2'),
  energyValue: $('energyValue'),
  transportValue: $('transportValue'),
  foodValue: $('foodValue'),
  wasteValue: $('wasteValue'),
  statusIndicator: $('statusIndicator'),
  statusText: $('statusText'),
};

// --- Calculation Functions ---
function computeEnergy() {
  const kWh = parseFloat(inputs.electricity.value) || 0;
  const householdSize = parseInt(inputs.householdSize.value) || 1;
  const airconHours = parseFloat(inputs.aircon.value) || 0;
  const housingType = inputs.housingType.value;

  // Base electricity emissions (per person)
  let emissions = (kWh * EMISSION_FACTORS.electricity) / householdSize;

  // Aircon adjustment: ~1.5 kW average aircon, extra hours beyond 2h baseline
  const extraAircon = Math.max(0, airconHours - 2);
  emissions += extraAircon * 1.5 * EMISSION_FACTORS.electricity * 30 / householdSize;

  // Housing type multiplier
  emissions *= EMISSION_FACTORS.housing[housingType] || 1;

  return Math.round(emissions * 10) / 10;
}

function computeTransport() {
  const mode = inputs.transportMode.value;
  const weeklyKm = parseFloat(inputs.weeklyDistance.value) || 0;
  const monthlyKm = weeklyKm * 4.33;

  const emissionPerKm = EMISSION_FACTORS.transport[mode] || 0;
  const emissions = monthlyKm * emissionPerKm;

  return Math.round(emissions * 10) / 10;
}

function computeFood() {
  const diet = inputs.dietType.value;
  const mealsOut = parseInt(inputs.mealsOut.value) || 0;

  // Base diet emissions (30 days)
  let emissions = (EMISSION_FACTORS.diet[diet] || 2.5) * 30;

  // Extra emissions from eating out
  const eatingOutMonthly = mealsOut * 4.33;
  emissions += eatingOutMonthly * EMISSION_FACTORS.eatingOutExtra * (EMISSION_FACTORS.diet[diet] || 2.5);

  return Math.round(emissions * 10) / 10;
}

function computeWaste() {
  const recycling = inputs.recycling.value;
  const plastic = inputs.plasticUsage.value;
  const shopping = inputs.onlineShopping.value;

  let emissions = EMISSION_FACTORS.wasteBase;
  emissions *= EMISSION_FACTORS.recycling[recycling] || 1;
  emissions *= EMISSION_FACTORS.plastic[plastic] || 1;
  emissions += EMISSION_FACTORS.onlineShopping[shopping] || 0;

  return Math.round(emissions * 10) / 10;
}

function getStatus(total) {
  if (total < 200) return { level: 'low', text: 'Low Footprint' };
  if (total < 400) return { level: 'medium', text: 'Moderate Footprint' };
  return { level: 'high', text: 'High Footprint' };
}

// --- Main Calculation & UI Update ---
function calculate() {
  const energy = computeEnergy();
  const transport = computeTransport();
  const food = computeFood();
  const waste = computeWaste();
  const total = Math.round((energy + transport + food + waste) * 10) / 10;

  // Update displays
  displays.energyValue.textContent = energy;
  displays.transportValue.textContent = transport;
  displays.foodValue.textContent = food;
  displays.wasteValue.textContent = waste;
  displays.totalCO2.textContent = total;

  // Update status
  const status = getStatus(total);
  displays.statusIndicator.className = `status-indicator ${status.level}`;
  displays.statusText.textContent = status.text;

  // Update charts
  if (typeof updateCharts === 'function') {
    updateCharts({ energy, transport, food, waste, total });
  }

  // Store results for AI
  window.carbonResults = { energy, transport, food, waste, total };

  return { energy, transport, food, waste, total };
}

// --- Get User Profile (for AI) ---
function getUserProfile() {
  return {
    electricity: inputs.electricity.value,
    householdSize: inputs.householdSize.value,
    aircon: inputs.aircon.value,
    housingType: inputs.housingType.value,
    transportMode: inputs.transportMode.options[inputs.transportMode.selectedIndex].text,
    weeklyDistance: inputs.weeklyDistance.value,
    dietType: inputs.dietType.options[inputs.dietType.selectedIndex].text,
    mealsOut: inputs.mealsOut.value,
    recycling: inputs.recycling.options[inputs.recycling.selectedIndex].text,
    plasticUsage: inputs.plasticUsage.options[inputs.plasticUsage.selectedIndex].text,
    onlineShopping: inputs.onlineShopping.options[inputs.onlineShopping.selectedIndex].text,
  };
}

// --- Accordion ---
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = document.getElementById(header.dataset.target);
    const isOpen = body.classList.contains('open');

    // Close all
    document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));

    // Toggle clicked
    if (!isOpen) {
      body.classList.add('open');
      header.classList.add('active');
    }
  });
});

// --- Theme Toggle ---
function initTheme() {
  const saved = localStorage.getItem('sg-carbon-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

$('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sg-carbon-theme', next);

  // Refresh charts for new theme colors
  if (typeof updateChartTheme === 'function') {
    updateChartTheme();
  }
});

// --- Settings Modal ---
$('settingsBtn').addEventListener('click', () => {
  $('settingsModal').classList.add('active');
  // Load saved settings
  const provider = localStorage.getItem('sg-carbon-ai-provider') || 'openai';
  const key = localStorage.getItem('sg-carbon-api-key') || '';
  $('aiProvider').value = provider;
  $('apiKey').value = key;
});

$('closeSettings').addEventListener('click', () => {
  $('settingsModal').classList.remove('active');
});

$('settingsModal').addEventListener('click', (e) => {
  if (e.target === $('settingsModal')) {
    $('settingsModal').classList.remove('active');
  }
});

$('saveSettings').addEventListener('click', () => {
  localStorage.setItem('sg-carbon-ai-provider', $('aiProvider').value);
  localStorage.setItem('sg-carbon-api-key', $('apiKey').value);
  $('settingsModal').classList.remove('active');
  showToast('Settings saved');
});

// --- Export ---
$('exportBtn').addEventListener('click', () => {
  const results = window.carbonResults;
  if (!results) return;

  const profile = getUserProfile();
  const text = `SG Carbon Footprint Calculator Report
========================
Date: ${new Date().toLocaleDateString()}

Total: ${results.total} kg CO2/month

Breakdown:
- Energy: ${results.energy} kg
- Transport: ${results.transport} kg
- Food: ${results.food} kg
- Waste: ${results.waste} kg

Your Profile:
- Electricity: ${profile.electricity} kWh/month
- Household: ${profile.householdSize} people
- Housing: ${profile.housingType}
- Aircon: ${profile.aircon} hrs/day
- Transport: ${profile.transportMode}, ${profile.weeklyDistance} km/week
- Diet: ${profile.dietType}
- Meals out: ${profile.mealsOut}/week
- Recycling: ${profile.recycling}
- Plastic usage: ${profile.plasticUsage}
- Online shopping: ${profile.onlineShopping}

Singapore Average: ~${SG_AVERAGE.total} kg CO2/month
`;

  // Try clipboard, fallback to download
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Results copied to clipboard!');
    });
  } else {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sg-carbon-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded!');
  }
});

// --- Toast ---
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- Auto-calculate on any input change ---
Object.values(inputs).forEach(el => {
  el.addEventListener('input', calculate);
  el.addEventListener('change', calculate);
});

// --- Initialize ---
initTheme();
calculate();

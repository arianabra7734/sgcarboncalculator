// ===== Chart.js Visualizations =====

let pieChart = null;
let barChart = null;

const CHART_COLORS = {
  energy: '#ffd93d',
  transport: '#6c5ce7',
  food: '#00d68f',
  waste: '#ff6b6b',
};

function getChartTextColor() {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? '#5f6380'
    : '#9498b0';
}

function getChartGridColor() {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'rgba(0,0,0,0.06)'
    : 'rgba(255,255,255,0.06)';
}

function initCharts() {
  const textColor = getChartTextColor();
  const gridColor = getChartGridColor();

  // Pie Chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Energy', 'Transport', 'Food', 'Waste'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          CHART_COLORS.energy,
          CHART_COLORS.transport,
          CHART_COLORS.food,
          CHART_COLORS.waste,
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8,
            font: { size: 12, weight: '500' },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} kg CO₂`,
          },
        },
      },
    },
  });

  // Bar Chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Energy', 'Transport', 'Food', 'Waste'],
      datasets: [
        {
          label: 'You',
          data: [0, 0, 0, 0],
          backgroundColor: [
            CHART_COLORS.energy,
            CHART_COLORS.transport,
            CHART_COLORS.food,
            CHART_COLORS.waste,
          ],
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: 'SG Average',
          data: [SG_AVERAGE.energy, SG_AVERAGE.transport, SG_AVERAGE.food, SG_AVERAGE.waste],
          backgroundColor: 'rgba(148, 152, 176, 0.25)',
          borderColor: 'rgba(148, 152, 176, 0.4)',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: (v) => v + ' kg',
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8,
            font: { size: 12, weight: '500' },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} kg CO₂`,
          },
        },
      },
    },
  });
}

function updateCharts({ energy, transport, food, waste }) {
  if (!pieChart || !barChart) {
    initCharts();
  }

  // Update pie chart
  pieChart.data.datasets[0].data = [energy, transport, food, waste];
  pieChart.update('none');

  // Update bar chart (user data only)
  barChart.data.datasets[0].data = [energy, transport, food, waste];
  barChart.update('none');
}

function updateChartTheme() {
  if (!pieChart || !barChart) return;

  const textColor = getChartTextColor();
  const gridColor = getChartGridColor();

  // Pie
  pieChart.options.plugins.legend.labels.color = textColor;
  pieChart.update('none');

  // Bar
  barChart.options.plugins.legend.labels.color = textColor;
  barChart.options.scales.x.ticks.color = textColor;
  barChart.options.scales.y.ticks.color = textColor;
  barChart.options.scales.y.grid.color = gridColor;
  barChart.update('none');
}

// Initialize charts on load
initCharts();

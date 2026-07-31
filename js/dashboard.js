/**
 * CRIS Wagon Defect Detection System - Dashboard Controller
 * Integrates Chart.js for statistics charts & metrics reporting.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const chartBarElem = document.getElementById('defectBarChart');
  const chartPieElem = document.getElementById('defectPieChart');
  const recentTableBody = document.getElementById('recentTableBody');

  if (!chartBarElem && !chartPieElem) return;

  // Load Statistics from API Service
  try {
    const stats = await CRISApi.getStatistics();
    renderDashboardKPIs(stats);
    renderBarChart(chartBarElem, stats.defectsBreakdown);
    renderPieChart(chartPieElem, stats.defectsBreakdown);
    renderRecentDetections(recentTableBody, stats.recentDetections);
  } catch (err) {
    console.error('Failed to load dashboard statistics', err);
    showToast('Failed to load statistics.', 'error');
  }
});

// Update KPI Metric Cards
function renderDashboardKPIs(stats) {
  const kpiTotalImages = document.getElementById('kpiTotalImages');
  const kpiTotalDefects = document.getElementById('kpiTotalDefects');
  const kpiRust = document.getElementById('kpiRust');
  const kpiDent = document.getElementById('kpiDent');
  const kpiStructural = document.getElementById('kpiStructural');

  const bd = stats.defectsBreakdown || {};

  if (kpiTotalImages) kpiTotalImages.textContent = stats.totalImagesProcessed || 0;
  if (kpiTotalDefects) kpiTotalDefects.textContent = stats.totalDefects || 0;
  if (kpiRust) kpiRust.textContent = bd.Rust || 0;
  if (kpiDent) kpiDent.textContent = bd.Dent || 0;
  if (kpiStructural) kpiStructural.textContent = (bd.Structural_damage || bd['Structural Damage'] || 0);
}

// Render Defect Type Bar Chart
function renderBarChart(canvasElem, breakdown) {
  if (!canvasElem) return;

  const labels = ['Rust', 'Dent', 'Structural_damage'];
  const values = [
    breakdown.Rust || 0,
    breakdown.Dent || 0,
    (breakdown.Structural_damage || breakdown['Structural Damage'] || 0)
  ];

  const ctx = canvasElem.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Detection Count',
        data: values,
        backgroundColor: [
          '#EF4444', // Rust Red
          '#F59E0B', // Dent Amber
          '#991B1B'  // Structural_damage Dark Red
        ],
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 10,
          backgroundColor: '#0F172A'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#E2E8F0' },
          ticks: { precision: 0 }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// Render Defect Percentage Pie Chart
function renderPieChart(canvasElem, breakdown) {
  if (!canvasElem) return;

  const labels = ['Rust', 'Dent', 'Structural_damage'];
  const values = [
    breakdown.Rust || 0,
    breakdown.Dent || 0,
    (breakdown.Structural_damage || breakdown['Structural Damage'] || 0)
  ];

  const ctx = canvasElem.getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#EF4444',
          '#F59E0B',
          '#991B1B'
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#0F172A',
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const val = context.raw || 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${val} (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Render Recent Detections Table
function renderRecentDetections(tableBody, recentItems) {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (!recentItems || recentItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No recent detections found.</td></tr>`;
    return;
  }

  recentItems.forEach(item => {
    const tr = document.createElement('tr');
    
    // Format defect tags
    const defectBadges = (item.detections || []).map(d => {
      let bClass = 'rust';
      if (d.class === 'Dent') bClass = 'dent';
      if (d.class === 'Structural_damage' || d.class === 'Structural Damage') bClass = 'structural';
      return `<span class="defect-badge ${bClass}">${d.class}</span>`;
    }).join(' ');

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${item.image}" alt="thumb" style="width:44px; height:32px; object-fit:cover; border-radius:4px; border:1px solid #CBD5E1;">
          <div>
            <div style="font-weight:600; color:var(--bg-navy);">${item.id}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${item.wagonType || 'Freight Wagon'}</div>
          </div>
        </div>
      </td>
      <td>${defectBadges || '<span style="color:var(--text-muted);">None</span>'}</td>
      <td style="color:var(--text-muted); font-size:0.825rem;">${item.date}</td>
      <td>
        <span style="font-weight:600; color: ${item.status === 'Action Required' ? 'var(--status-critical)' : 'var(--status-warning)'}; font-size:0.825rem;">
          ${item.status || 'Inspected'}
        </span>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

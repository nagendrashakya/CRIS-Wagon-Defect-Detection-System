/**
 * CRIS Wagon Defect Detection System - History Controller
 * Manages detection records ledger, real-time search, defect filtering, inspection modal, & record deletion.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const historyTableBody = document.getElementById('historyTableBody');
  const searchInput = document.getElementById('searchInput');
  const defectFilterSelect = document.getElementById('defectFilterSelect');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalContentBody = document.getElementById('modalContentBody');

  if (!historyTableBody) return;

  let historyData = [];

  // Load History
  async function fetchAndRenderHistory() {
    try {
      historyData = await CRISApi.getHistory();
      applyFiltersAndRender();
    } catch (err) {
      console.error('Failed to fetch history', err);
      showToast('Error loading history ledger.', 'error');
    }
  }

  // Filter & Search Logic
  function applyFiltersAndRender() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedDefect = defectFilterSelect ? defectFilterSelect.value : 'ALL';

    const filtered = historyData.filter(item => {
      // Search match
      const matchQuery = !query || 
        item.id.toLowerCase().includes(query) ||
        (item.wagonType && item.wagonType.toLowerCase().includes(query)) ||
        (item.date && item.date.toLowerCase().includes(query)) ||
        (item.detections || []).some(d => d.class.toLowerCase().includes(query));

      // Category filter match
      const matchDefect = selectedDefect === 'ALL' || 
        (item.detections || []).some(d => d.class === selectedDefect);

      return matchQuery && matchDefect;
    });

    renderHistoryTable(filtered);
  }

  // Render Table Rows
  function renderHistoryTable(items) {
    historyTableBody.innerHTML = '';

    if (!items || items.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            <div>No matching inspection records found.</div>
          </td>
        </tr>
      `;
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');

      const defectBadges = (item.detections || []).map(d => {
        let bClass = 'rust';
        if (d.class === 'Dent') bClass = 'dent';
        if (d.class === 'Structural_damage' || d.class === 'Structural Damage') bClass = 'structural';
        return `<span class="defect-badge ${bClass}">${d.class} (${Math.round(d.confidence * 100)}%)</span>`;
      }).join(' ');

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${item.image}" alt="Wagon Preview" style="width:64px; height:44px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1; background:#000;">
            <div>
              <div style="font-weight:700; color:var(--bg-navy);">${item.id}</div>
              <div style="font-size:0.775rem; color:var(--text-muted);">${item.wagonType || 'BOXN Freight Wagon'}</div>
            </div>
          </div>
        </td>
        <td>${defectBadges || '<span class="defect-badge decolor">Clean</span>'}</td>
        <td>
          <div style="font-weight:600; color:var(--primary-blue);">${item.highestConfidence || '0%'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${item.totalDefects || 0} defects found</div>
        </td>
        <td style="font-size:0.825rem; color:var(--text-muted);">${item.date}</td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm view-btn" data-id="${item.id}">View</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
          </div>
        </td>
      `;

      historyTableBody.appendChild(tr);
    });
  }

  // Event Delegation for Table Action Buttons (View & Delete)
  historyTableBody.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = deleteBtn.getAttribute('data-id');
      historyData = await CRISApi.deleteInspection(id);
      showToast(`Deleted inspection record ${id}.`, 'info');
      applyFiltersAndRender();
      return;
    }

    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = viewBtn.getAttribute('data-id');
      openDetailModal(id);
    }
  });

  // Search & Filter Listeners
  if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
  if (defectFilterSelect) defectFilterSelect.addEventListener('change', applyFiltersAndRender);

  // Modal View Logic
  function openDetailModal(id) {
    const record = historyData.find(item => item.id === id);
    if (!record) return;

    // Set stored detection result and redirect or open modal
    sessionStorage.setItem('current_detection_result', JSON.stringify(record));

    if (modalContentBody && modalBackdrop) {
      const defectRows = (record.detections || []).map(d => `
        <tr>
          <td><span class="defect-badge rust">${d.class}</span></td>
          <td><b>${Math.round(d.confidence * 100)}%</b></td>
          <td><code>[${(d.bbox || []).join(', ')}]</code></td>
          <td><span style="color:var(--status-critical); font-weight:600;">${d.status || 'Active'}</span></td>
        </tr>
      `).join('');

      modalContentBody.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h4 style="margin-bottom:8px; color:var(--bg-navy);">Wagon Image</h4>
            <img src="${record.image}" style="width:100%; height:220px; object-fit:cover; border-radius:8px; border:1px solid #CBD5E1;">
          </div>
          <div>
            <h4 style="margin-bottom:8px; color:var(--bg-navy);">Inspection Summary</h4>
            <div style="background:var(--bg-slate); padding:1rem; border-radius:8px; font-size:0.875rem; display:flex; flex-direction:column; gap:6px;">
              <div><b>Wagon ID:</b> ${record.id}</div>
              <div><b>Wagon Type:</b> ${record.wagonType}</div>
              <div><b>Inspection Date:</b> ${record.date}</div>
              <div><b>Processing Time:</b> ${record.processingTime}</div>
              <div><b>Total Defects:</b> ${record.totalDefects}</div>
              <div><b>Highest Confidence:</b> ${record.highestConfidence}</div>
              <div><b>Status:</b> <span style="color:var(--status-critical); font-weight:600;">${record.status}</span></div>
            </div>
          </div>
        </div>
        <h4 style="margin-bottom:8px; color:var(--bg-navy);">Detected Defects</h4>
        <table class="data-table">
          <thead>
            <tr><th>Defect</th><th>Confidence</th><th>Bounding Box</th><th>Status</th></tr>
          </thead>
          <tbody>${defectRows}</tbody>
        </table>
        <div style="margin-top:1.5rem; text-align:right;">
          <a href="result.html" class="btn btn-primary btn-sm">Open Full Result View</a>
        </div>
      `;

      modalBackdrop.classList.add('active');
    }
  }

  // Modal Close
  if (modalCloseBtn && modalBackdrop) {
    modalCloseBtn.addEventListener('click', () => modalBackdrop.classList.remove('active'));
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.classList.remove('active');
    });
  }

  // Initial Fetch
  fetchAndRenderHistory();
});

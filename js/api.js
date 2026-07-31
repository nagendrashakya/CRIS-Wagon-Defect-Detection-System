/**
 * CRIS Wagon Defect Detection System - API Service
 * Handles communication with FastAPI backend via Axios with smooth mock fallback.
 */

// Configurable API Endpoint
const API_BASE_URL = 'http://localhost:8000';

// Axios Instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Demo / Local Storage Key
const STORAGE_KEY = 'cris_wagon_inspection_history_v3';

// Inline SVG Data URL for Wagon Image Placeholder
const PLACEHOLDER_WAGON_SVG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#0f172a"/><rect x="80" y="140" width="640" height="200" rx="8" fill="#1e293b" stroke="#334155" stroke-width="4"/><circle cx="160" cy="360" r="30" fill="#475569"/><circle cx="260" cy="360" r="30" fill="#475569"/><circle cx="540" cy="360" r="30" fill="#475569"/><circle cx="640" cy="360" r="30" fill="#475569"/><text x="400" y="250" font-family="sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">CRIS WAGON INSPECTION</text></svg>');

// Default Demo Seed Data
const DEFAULT_INSPECTIONS = [
  {
    id: 'WAG-2026-001',
    image: PLACEHOLDER_WAGON_SVG,
    wagonType: 'BOXN Freight Wagon',
    date: '2026-07-29 14:22:10',
    processingTime: '1.18 s',
    status: 'Action Required',
    totalDefects: 3,
    highestConfidence: '96%',
    detections: [
      { id: 1, class: 'Rust', confidence: 0.96, bbox: [140, 180, 360, 480], status: 'Critical', severity: 'High' },
      { id: 2, class: 'Dent', confidence: 0.91, bbox: [380, 120, 510, 310], status: 'Warning', severity: 'Medium' },
      { id: 3, class: 'Structural_damage', confidence: 0.89, bbox: [220, 520, 410, 710], status: 'Critical', severity: 'High' }
    ]
  },
  {
    id: 'WAG-2026-002',
    image: PLACEHOLDER_WAGON_SVG,
    wagonType: 'BCNA Covered Freight',
    date: '2026-07-29 16:45:00',
    processingTime: '1.24 s',
    status: 'Warning',
    totalDefects: 2,
    highestConfidence: '94%',
    detections: [
      { id: 1, class: 'Dent', confidence: 0.94, bbox: [150, 200, 320, 500], status: 'Warning', severity: 'Medium' },
      { id: 2, class: 'Rust', confidence: 0.88, bbox: [300, 450, 480, 780], status: 'Warning', severity: 'Medium' }
    ]
  },
  {
    id: 'WAG-2026-003',
    image: PLACEHOLDER_WAGON_SVG,
    wagonType: 'BOBYN Hopper Wagon',
    date: '2026-07-30 09:15:30',
    processingTime: '0.98 s',
    status: 'Critical',
    totalDefects: 3,
    highestConfidence: '97%',
    detections: [
      { id: 1, class: 'Rust', confidence: 0.97, bbox: [100, 150, 300, 400], status: 'Critical', severity: 'High' },
      { id: 2, class: 'Structural_damage', confidence: 0.93, bbox: [250, 420, 490, 680], status: 'Critical', severity: 'High' },
      { id: 3, class: 'Dent', confidence: 0.89, bbox: [350, 100, 480, 280], status: 'Warning', severity: 'Medium' }
    ]
  }
];

// Initialize Storage
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INSPECTIONS));
  }
}
initStorage();

// Helper: Get local inspection array
function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return DEFAULT_INSPECTIONS;
  }
}

// Helper: Save inspection item
function saveLocalInspection(record) {
  const history = getLocalHistory();
  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Simulated AI Detection Logic (Fallback)
function generateMockDetection(imageDataUrl) {
  const defectClasses = [
    { class: 'Rust', status: 'Critical', severity: 'High' },
    { class: 'Dent', status: 'Warning', severity: 'Medium' },
    { class: 'Structural_damage', status: 'Critical', severity: 'High' }
  ];

  // Pick 1 to 3 random defects
  const numDefects = Math.floor(Math.random() * 3) + 1;
  const detections = [];
  const shuffled = [...defectClasses].sort(() => 0.5 - Math.random());

  let maxConf = 0;

  for (let i = 0; i < numDefects; i++) {
    const item = shuffled[i];
    const confVal = (0.85 + Math.random() * 0.13).toFixed(2);
    const confidence = parseFloat(confVal);
    if (confidence > maxConf) maxConf = confidence;

    // Generate Bounding Box Coordinates: [ymin, xmin, ymax, xmax] relative to 800x450
    const xmin = Math.floor(100 + i * 220 + Math.random() * 40);
    const ymin = Math.floor(80 + Math.random() * 100);
    const xmax = xmin + Math.floor(180 + Math.random() * 80);
    const ymax = ymin + Math.floor(140 + Math.random() * 100);

    detections.push({
      id: i + 1,
      class: item.class,
      confidence: confidence,
      bbox: [ymin, xmin, ymax, xmax],
      status: item.status,
      severity: item.severity
    });
  }

  const wagonId = `WAG-2026-${String(getLocalHistory().length + 1).padStart(3, '0')}`;
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  const mockResponse = {
    id: wagonId,
    image: imageDataUrl || PLACEHOLDER_WAGON_SVG,
    wagonType: 'BOXN Freight Wagon',
    date: dateStr,
    processing_time: (0.85 + Math.random() * 0.5).toFixed(2) + ' s',
    status: detections.some(d => d.status === 'Critical') ? 'Action Required' : 'Warning',
    totalDefects: detections.length,
    highestConfidence: `${Math.round(maxConf * 100)}%`,
    detections: detections
  };

  saveLocalInspection(mockResponse);
  return mockResponse;
}

/**
 * Public API Interface
 */
const CRISApi = {
  // Predict endpoint: POST /predict
  async predictWagon(formData, previewDataUrl) {
    try {
      const response = await apiClient.post('/predict', formData);
      const data = response.data;
      // Format backend response
      const record = {
        id: data.id || `WAG-2026-${String(getLocalHistory().length + 1).padStart(3, '0')}`,
        image: data.image || previewDataUrl,
        wagonType: data.wagon_type || 'BOXN Freight Wagon',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        processingTime: data.processing_time || '1.12 s',
        status: (data.detections || []).some(d => d.status === 'Critical' || d.class === 'Rust' || d.class === 'Structural_damage') ? 'Action Required' : 'Warning',
        totalDefects: (data.detections || []).length,
        highestConfidence: data.detections && data.detections.length > 0 ? `${Math.round(Math.max(...data.detections.map(d => d.confidence)) * 100)}%` : '0%',
        detections: data.detections || []
      };
      saveLocalInspection(record);
      return record;
    } catch (error) {
      console.warn('FastAPI backend offline or unavailable. Using simulated local AI engine.', error.message);
      // Simulate 1.2s API response latency for realistic experience
      await new Promise(r => setTimeout(r, 1200));
      return generateMockDetection(previewDataUrl);
    }
  },

  // Batch Prediction Endpoint / Sequential Processing
  async predictWagonBatch(fileList, progressCallback) {
    const results = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (progressCallback) {
        progressCallback(i + 1, fileList.length, file.name);
      }
      const formData = new FormData();
      formData.append('file', file);
      
      // Read data URL for local preview if offline
      let previewUrl = null;
      try {
        previewUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      } catch (e) {}

      const res = await this.predictWagon(formData, previewUrl);
      results.push(res);
    }
    return results;
  },

  // Get statistics: GET /statistics
  async getStatistics() {
    try {
      const response = await apiClient.get('/statistics');
      return response.data;
    } catch (error) {
      const history = getLocalHistory();
      let rustCount = 0;
      let dentCount = 0;
      let structuralCount = 0;
      let totalDefectsCount = 0;

      history.forEach(item => {
        (item.detections || []).forEach(d => {
          totalDefectsCount++;
          const dClass = d.class ? d.class.replace(' ', '_') : '';
          if (dClass === 'Rust' || d.class === 'Rust') rustCount++;
          else if (dClass === 'Dent' || d.class === 'Dent') dentCount++;
          else if (dClass === 'Structural_damage' || d.class === 'Structural Damage') structuralCount++;
        });
      });

      return {
        totalImagesProcessed: history.length,
        totalDefects: totalDefectsCount,
        defectsBreakdown: {
          Rust: rustCount,
          Dent: dentCount,
          Structural_damage: structuralCount
        },
        recentDetections: history.slice(0, 5)
      };
    }
  },

  // Get history: GET /history
  async getHistory() {
    try {
      const response = await apiClient.get('/history');
      return response.data;
    } catch (error) {
      return getLocalHistory();
    }
  },

  // Delete history item (INSTANT local storage update + non-blocking background API call)
  async deleteInspection(id) {
    const history = getLocalHistory().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // Non-blocking fire-and-forget delete call to FastAPI if online
    apiClient.delete(`/history/${id}`, { timeout: 1500 }).catch(() => {});

    return history;
  }
};

// Global Toast UI Notification System
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

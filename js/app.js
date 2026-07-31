/**
 * CRIS Wagon Defect Detection System - Application Controller (Home & Detection Result)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Page Element Selectors
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const folderInput = document.getElementById('folderInput');
  const browseBtn = document.getElementById('browseBtn');
  const browseFolderBtn = document.getElementById('browseFolderBtn');
  const detectBtn = document.getElementById('detectBtn');
  const detectBtnText = document.getElementById('detectBtnText');
  const previewImg = document.getElementById('previewImg');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const batchQueueContainer = document.getElementById('batchQueueContainer');
  const batchFileList = document.getElementById('batchFileList');
  const batchCountBadge = document.getElementById('batchCountBadge');
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  // Image Meta Labels
  const metaFileName = document.getElementById('metaFileName');
  const metaFileSize = document.getElementById('metaFileSize');
  const metaDimensions = document.getElementById('metaDimensions');

  let selectedFiles = []; // Array of File objects
  let previewDataUrl = null;

  // Initialize Page State
  if (dropZone) {
    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (browseFolderBtn && folderInput) {
      browseFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        folderInput.click();
      });
    }

    dropZone.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.parentElement.tagName !== 'BUTTON') {
        if (fileInput) fileInput.click();
      }
    });

    // Drag & Drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        handleFilesSelected(Array.from(dt.files));
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFilesSelected(Array.from(e.target.files));
        }
      });
    }

    if (folderInput) {
      folderInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFilesSelected(Array.from(e.target.files));
        }
      });
    }

    // Detect Defects Click
    if (detectBtn) {
      detectBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0 && !previewDataUrl) {
          showToast('Please select or upload wagon image(s) or a folder first.', 'error');
          return;
        }

        if (selectedFiles.length <= 1) {
          // Single Image Processing Mode (Identical Pipeline)
          showLoading(true, "Analyzing Wagon Image...");
          try {
            const formData = new FormData();
            const file = selectedFiles[0];

            if (file) {
              formData.append('file', file);
            } else {
              const response = await fetch(previewDataUrl);
              const blob = await response.blob();
              formData.append('file', blob, 'wagon_sample.png');
            }

            const result = await CRISApi.predictWagon(formData, previewDataUrl);
            sessionStorage.setItem('current_detection_result', JSON.stringify(result));
            showToast('Image analysis complete!', 'success');

            setTimeout(() => {
              window.location.href = 'result.html';
            }, 400);
          } catch (err) {
            console.error(err);
            showToast('Error processing image. Please try again.', 'error');
            showLoading(false);
          }
        } else {
          // Batch / Folder Processing Mode
          showLoading(true, `Analyzing Image 1 of ${selectedFiles.length}...`);
          try {
            const results = await CRISApi.predictWagonBatch(selectedFiles, (current, total, filename) => {
              showLoading(true, `Analyzing Image ${current} of ${total}: ${filename}`);
            });

            if (results && results.length > 0) {
              sessionStorage.setItem('current_detection_result', JSON.stringify(results[0]));
            }

            showToast(`Batch processing complete! Inspected ${results.length} wagon images.`, 'success');

            setTimeout(() => {
              window.location.href = 'history.html';
            }, 600);
          } catch (err) {
            console.error(err);
            showToast('Error processing batch. Please try again.', 'error');
            showLoading(false);
          }
        }
      });
    }
  }

  // Handle selected single or multiple files / folder
  function handleFilesSelected(files) {
    // Filter image files only
    const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|bmp|webp)$/i.test(f.name));

    if (imageFiles.length === 0) {
      showToast('No valid image files found in selection.', 'error');
      return;
    }

    selectedFiles = imageFiles;

    if (selectedFiles.length === 1) {
      // Single file mode
      const file = selectedFiles[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        previewDataUrl = e.target.result;
        updateSinglePreviewUI(previewDataUrl, file.name, (file.size / 1024).toFixed(1) + ' KB');
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files / Folder mode
      updateBatchPreviewUI(selectedFiles);
    }
  }

  // Single Image UI Preview
  function updateSinglePreviewUI(src, name, size) {
    if (previewImg) {
      previewImg.src = src;
      previewImg.style.display = 'block';
    }
    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
    if (batchQueueContainer) batchQueueContainer.style.display = 'none';
    if (batchCountBadge) batchCountBadge.style.display = 'none';

    // Get dimensions
    const tmpImg = new Image();
    tmpImg.onload = () => {
      if (metaDimensions) metaDimensions.textContent = `${tmpImg.width} × ${tmpImg.height} px`;
    };
    tmpImg.src = src;

    if (metaFileName) metaFileName.textContent = name;
    if (metaFileSize) metaFileSize.textContent = size;
    if (detectBtnText) detectBtnText.textContent = 'Detect Defects';
    if (detectBtn) detectBtn.disabled = false;

    showToast(`Loaded: ${name}`, 'info');
  }

  // Batch / Folder UI Preview
  function updateBatchPreviewUI(files) {
    if (previewImg) previewImg.style.display = 'none';
    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
    if (batchQueueContainer) batchQueueContainer.style.display = 'block';

    let totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
    let sizeStr = (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';

    if (batchCountBadge) {
      batchCountBadge.textContent = `${files.length} Files Selected`;
      batchCountBadge.style.display = 'inline-block';
    }

    if (batchFileList) {
      batchFileList.innerHTML = files.slice(0, 50).map((f, idx) => `
        <li style="padding:4px 8px; background:rgba(255,255,255,0.06); border-radius:4px; display:flex; justify-content:space-between;">
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:220px;">📄 ${f.webkitRelativePath || f.name}</span>
          <span style="color:#94A3B8;">${(f.size / 1024).toFixed(0)} KB</span>
        </li>
      `).join('') + (files.length > 50 ? `<li style="text-align:center; color:#94A3B8; margin-top:4px;">...and ${files.length - 50} more files</li>` : '');
    }

    if (metaFileName) metaFileName.textContent = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] + ' (Folder)' : `${files.length} Selected Images`;
    if (metaFileSize) metaFileSize.textContent = sizeStr;
    if (metaDimensions) metaDimensions.textContent = `Batch (${files.length} images)`;
    if (detectBtnText) detectBtnText.textContent = `Detect Defects in All ${files.length} Images`;
    if (detectBtn) detectBtn.disabled = false;

    showToast(`Loaded folder/batch containing ${files.length} wagon images.`, 'info');
  }

  function showLoading(active, message = "Analyzing Wagon Image...") {
    if (loadingOverlay) {
      const titleElem = loadingOverlay.querySelector('.loading-title');
      if (titleElem && message) titleElem.textContent = message;

      if (active) {
        loadingOverlay.classList.add('active');
      } else {
        loadingOverlay.classList.remove('active');
      }
    }
  }

  // Load sample image
  function loadSampleImage(src) {
    selectedFile = null;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      previewDataUrl = src;
      updatePreviewUI(src, src.split('/').pop(), 'Sample Image');
    };
    img.src = src;
  }

  // Update preview UI elements
  function updatePreviewUI(src, name, size) {
    if (previewImg) {
      previewImg.src = src;
      previewImg.style.display = 'block';
    }
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'none';
    }

    // Get dimensions
    const tmpImg = new Image();
    tmpImg.onload = () => {
      if (metaDimensions) metaDimensions.textContent = `${tmpImg.width} × ${tmpImg.height} px`;
    };
    tmpImg.src = src;

    if (metaFileName) metaFileName.textContent = name;
    if (metaFileSize) metaFileSize.textContent = size;

    if (detectBtn) {
      detectBtn.disabled = false;
    }

    showToast(`Loaded: ${name}`, 'info');
  }

  function showLoading(active) {
    if (loadingOverlay) {
      if (active) {
        loadingOverlay.classList.add('active');
      } else {
        loadingOverlay.classList.remove('active');
      }
    }
  }

  // =========================================================================
  // Detection Result Page Logic (if on result.html)
  // =========================================================================
  const originalViewImg = document.getElementById('originalViewImg');
  const resultCanvas = document.getElementById('resultCanvas');
  const defectTableBody = document.getElementById('defectTableBody');

  if (originalViewImg || resultCanvas) {
    renderDetectionResult();
  }

  function renderDetectionResult() {
    const storedData = sessionStorage.getItem('current_detection_result');
    if (!storedData) {
      // Use latest item from history if none in session
      const history = CRISApi.getHistory();
      if (history && history.length > 0) {
        displayResultData(history[0]);
      } else {
        showToast('No detection data found. Redirecting to Upload page.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
      }
      return;
    }

    const data = JSON.parse(storedData);
    displayResultData(data);
  }

  function displayResultData(data) {
    // Summary Cards
    const valTotalDefects = document.getElementById('valTotalDefects');
    const valHighestConf = document.getElementById('valHighestConf');
    const valProcTime = document.getElementById('valProcTime');
    const valConditionStatus = document.getElementById('valConditionStatus');

    if (valTotalDefects) valTotalDefects.textContent = data.totalDefects || 0;
    if (valHighestConf) valHighestConf.textContent = data.highestConfidence || '0%';
    if (valProcTime) valProcTime.textContent = data.processingTime || '1.1s';
    if (valConditionStatus) {
      valConditionStatus.textContent = data.status || 'Inspected';
      valConditionStatus.style.color = data.status === 'Action Required' ? 'var(--status-critical)' : 'var(--status-warning)';
    }

    // Set Original Image
    if (originalViewImg) {
      originalViewImg.src = data.image;
    }

    // Render Canvas Bounding Box Overlay
    if (resultCanvas) {
      const img = new Image();
      img.onload = () => {
        const container = resultCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Canvas internal size matches image resolution
        resultCanvas.width = img.naturalWidth || 800;
        resultCanvas.height = img.naturalHeight || 450;

        const ctx = resultCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, resultCanvas.width, resultCanvas.height);

        // Draw Bounding Boxes
        (data.detections || []).forEach(d => {
          const [ymin, xmin, ymax, xmax] = d.bbox || [100, 100, 200, 200];
          const width = xmax - xmin;
          const height = ymax - ymin;

          let color = '#EF4444'; // Red default (Rust / Critical)
          if (d.class === 'Dent') color = '#F59E0B'; // Amber (Dent)
          if (d.class === 'Structural_damage' || d.class === 'Structural Damage') color = '#991B1B'; // Dark Red (Structural Damage)

          // Box rectangle
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3, Math.floor(resultCanvas.width / 250));
          ctx.strokeRect(xmin, ymin, width, height);

          // Transparent fill
          ctx.fillStyle = color + '22';
          ctx.fillRect(xmin, ymin, width, height);

          // Label badge
          const label = `${d.class} ${(d.confidence * 100).toFixed(0)}%`;
          const fontSize = Math.max(14, Math.floor(resultCanvas.width / 45));
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const pad = 6;

          ctx.fillStyle = color;
          ctx.fillRect(xmin, Math.max(0, ymin - fontSize - pad * 2), textWidth + pad * 2, fontSize + pad * 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(label, xmin + pad, Math.max(fontSize, ymin - pad));
        });
      };
      img.src = data.image;
    }

    // Populate Defect Table
    if (defectTableBody) {
      defectTableBody.innerHTML = '';

      if (!data.detections || data.detections.length === 0) {
        defectTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No defects detected. Wagon is clean!</td></tr>`;
        return;
      }

      data.detections.forEach(d => {
        const tr = document.createElement('tr');
        const confPercent = Math.round(d.confidence * 100);
        const bboxStr = d.bbox ? `[${d.bbox.join(', ')}]` : 'N/A';

        let badgeClass = 'rust';
        if (d.class === 'Dent') badgeClass = 'dent';
        if (d.class === 'Structural_damage' || d.class === 'Structural Damage') badgeClass = 'structural';

        tr.innerHTML = `
          <td>
            <span class="defect-badge ${badgeClass}">${d.class}</span>
          </td>
          <td>
            <div class="confidence-bar-wrapper">
              <span style="font-weight:600;">${confPercent}%</span>
              <div class="confidence-track">
                <div class="confidence-fill ${confPercent > 90 ? 'high' : 'medium'}" style="width: ${confPercent}%;"></div>
              </div>
            </div>
          </td>
          <td><code style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-size:0.8rem; color:#475569;">${bboxStr}</code></td>
          <td>
            <span style="font-weight:600; color: ${d.status === 'Critical' ? 'var(--status-critical)' : 'var(--status-warning)'};">
              ${d.status || 'Active'}
            </span>
          </td>
        `;
        defectTableBody.appendChild(tr);
      });
    }
  }
});

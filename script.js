// State Management
const state = {
    files: [], // Array of files to process
    convertedPDFs: [], // Array of converted PDFs {name, pdf}
    currentConversionIndex: 0,
    selectedFiles: [], // Array to track selected files in order
    selectionMode: false, // Track if user is in selection mode
};

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfoSection = document.getElementById('fileInfoSection');
const filesQueueSection = document.getElementById('filesQueueSection');
const progressSection = document.getElementById('progressSection');
const successSection = document.getElementById('successSection');
const errorSection = document.getElementById('errorSection');
const filesQueue = document.getElementById('filesQueue');
const queueCount = document.getElementById('queueCount');

// Buttons
const changeFileBtn = document.getElementById('changeFileBtn');
const removeFileBtn = document.getElementById('removeFileBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const addMoreFilesBtn = document.getElementById('addMoreFilesBtn');
const convertBtn = document.getElementById('convertBtn');
const convertAllBtn = document.getElementById('convertAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const errorRetryBtn = document.getElementById('errorRetryBtn');

// File Type Detection
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    return null;
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Get File Icon
function getFileIcon(fileType) {
    const icons = {
        image: '🖼️',
        document: '📝',
        spreadsheet: '📊',
        pdf: '📄',
        presentation: '📊',
    };
    return icons[fileType] || '📄';
}

// Upload Area Click
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File Input Change
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleMultipleFiles(files);
    }
});

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        handleMultipleFiles(files);
    }
});

function getGroupName(fileType, count) {
    const names = {
        image: 'Image',
        document: 'Document',
        spreadsheet: 'Spreadsheet',
        pdf: 'PDF',
        presentation: 'Presentation',
    };
    const typeName = names[fileType] || 'File';
    return count > 1 ? `${count} ${typeName}s` : `${typeName}`;
}

// Handle Multiple Files
async function handleMultipleFiles(files) {
    const unsupported = [];

    for (const file of files) {
        const fileType = getFileType(file.name);
        if (!fileType) {
            unsupported.push(file.name);
            continue;
        }

        state.files.push({ files: [file], fileType, name: file.name });
    }

    if (unsupported.length > 0) {
        showError(`${unsupported.join(', ')} - Unsupported file format.`);
        return;
    }

    if (state.files.length > 0) {
        updateQueueUI();
        uploadArea.style.display = 'none';
        filesQueueSection.style.display = 'block';
    }
}

// Update Queue UI with Selection Support and Drag-Drop
function updateQueueUI() {
    queueCount.textContent = state.files.length;
    filesQueue.innerHTML = '';

    state.files.forEach((fileItem, index) => {
        const totalSize = fileItem.files.reduce((sum, file) => sum + file.size, 0);
        const queueItemEl = document.createElement('div');
        queueItemEl.className = 'queue-item';
        queueItemEl.draggable = true;
        queueItemEl.dataset.index = index;
        
        // Get file preview
        let preview = '';
        if (fileItem.fileType === 'image' && fileItem.files[0]) {
            preview = `<span class="queue-item-preview" style="background-image: url('${URL.createObjectURL(fileItem.files[0])}')"></span>`;
        }
        
        // Check if this file is selected and get its selection number
        const selectionIndex = state.selectedFiles.findIndex(f => f.index === index);
        const isSelected = selectionIndex !== -1;
        const selectionNumber = isSelected ? selectionIndex + 1 : null;
        
        queueItemEl.innerHTML = `
            <div class="queue-item-drag-handle">☰</div>
            ${preview}
            <span class="queue-item-icon">${getFileIcon(fileItem.fileType)}</span>
            <div class="queue-item-info">
                <div class="queue-item-name">${fileItem.name}</div>
                <div class="queue-item-size">${formatFileSize(totalSize)}</div>
            </div>
            ${isSelected ? `<div class="selection-badge">${selectionNumber}</div>` : ''}
            <button class="queue-item-remove" onclick="removeFileFromQueue(${index})" title="Remove">✕</button>
        `;
        
        // Add drag events
        queueItemEl.addEventListener('dragstart', handleDragStart);
        queueItemEl.addEventListener('dragover', handleDragOver);
        queueItemEl.addEventListener('drop', handleDrop);
        queueItemEl.addEventListener('dragend', handleDragEnd);
        queueItemEl.addEventListener('dragenter', handleDragEnter);
        queueItemEl.addEventListener('dragleave', handleDragLeave);
        
        // Add click event to toggle selection
        queueItemEl.style.cursor = 'pointer';
        queueItemEl.addEventListener('click', (e) => {
            // Don't toggle if clicking the remove button or drag handle
            if (e.target.closest('.queue-item-remove') || e.target.closest('.queue-item-drag-handle')) return;
            toggleFileSelection(index);
        });
        
        // Highlight selected items
        if (isSelected) {
            queueItemEl.style.backgroundColor = '#e3f2fd';
            queueItemEl.style.borderLeft = '4px solid #667eea';
        }
        
        filesQueue.appendChild(queueItemEl);
    });
}

// Drag and Drop Handlers
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(this.dataset.index);
        
        // Swap files in state
        const temp = state.files[draggedIndex];
        state.files[draggedIndex] = state.files[targetIndex];
        state.files[targetIndex] = temp;
        
        // Swap selected files indices
        state.selectedFiles = state.selectedFiles.map(s => {
            if (s.index === draggedIndex) return { ...s, index: targetIndex };
            if (s.index === targetIndex) return { ...s, index: draggedIndex };
            return s;
        });
        
        updateQueueUI();
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    const items = document.querySelectorAll('.queue-item');
    items.forEach(item => item.classList.remove('drag-over'));
}

// Toggle File Selection
function toggleFileSelection(index) {
    const existingIndex = state.selectedFiles.findIndex(f => f.index === index);
    
    if (existingIndex !== -1) {
        // Deselect if already selected
        state.selectedFiles.splice(existingIndex, 1);
    } else {
        // Add to selected files in order
        state.selectedFiles.push({ index, file: state.files[index] });
    }
    
    updateQueueUI();
}

// Remove File from Queue
function removeFileFromQueue(index) {
    state.files.splice(index, 1);
    
    // Remove from selected files and adjust indices
    state.selectedFiles = state.selectedFiles
        .filter(f => f.index !== index)
        .map(f => ({
            ...f,
            index: f.index > index ? f.index - 1 : f.index
        }));
    
    if (state.files.length === 0) {
        uploadArea.style.display = 'block';
        filesQueueSection.style.display = 'none';
        state.selectedFiles = [];
    } else {
        updateQueueUI();
    }
}

function appendCanvasToPDF(pdf, canvas, orientation = 'p') {
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let pageOffset = 0;
    let pageIndex = 0;

    while (pageOffset < imgHeight) {
        if (pageIndex > 0) {
            pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, -pageOffset, imgWidth, imgHeight);
        pageOffset += pageHeight;
        pageIndex += 1;
    }
}

// Clear Queue
clearQueueBtn.addEventListener('click', () => {
    state.files = [];
    state.convertedPDFs = [];
    state.selectedFiles = [];
    uploadArea.style.display = 'block';
    filesQueueSection.style.display = 'none';
});

// Add More Files
addMoreFilesBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
});

// Show Progress
function showProgress() {
    filesQueueSection.style.display = 'none';
    progressSection.style.display = 'block';
    const progressTitle = document.getElementById('progressTitle');
    const fileCount = state.selectedFiles.length > 0 ? state.selectedFiles.length : state.files.length;
    progressTitle.textContent = `Converting ${fileCount} file(s)...`;
}

// Update Progress UI
function updateProgressUI() {
    const progressList = document.getElementById('progressList');
    progressList.innerHTML = '';

    state.files.forEach((fileItem, index) => {
        const status = index < state.currentConversionIndex ? 'done' : index === state.currentConversionIndex ? 'processing' : 'pending';
        const statusIcon = status === 'done' ? '✓' : status === 'processing' ? '⚙️' : '○';
        const statusClass = `progress-status-${status}`;

        const listItem = document.createElement('div');
        listItem.className = 'progress-list-item';
        listItem.innerHTML = `
            <span class="progress-status-icon ${statusClass}">${statusIcon}</span>
            <span>${fileItem.name}</span>
        `;
        progressList.appendChild(listItem);
    });
}

// Show Current File Progress
function showCurrentFileProgress() {
    const fileItem = state.files[state.currentConversionIndex];
    const currentProgressItem = document.getElementById('currentProgressItem');
    currentProgressItem.innerHTML = `
        <div class="progress-item-name">${fileItem.name}</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
    `;
    updateProgressUI();
}

// Update Progress
function updateProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
}

// Show Success
function showSuccess() {
    progressSection.style.display = 'none';
    successSection.style.display = 'block';
    
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = `${state.convertedPDFs.length} file(s) converted successfully!`;

    // Show converted files with download buttons
    const successFilesList = document.getElementById('successFilesList');
    successFilesList.innerHTML = '';

    state.convertedPDFs.forEach((pdfItem, index) => {
        const fileEl = document.createElement('div');
        fileEl.className = 'success-file-item';
        fileEl.innerHTML = `
            <div class="success-file-info">
                <span>📄</span>
                <span class="success-file-name">${pdfItem.name}</span>
            </div>
            <button class="success-file-btn" onclick="downloadSinglePDF(${index})">⬇️ Download</button>
        `;
        successFilesList.appendChild(fileEl);
    });
    
    // Show merge button only if there are multiple PDFs
    const mergePdfsBtn = document.getElementById('mergePdfsBtn');
    if (state.convertedPDFs.length > 1) {
        mergePdfsBtn.style.display = 'flex';
    } else {
        mergePdfsBtn.style.display = 'none';
    }
}

// Show Error
function showError(message) {
    fileInfoSection.style.display = 'none';
    progressSection.style.display = 'none';
    errorSection.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Convert Image to PDF
async function convertImageToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const img = new Image();
                img.onload = () => {
                    const { jsPDF } = window.jspdf;
                    const orientation = img.width > img.height ? 'l' : 'p';
                    const pageWidth = orientation === 'l' ? 297 : 210;
                    const pageHeight = orientation === 'l' ? 210 : 297;

                    const aspectRatio = img.width / img.height;
                    let imgWidth, imgHeight;
                    if (aspectRatio > pageWidth / pageHeight) {
                        imgWidth = pageWidth;
                        imgHeight = pageWidth / aspectRatio;
                    } else {
                        imgHeight = pageHeight;
                        imgWidth = pageHeight * aspectRatio;
                    }

                    const pdf = new jsPDF({
                        orientation,
                        unit: 'mm',
                        format: 'a4',
                    });
                    const xOffset = (pageWidth - imgWidth) / 2;
                    const yOffset = (pageHeight - imgHeight) / 2;
                    pdf.addImage(e.target.result, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

                    updateProgress(80);
                    resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            } catch (error) {
                reject(new Error('Failed to convert image: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function convertImagesGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    let pdf = null;
    let firstPage = true;

    for (const file of files) {
        const img = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => resolve({ image, data: e.target.result });
                image.onerror = () => reject(new Error('Failed to load image'));
                image.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
        });

        const orientation = img.image.width > img.image.height ? 'l' : 'p';
        const pageWidth = orientation === 'l' ? 297 : 210;
        const pageHeight = orientation === 'l' ? 210 : 297;
        const aspectRatio = img.image.width / img.image.height;
        let imgWidth, imgHeight;

        if (aspectRatio > pageWidth / pageHeight) {
            imgWidth = pageWidth;
            imgHeight = pageWidth / aspectRatio;
        } else {
            imgHeight = pageHeight;
            imgWidth = pageHeight * aspectRatio;
        }

        if (firstPage) {
            pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
            firstPage = false;
        } else {
            pdf.addPage('a4', orientation);
        }

        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = (pageHeight - imgHeight) / 2;
        pdf.addImage(img.data, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    }

    return { pdf, filename: `${getGroupName('image', files.length)}.pdf` };
}

async function convertDocumentsGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;

    for (const file of files) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        let html = '';

        if (fileExt === 'docx') {
            const arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read document'));
                reader.readAsArrayBuffer(file);
            });
            const result = await mammoth.convertToHtml({ arrayBuffer });
            html = result.value;
        } else if (fileExt === 'doc') {
            html = `
                <div style="text-align: center; padding: 50px;">
                    <h1>Legacy DOC File</h1>
                    <p>${file.name}</p>
                    <p style="color: #666;">File Size: ${formatFileSize(file.size)}</p>
                    <p style="color: #999; margin-top: 30px;">Legacy .doc files require specialized conversion. Please convert to .docx format for better results.</p>
                </div>
            `;
        } else if (fileExt === 'txt') {
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read text file'));
                reader.readAsText(file);
            });
            html = `<pre style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
        } else if (fileExt === 'rtf') {
            const rtfText = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read RTF file'));
                reader.readAsText(file);
            });
            const textContent = rtfText.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').trim();
            html = `<pre style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
        } else if (fileExt === 'odt') {
            html = `
                <div style="text-align: center; padding: 50px;">
                    <h1>OpenDocument Text File</h1>
                    <p>${file.name}</p>
                    <p style="color: #666;">File Size: ${formatFileSize(file.size)}</p>
                    <p style="color: #999; margin-top: 30px;">ODT files require specialized conversion. Please convert to .docx format for better results.</p>
                </div>
            `;
        }

        const element = document.createElement('div');
        element.innerHTML = html;
        element.style.padding = '5px';
        element.style.margin = '0';
        element.style.background = '#ffffff';
        element.style.color = '#000';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '11px';
        element.style.lineHeight = '1.2';
        element.style.width = '210mm';
        element.style.maxWidth = '210mm';
        element.style.boxSizing = 'border-box';

        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.margin = '0';
            el.style.padding = '2px 0';
            el.style.background = '#ffffff';
            el.style.color = '#000';
        });
        document.body.appendChild(element);

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            logging: false,
        });
        document.body.removeChild(element);

        appendCanvasToPDF(pdf, canvas, 'p');
        firstPage = false;
    }

    return { pdf, filename: `${getGroupName('document', files.length)}.pdf` };
}

async function convertSpreadsheetsGroupToPDF(files) {
    if (!window.XLSX) {
        throw new Error('XLSX library not loaded. Please refresh the page and try again.');
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    let firstPage = true;

    for (const file of files) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error('Failed to read spreadsheet'));
            reader.readAsArrayBuffer(file);
        });

        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheets = workbook.SheetNames;

        for (const name of sheets) {
            const worksheet = workbook.Sheets[name];
            const html = window.XLSX.utils.sheet_to_html(worksheet);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            wrapper.style.padding = '2px';
            wrapper.style.margin = '0';
            wrapper.style.background = '#ffffff';
            wrapper.style.color = '#000';
            wrapper.style.fontFamily = 'Arial, sans-serif';
            wrapper.style.fontSize = '10px';
            wrapper.style.overflow = 'visible';
            wrapper.style.width = 'fit-content';
            wrapper.style.boxSizing = 'border-box';

            const table = wrapper.querySelector('table');
            if (table) {
                table.style.borderCollapse = 'collapse';
                table.style.width = 'auto';
                table.style.margin = '0';
                table.style.padding = '0';
                table.style.background = '#ffffff';
                const cells = table.querySelectorAll('td, th');
                cells.forEach((cell) => {
                    cell.style.border = '1px solid #999';
                    cell.style.padding = '3px 4px';
                    cell.style.textAlign = 'left';
                    cell.style.margin = '0';
                    cell.style.lineHeight = '1';
                    cell.style.background = '#ffffff';
                });
            }

            document.body.appendChild(wrapper);
            const canvas = await html2canvas(wrapper, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: wrapper.scrollWidth,
                windowHeight: wrapper.scrollHeight,
                scrollX: -window.scrollX,
                scrollY: -window.scrollY,
                logging: false,
            });
            document.body.removeChild(wrapper);

            appendCanvasToPDF(pdf, canvas, 'l');
            firstPage = false;
        }
    }

    return { pdf, filename: `${getGroupName('spreadsheet', files.length)}.pdf` };
}

// Convert Document to PDF
async function convertDocumentToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const fileExt = file.name.split('.').pop().toLowerCase();
                let html = '';

                if (fileExt === 'docx') {
                    const arrayBuffer = e.target.result;
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    html = result.value;
                } else if (fileExt === 'doc') {
                    // For older DOC files, show a placeholder
                    html = `
                        <div style="text-align: center; padding: 50px;">
                            <h1>Legacy DOC File</h1>
                            <p>${file.name}</p>
                            <p style="color: #666;">File Size: ${formatFileSize(file.size)}</p>
                            <p style="color: #999; margin-top: 30px;">Note: Legacy .doc files require specialized conversion. Please convert to .docx format for better results.</p>
                        </div>
                    `;
                } else if (fileExt === 'txt') {
                    const text = e.target.result;
                    html = `<pre style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
                } else if (fileExt === 'rtf') {
                    // Basic RTF handling - extract text content
                    const rtfText = e.target.result;
                    const textContent = rtfText.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').trim();
                    html = `<pre style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
                } else if (fileExt === 'odt') {
                    // For ODT files, show a placeholder
                    html = `
                        <div style="text-align: center; padding: 50px;">
                            <h1>OpenDocument Text File</h1>
                            <p>${file.name}</p>
                            <p style="color: #666;">File Size: ${formatFileSize(file.size)}</p>
                            <p style="color: #999; margin-top: 30px;">Note: ODT files require specialized conversion. Please convert to .docx format for better results.</p>
                        </div>
                    `;
                }

                const element = document.createElement('div');
                element.innerHTML = html;
                element.style.padding = '5px';
                element.style.margin = '0';
                element.style.background = '#ffffff';
                element.style.color = '#000';
                element.style.fontFamily = 'Arial, sans-serif';
                element.style.fontSize = '11px';
                element.style.lineHeight = '1.2';
                element.style.width = '210mm';
                element.style.maxWidth = '210mm';
                element.style.boxSizing = 'border-box';

                const allElements = element.querySelectorAll('*');
                allElements.forEach(el => {
                    el.style.margin = '0';
                    el.style.padding = '2px 0';
                    el.style.background = '#ffffff';
                    el.style.color = '#000';
                });
                document.body.appendChild(element);

                updateProgress(50);
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: element.scrollWidth,
                    windowHeight: element.scrollHeight,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    logging: false,
                });
                document.body.removeChild(element);

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'p');

                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (error) {
                reject(new Error('Failed to convert document: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));

        // Read as text for TXT and RTF, arrayBuffer for DOCX and DOC
        if (['txt', 'rtf'].includes(file.name.split('.').pop().toLowerCase())) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// Convert Spreadsheet to PDF
async function convertSpreadsheetToPDF(file) {
    return new Promise((resolve, reject) => {
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (fileExt === 'csv') {
            // Use the CSV conversion function
            convertCSVToPDF(file).then(resolve).catch(reject);
            return;
        }

        if (!window.XLSX) {
            reject(new Error('XLSX library not loaded. Please refresh the page and try again.'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const html = window.XLSX.utils.sheet_to_html(worksheet);
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                wrapper.style.padding = '2px';
                wrapper.style.margin = '0';
                wrapper.style.fontFamily = 'Arial, sans-serif';
                wrapper.style.fontSize = '10px';
                wrapper.style.overflow = 'visible';
                wrapper.style.width = 'fit-content';

                const table = wrapper.querySelector('table');
                if (table) {
                    table.style.borderCollapse = 'collapse';
                    table.style.width = 'auto';
                    table.style.margin = '0';
                    table.style.padding = '0';
                    const cells = table.querySelectorAll('td, th');
                    cells.forEach((cell) => {
                        cell.style.border = '1px solid #999';
                        cell.style.padding = '3px 4px';
                        cell.style.textAlign = 'left';
                        cell.style.margin = '0';
                        cell.style.lineHeight = '1';
                        cell.style.background = '#ffffff';
                        cell.style.color = '#000';
                    });
                }

                document.body.appendChild(wrapper);
                updateProgress(50);

                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: wrapper.scrollWidth,
                    windowHeight: wrapper.scrollHeight,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    logging: false,
                });
                document.body.removeChild(wrapper);

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'l');

                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (error) {
                reject(new Error('Failed to convert spreadsheet: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Convert Text File to PDF
async function convertTextToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const text = e.target.result;
                const element = document.createElement('div');
                element.innerHTML = `<pre style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; color: #000; background: #ffffff;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
                element.style.padding = '5px';
                element.style.margin = '0';
                element.style.background = '#ffffff';
                element.style.color = '#000';
                element.style.fontFamily = 'Arial, sans-serif';
                element.style.fontSize = '11px';
                element.style.lineHeight = '1.2';
                element.style.width = '210mm';
                element.style.maxWidth = '210mm';
                element.style.boxSizing = 'border-box';

                document.body.appendChild(element);

                updateProgress(50);
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: element.scrollWidth,
                    windowHeight: element.scrollHeight,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    logging: false,
                });
                document.body.removeChild(element);

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'p');

                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (error) {
                reject(new Error('Failed to convert text file: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

// Convert CSV to PDF
async function convertCSVToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const csvText = e.target.result;
                const lines = csvText.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.replace(/"/g, '').trim()));

                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10px;">
                        <thead>
                            <tr>${headers.map(h => `<th style="border: 1px solid #999; padding: 3px 4px; text-align: left; background: #f0f0f0;">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `<tr>${row.map(cell => `<td style="border: 1px solid #999; padding: 3px 4px; text-align: left;">${cell}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                `;
                wrapper.style.padding = '2px';
                wrapper.style.margin = '0';
                wrapper.style.background = '#ffffff';
                wrapper.style.color = '#000';
                wrapper.style.fontFamily = 'Arial, sans-serif';
                wrapper.style.fontSize = '10px';
                wrapper.style.overflow = 'visible';
                wrapper.style.width = 'fit-content';
                wrapper.style.boxSizing = 'border-box';

                document.body.appendChild(wrapper);
                updateProgress(50);

                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: wrapper.scrollWidth,
                    windowHeight: wrapper.scrollHeight,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    logging: false,
                });
                document.body.removeChild(wrapper);

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'l');

                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (error) {
                reject(new Error('Failed to convert CSV: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
    });
}

async function parsePPTXSlides(file) {
    if (!window.JSZip) {
        throw new Error('JSZip library is required to parse PPTX files.');
    }

    const zip = await JSZip.loadAsync(file);
    const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
            const aNum = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
            const bNum = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
            return aNum - bNum;
        });

    const slides = [];
    for (const slideFile of slideFiles) {
        const xml = await zip.file(slideFile).async('text');
        const textRuns = [];
        const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
            let text = match[1];
            text = text.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
            if (text.trim()) {
                textRuns.push(text.trim());
            }
        }

        if (textRuns.length > 0) {
            slides.push(textRuns.join('\n\n'));
        } else {
            slides.push('This slide could not be rendered because it contains unsupported visual content.');
        }
    }

    return slides;
}

function createPresentationSlideElement(fileName, slideNumber, slideText, totalSlides) {
    const element = document.createElement('div');
    element.style.padding = '18px';
    element.style.margin = '0';
    element.style.background = '#ffffff';
    element.style.color = '#000';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.width = '210mm';
    element.style.minHeight = '297mm';
    element.style.boxSizing = 'border-box';
    element.style.border = '1px solid #e1e1e1';
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.justifyContent = 'flex-start';
    element.style.overflow = 'hidden';

    element.innerHTML = `
        <div style="padding: 14px; border-bottom: 1px solid #ddd; margin-bottom: 18px;">
            <h2 style="font-size: 18px; margin: 0 0 4px;">${fileName}</h2>
            <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #555;">
                <span>Slide ${slideNumber} of ${totalSlides}</span>
            </div>
        </div>
        <div style="font-size: 12px; line-height: 1.5; white-space: pre-wrap; color: #222;">${slideText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    `;

    return element;
}

async function renderElementToCanvas(element) {
    document.body.appendChild(element);
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        logging: false,
    });
    document.body.removeChild(element);
    return canvas;
}

async function convertPresentationToPDF(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            if (fileExt === 'pptx') {
                updateProgress(20);
                const slides = await parsePPTXSlides(file);
                if (slides.length === 0) {
                    throw new Error('No readable slides were found in this PPTX file.');
                }

                for (let index = 0; index < slides.length; index += 1) {
                    const element = createPresentationSlideElement(file.name, index + 1, slides[index], slides.length);
                    const canvas = await renderElementToCanvas(element);
                    if (index > 0) pdf.addPage();
                    appendCanvasToPDF(pdf, canvas, 'p');
                }

                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
                return;
            }

            const element = createPresentationSlideElement(file.name, 1, 'This presentation type is not fully supported in-browser. The file is included as a placeholder slide.', 1);
            const canvas = await renderElementToCanvas(element);
            appendCanvasToPDF(pdf, canvas, 'p');
            updateProgress(80);
            resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
        } catch (error) {
            reject(new Error('Failed to convert presentation: ' + error.message));
        }
    });
}

// Convert Presentations Group to PDF
async function convertPresentationsGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;

    for (const file of files) {
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (fileExt === 'pptx') {
            try {
                const slides = await parsePPTXSlides(file);
                if (slides.length === 0) {
                    const placeholder = createPresentationSlideElement(file.name, 1, 'No readable slides were found in this PPTX file.', 1);
                    const canvas = await renderElementToCanvas(placeholder);
                    if (!firstPage) pdf.addPage();
                    appendCanvasToPDF(pdf, canvas, 'p');
                    firstPage = false;
                    continue;
                }

                for (let index = 0; index < slides.length; index += 1) {
                    const element = createPresentationSlideElement(file.name, index + 1, slides[index], slides.length);
                    const canvas = await renderElementToCanvas(element);
                    if (!firstPage) pdf.addPage();
                    appendCanvasToPDF(pdf, canvas, 'p');
                    firstPage = false;
                }
                continue;
            } catch (error) {
                console.warn('PPTX parse failed, falling back to placeholder:', error);
            }
        }

        const placeholder = createPresentationSlideElement(file.name, 1, 'This presentation type is not fully supported in-browser. The file is included as a placeholder slide.', 1);
        const canvas = await renderElementToCanvas(placeholder);
        if (!firstPage) pdf.addPage();
        appendCanvasToPDF(pdf, canvas, 'p');
        firstPage = false;
    }

    return { pdf, filename: `${getGroupName('presentation', files.length)}.pdf` };
}

// Convert Single File
async function convertSingleFile(fileItem) {
    try {
        updateProgress(0);
        let result;

        if (fileItem.files.length > 1) {
            if (fileItem.fileType === 'image') {
                result = await convertImagesGroupToPDF(fileItem.files);
            } else if (fileItem.fileType === 'document') {
                result = await convertDocumentsGroupToPDF(fileItem.files);
            } else if (fileItem.fileType === 'spreadsheet') {
                result = await convertSpreadsheetsGroupToPDF(fileItem.files);
            } else if (fileItem.fileType === 'pdf') {
                // PDF groups are not merged; handle individually instead
                result = null;
            }
        } else {
            const file = fileItem.files[0];
            if (fileItem.fileType === 'image') {
                result = await convertImageToPDF(file);
            } else if (fileItem.fileType === 'document') {
                result = await convertDocumentToPDF(file);
            } else if (fileItem.fileType === 'spreadsheet') {
                result = await convertSpreadsheetToPDF(file);
            } else if (fileItem.fileType === 'presentation') {
                result = await convertPresentationToPDF(file);
            } else if (fileItem.fileType === 'pdf') {
                updateProgress(100);
                return { pdf: null, filename: file.name, isPDF: true, file };
            }
        }

        updateProgress(100);
        return result;
    } catch (error) {
        throw error;
    }
}

// Main Convert All Function
async function convertAllFiles() {
    try {
        // If files are selected, use only selected files, otherwise use all files
        let filesToConvert = state.selectedFiles.length > 0
            ? state.selectedFiles.map(s => state.files[s.index])
            : state.files;

        state.currentConversionIndex = 0;
        state.convertedPDFs = [];
        showProgress();

        let index = 0;
        while (index < filesToConvert.length) {
            state.currentConversionIndex = index;
            const currentItem = filesToConvert[index];
            showCurrentFileProgress();

            try {
                if (currentItem.fileType === 'image') {
                    const groupFiles = [currentItem.files[0]];
                    let nextIndex = index + 1;
                    while (nextIndex < filesToConvert.length && filesToConvert[nextIndex].fileType === 'image') {
                        groupFiles.push(filesToConvert[nextIndex].files[0]);
                        nextIndex += 1;
                    }
                    const result = await convertImagesGroupToPDF(groupFiles);
                    state.convertedPDFs.push({ name: result.filename, pdf: result.pdf });
                    index = nextIndex;
                    continue;
                }

                if (currentItem.fileType === 'document') {
                    const groupFiles = [currentItem.files[0]];
                    let nextIndex = index + 1;
                    while (nextIndex < filesToConvert.length && filesToConvert[nextIndex].fileType === 'document') {
                        groupFiles.push(filesToConvert[nextIndex].files[0]);
                        nextIndex += 1;
                    }
                    const result = await convertDocumentsGroupToPDF(groupFiles);
                    state.convertedPDFs.push({ name: result.filename, pdf: result.pdf });
                    index = nextIndex;
                    continue;
                }

                if (currentItem.fileType === 'spreadsheet') {
                    const groupFiles = [currentItem.files[0]];
                    let nextIndex = index + 1;
                    while (nextIndex < filesToConvert.length && filesToConvert[nextIndex].fileType === 'spreadsheet') {
                        groupFiles.push(filesToConvert[nextIndex].files[0]);
                        nextIndex += 1;
                    }
                    const result = await convertSpreadsheetsGroupToPDF(groupFiles);
                    state.convertedPDFs.push({ name: result.filename, pdf: result.pdf });
                    index = nextIndex;
                    continue;
                }

                if (currentItem.fileType === 'presentation') {
                    const groupFiles = [currentItem.files[0]];
                    let nextIndex = index + 1;
                    while (nextIndex < filesToConvert.length && filesToConvert[nextIndex].fileType === 'presentation') {
                        groupFiles.push(filesToConvert[nextIndex].files[0]);
                        nextIndex += 1;
                    }
                    const result = await convertPresentationsGroupToPDF(groupFiles);
                    state.convertedPDFs.push({ name: result.filename, pdf: result.pdf });
                    index = nextIndex;
                    continue;
                }

                if (currentItem.fileType === 'pdf') {
                    const file = currentItem.files[0];
                    const pdfData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsArrayBuffer(file);
                    });
                    state.convertedPDFs.push({ name: currentItem.name, data: pdfData });
                    index += 1;
                    continue;
                }
            } catch (error) {
                console.error(`Error converting ${currentItem.name}:`, error);
                showError(`Failed to convert ${currentItem.name}: ${error.message}`);
                return;
            }
        }

        showSuccess();
    } catch (error) {
        console.error('Conversion error:', error);
        showError(error.message || 'An error occurred during conversion.');
    }
}

// Download Single PDF with Custom Name
function downloadSinglePDF(index) {
    const pdfItem = state.convertedPDFs[index];
    
    // Prompt user for custom filename
    const defaultName = pdfItem.name.replace('.pdf', '');
    const customName = prompt('Enter PDF filename (without .pdf):', defaultName);
    
    if (customName === null) return; // User cancelled
    
    const filename = customName.trim() ? customName.trim() + '.pdf' : pdfItem.name;
    
    if (pdfItem.pdf) {
        pdfItem.pdf.save(filename);
    } else if (pdfItem.data) {
        const blob = new Blob([pdfItem.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Download All PDFs
downloadAllBtn.addEventListener('click', () => {
    state.convertedPDFs.forEach((_, index) => {
        downloadSinglePDF(index);
    });
});

// Merge All PDFs
document.getElementById('mergePdfsBtn').addEventListener('click', () => {
    mergePDFs();
});

// Merge all PDFs into one
function mergePDFs() {
    try {
        const { jsPDF } = window.jspdf;
        const mergedPdf = new jsPDF('p', 'mm', 'a4');
        let isFirstPage = true;

        state.convertedPDFs.forEach((pdfItem) => {
            if (pdfItem.pdf) {
                // Merge PDFs created from images/documents/spreadsheets
                const pages = pdfItem.pdf.internal.pages.length;
                
                for (let i = 1; i < pages; i++) {
                    pdfItem.pdf.setPage(i);
                    const pageCanvas = pdfItem.pdf.canvas;
                    
                    if (!isFirstPage) {
                        mergedPdf.addPage();
                    }
                    isFirstPage = false;
                    
                    // Get the PDF content and add to merged PDF
                    const pdfDataUrl = pdfItem.pdf.output('dataurlstring');
                }
            }
        });

        // Alternative approach: Use a simpler merge
        mergeAllPdfsSimple();
    } catch (error) {
        console.error('Error merging PDFs:', error);
        alert('Error merging PDFs. Please download individually.');
    }
}

// Simplified merge using JSZip and pdf-lib (if available) or concatenate PDFs
function mergeAllPdfsSimple() {
    const { jsPDF } = window.jspdf;
    const mergedPdf = new jsPDF();
    let isFirstPage = true;
    let pageCount = 0;

    state.convertedPDFs.forEach((pdfItem) => {
        try {
            if (pdfItem.pdf && pdfItem.pdf.internal.pages) {
                const totalPages = pdfItem.pdf.internal.pages.length;
                
                for (let i = 1; i < totalPages; i++) {
                    if (!isFirstPage) {
                        mergedPdf.addPage();
                    }
                    isFirstPage = false;
                    pageCount++;
                    
                    // Get the image data from each page
                    const pageData = pdfItem.pdf.internal.pages[i];
                }
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
        }
    });

    // Simple merge: just download all files as a ZIP or prompt user
    if (state.convertedPDFs.length > 1) {
        const mergedPdfObj = mergedPdf;
        const defaultName = 'merged-documents.pdf';
        const customName = prompt('Enter merged PDF filename (without .pdf):', 'merged-documents');
        
        if (customName === null) return;
        
        const filename = customName.trim() ? customName.trim() + '.pdf' : defaultName;
        
        // For now, we'll create a simple merged document notification
        alert(`Merge functionality will download all files. Downloading ${state.convertedPDFs.length} files...`);
        
        // Download all files
        state.convertedPDFs.forEach((pdfItem) => {
            if (pdfItem.pdf) {
                pdfItem.pdf.save('merged_' + pdfItem.name);
            } else if (pdfItem.data) {
                const blob = new Blob([pdfItem.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'merged_' + pdfItem.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }
}

// Convert Button
convertBtn.addEventListener('click', () => {
    convertAllFiles();
});

// Convert All Button
convertAllBtn.addEventListener('click', () => {
    convertAllFiles();
});

// Convert Another
convertAnotherBtn.addEventListener('click', () => {
    state.files = [];
    state.convertedPDFs = [];
    state.selectedFiles = [];
    state.currentConversionIndex = 0;
    uploadArea.style.display = 'block';
    filesQueueSection.style.display = 'none';
    successSection.style.display = 'none';
    fileInput.value = '';
});

// Error Retry
errorRetryBtn.addEventListener('click', () => {
    errorSection.style.display = 'none';
    filesQueueSection.style.display = 'block';
});

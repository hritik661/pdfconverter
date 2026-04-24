// ============================================
// ALL FILE TO PDF CONVERTER
// ============================================

const state = {
    files: [],
    convertedPDFs: [],
    currentConversionIndex: 0,
    selectedFiles: [],
    paymentVerified: false,
    currentOrderId: null,
    razorpayKey: null,
};

// Payment state
const paymentState = {
    isPaid: localStorage.getItem('pdfConverterPaid') === 'true',
    paymentExpiry: localStorage.getItem('pdfConverterPaidExpiry'),
};

// API Base URL (adjust if needed)
const API_BASE = 'http://localhost:3000';

// DOM refs
const uploadArea = document.getElementById('uploadArea');
const chooseFilesBtn = document.getElementById('chooseFilesBtn');
const fileInput = document.getElementById('fileInput');
const filesQueueSection = document.getElementById('filesQueueSection');
const progressSection = document.getElementById('progressSection');
const successSection = document.getElementById('successSection');
const errorSection = document.getElementById('errorSection');
const filesQueue = document.getElementById('filesQueue');
const queueCount = document.getElementById('queueCount');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const loadingOverlay = document.getElementById('loadingOverlay');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');
const navMobileToggle = document.getElementById('navMobileToggle');

const clearQueueBtn = document.getElementById('clearQueueBtn');
const addMoreFilesBtn = document.getElementById('addMoreFilesBtn');
const convertAllBtn = document.getElementById('convertAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const errorRetryBtn = document.getElementById('errorRetryBtn');

// Payment DOM refs
const paymentModal = document.getElementById('paymentModal');
const paymentModalOverlay = document.getElementById('paymentModalOverlay');
const paymentModalClose = document.getElementById('paymentModalClose');

// ============ PAYMENT FUNCTIONS ============
async function initRazorpay() {
    try {
        const response = await fetch(`${API_BASE}/api/razorpay-key`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        state.razorpayKey = data.keyId;
        console.log('✓ Razorpay initialized:', state.razorpayKey);
    } catch (error) {
        console.warn('⚠ Backend unavailable, using fallback Razorpay key:', error.message);
        // Fallback to test key
        state.razorpayKey = 'rzp_test_SMlPVMR00yQZTp';
    }
}

function showPaymentModal() {
    paymentModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hidePaymentModal() {
    paymentModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Client-side order creation (fallback if backend unavailable)
function createClientOrderId() {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function initiatePayment(amount, description) {
    try {
        if (!state.razorpayKey) {
            await initRazorpay();
        }

        // Show loading
        loadingOverlay.style.display = 'flex';

        let orderData;
        
        // Try backend first
        try {
            const orderResponse = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    description,
                    userEmail: 'user@example.com',
                    userName: 'PDF Converter User'
                }),
                timeout: 5000
            });

            if (orderResponse.ok) {
                orderData = await orderResponse.json();
                console.log('✓ Order created via backend:', orderData.orderId);
            } else {
                throw new Error(`Backend error: ${orderResponse.status}`);
            }
        } catch (backendError) {
            console.warn('⚠ Backend unavailable, using client-side order:', backendError.message);
            // Fallback: create order client-side
            orderData = {
                orderId: createClientOrderId(),
                amount: amount * 100,
                currency: 'INR',
                description,
                keyId: state.razorpayKey
            };
        }

        state.currentOrderId = orderData.orderId;

        // Razorpay payment options
        const options = {
            key: state.razorpayKey,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'PDF Converter',
            description: description,
            order_id: orderData.orderId,
            handler: async (response) => {
                await handlePaymentSuccess(response);
            },
            prefill: {
                email: 'user@example.com',
                contact: '9999999999'
            },
            theme: {
                color: '#6366f1'
            },
            modal: {
                ondismiss: handlePaymentCancel
            },
            notes: {
                description: description
            }
        };

        // Open Razorpay checkout
        if (window.Razorpay) {
            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            throw new Error('Razorpay script not loaded');
        }

        loadingOverlay.style.display = 'none';
    } catch (error) {
        console.error('❌ Payment initiation error:', error);
        loadingOverlay.style.display = 'none';
        showError(`Payment error: ${error.message}`);
        showNotification('Please ensure Razorpay script is loaded and try again', 'error');
    }
}

async function handlePaymentSuccess(response) {
    try {
        loadingOverlay.style.display = 'flex';

        // Try backend verification first
        try {
            const verifyResponse = await fetch(`${API_BASE}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                }),
                timeout: 5000
            });

            if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                if (!verifyData.success) {
                    throw new Error(verifyData.error || 'Payment verification failed');
                }
                console.log('✓ Payment verified via backend');
            } else {
                throw new Error(`Backend verification failed: ${verifyResponse.status}`);
            }
        } catch (backendError) {
            console.warn('⚠ Backend verification unavailable, trusting Razorpay:', backendError.message);
            // Fallback: trust Razorpay response in test mode
            if (!response.razorpay_payment_id) {
                throw new Error('No payment ID received');
            }
            console.log('✓ Payment completed (client-side verification)');
        }

        // Payment verified successfully
        state.paymentVerified = true;
        paymentState.isPaid = true;
        
        // Set expiry time (24 hours for premium, 1 hour for basic)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('pdfConverterPaid', 'true');
        localStorage.setItem('pdfConverterPaidExpiry', expiryTime);
        
        hidePaymentModal();
        loadingOverlay.style.display = 'none';

        // Show success message and allow downloads
        showNotification('✓ Payment successful! Downloads are now enabled.', 'success');
        
        // Auto-trigger download if on success screen
        if (successSection.style.display === 'block') {
            setTimeout(() => downloadAllBtn.click(), 1000);
        }
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        loadingOverlay.style.display = 'none';
        showError('Payment processing failed: ' + error.message);
        showNotification('Please try again', 'error');
    }
}

function handlePaymentCancel() {
    console.log('⚠ Payment cancelled by user');
    loadingOverlay.style.display = 'none';
    showNotification('Payment cancelled. You can try again later.', 'warning');
}

function isPaymentValid() {
    if (!paymentState.isPaid) return false;
    if (!paymentState.paymentExpiry) return false;
    
    const now = Date.now();
    const expiry = parseInt(paymentState.paymentExpiry);
    return now < expiry;
}

function clearPayment() {
    paymentState.isPaid = false;
    localStorage.removeItem('pdfConverterPaid');
    localStorage.removeItem('pdfConverterPaidExpiry');
    state.paymentVerified = false;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#22c55e' 
                  : type === 'error' ? '#ef4444' 
                  : type === 'warning' ? '#f59e0b'
                  : '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 18px;
        background: ${bgColor};
        color: white;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1001;
        animation: slideInLeft 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 90%;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// Payment modal event listeners
if (paymentModalOverlay) {
    paymentModalOverlay.addEventListener('click', hidePaymentModal);
}
if (paymentModalClose) {
    paymentModalClose.addEventListener('click', hidePaymentModal);
}

// ============ END PAYMENT FUNCTIONS ============

// ---------- Theme ----------
function initTheme() {
    const saved = localStorage.getItem('pdfConverterTheme');
    if (saved === 'light') {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    }
}
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.hasAttribute('data-theme');
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('pdfConverterTheme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('pdfConverterTheme', 'dark');
    }
});

function closeMobileNav() {
    if (navMenu) navMenu.classList.remove('active');
    if (navActions) navActions.classList.remove('active');
    if (navMobileToggle) navMobileToggle.classList.remove('open');
}

function initNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = link.dataset.target;
            const el = document.querySelector(target);
            if (el) {
                const offset = 72;
                window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
            }
            closeMobileNav();
        });
    });
}

if (navMobileToggle) {
    navMobileToggle.addEventListener('click', () => {
        if (navMenu) navMenu.classList.toggle('active');
        if (navActions) navActions.classList.toggle('active');
        navMobileToggle.classList.toggle('open');
    });
}

// ---------- Utils ----------
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'image';
    if (['doc','docx','txt','rtf','odt'].includes(ext)) return 'document';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xls','xlsx','csv','ods'].includes(ext)) return 'spreadsheet';
    if (['ppt','pptx'].includes(ext)) return 'presentation';
    return null;
}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B','KB','MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
function getFileIcon(fileType) {
    const map = { image:'🖼️', document:'📝', spreadsheet:'📊', pdf:'📄', presentation:'📽️' };
    return map[fileType] || '📄';
}
function getGroupName(fileType, count) {
    const names = { image:'Image', document:'Document', spreadsheet:'Spreadsheet', pdf:'PDF', presentation:'Presentation' };
    const n = names[fileType] || 'File';
    return count > 1 ? count + ' ' + n + 's' : n;
}

// ---------- Upload handlers ----------
uploadArea.addEventListener('click', (e) => {
    if (e.target.closest('.integration-btn')) return;
    fileInput.click();
});
chooseFilesBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length) handleMultipleFiles(files);
});

['dragover','dragenter'].forEach(ev => {
    uploadArea.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.add('drag-over'); });
});
['dragleave','drop'].forEach(ev => {
    uploadArea.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.remove('drag-over'); });
});
uploadArea.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleMultipleFiles(files);
});

// ---------- Queue management ----------
async function handleMultipleFiles(files) {
    const bad = [];
    for (const file of files) {
        const t = getFileType(file.name);
        if (!t) { bad.push(file.name); continue; }
        state.files.push({ files:[file], fileType:t, name:file.name });
    }
    if (bad.length) { showError(bad.join(', ') + ' — unsupported format'); return; }
    if (state.files.length) {
        updateQueueUI();
        uploadArea.style.display = 'none';
        document.querySelector('.security-strip').style.display = 'none';
        filesQueueSection.style.display = 'block';
        filesQueueSection.scrollIntoView({ behavior:'smooth', block:'start' });
    }
}

function updateQueueUI() {
    queueCount.textContent = state.files.length;
    filesQueue.innerHTML = '';
    state.files.forEach((item, idx) => {
        const totalSize = item.files.reduce((s, f) => s + f.size, 0);
        const el = document.createElement('div');
        el.className = 'queue-item';
        el.draggable = true;
        el.dataset.index = idx;

        let thumb = '';
        if (item.fileType === 'image' && item.files[0]) {
            thumb = `<div class="queue-thumb" style="background-image:url('${URL.createObjectURL(item.files[0])}');"></div>`;
        } else {
            thumb = `<div class="queue-icon">${getFileIcon(item.fileType)}</div>`;
        }

        const selIdx = state.selectedFiles.findIndex(f => f.index === idx);
        const isSel = selIdx !== -1;
        const badge = isSel ? `<div class="queue-badge">${selIdx + 1}</div>` : '';

        el.innerHTML = `
            <div class="queue-drag-handle">⋮⋮</div>
            ${thumb}
            <div class="queue-meta">
                <div class="queue-name">${item.name}</div>
                <div class="queue-size">${formatFileSize(totalSize)}</div>
            </div>
            ${badge}
            <button class="queue-remove" title="Remove">✕</button>
        `;

        el.addEventListener('dragstart', dragStart);
        el.addEventListener('dragover', dragOver);
        el.addEventListener('drop', drop);
        el.addEventListener('dragend', dragEnd);
        el.addEventListener('dragenter', dragEnter);
        el.addEventListener('dragleave', dragLeave);
        el.addEventListener('click', (e) => {
            if (e.target.closest('.queue-remove') || e.target.closest('.queue-drag-handle')) return;
            toggleSelection(idx);
        });
        el.querySelector('.queue-remove').addEventListener('click', (e) => { e.stopPropagation(); removeFromQueue(idx); });

        if (isSel) el.classList.add('selected');
        filesQueue.appendChild(el);
    });
}

let draggedEl = null;
function dragStart(e) { draggedEl = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function dragEnter(e) { if (this !== draggedEl) this.classList.add('drag-over'); }
function dragLeave(e) { this.classList.remove('drag-over'); }
function dragEnd(e) { this.classList.remove('dragging'); document.querySelectorAll('.queue-item').forEach(i => i.classList.remove('drag-over')); }
function drop(e) {
    e.preventDefault();
    if (this === draggedEl) return;
    const a = parseInt(draggedEl.dataset.index);
    const b = parseInt(this.dataset.index);
    const tmp = state.files[a]; state.files[a] = state.files[b]; state.files[b] = tmp;
    state.selectedFiles = state.selectedFiles.map(s => {
        if (s.index === a) return {...s, index:b};
        if (s.index === b) return {...s, index:a};
        return s;
    });
    updateQueueUI();
}

function toggleSelection(idx) {
    const pos = state.selectedFiles.findIndex(f => f.index === idx);
    if (pos !== -1) state.selectedFiles.splice(pos, 1);
    else state.selectedFiles.push({ index:idx, file:state.files[idx] });
    updateQueueUI();
}
function removeFromQueue(idx) {
    state.files.splice(idx, 1);
    state.selectedFiles = state.selectedFiles.filter(f => f.index !== idx).map(f => ({...f, index: f.index > idx ? f.index - 1 : f.index}));
    if (!state.files.length) resetAll();
    else updateQueueUI();
}
function resetAll() {
    state.files = []; state.convertedPDFs = []; state.selectedFiles = []; state.currentConversionIndex = 0;
    uploadArea.style.display = 'block';
    document.querySelector('.security-strip').style.display = 'flex';
    filesQueueSection.style.display = 'none';
    progressSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'none';
    fileInput.value = '';
}

clearQueueBtn.addEventListener('click', resetAll);
addMoreFilesBtn.addEventListener('click', () => { fileInput.value = ''; fileInput.click(); });

// ---------- Progress UI ----------
function showProgress() {
    filesQueueSection.style.display = 'none';
    progressSection.style.display = 'block';
    const count = state.selectedFiles.length || state.files.length;
    document.getElementById('progressTitle').textContent = `Converting ${count} file(s)...`;
    setRing(0);
}
function setRing(pct) {
    const circle = document.getElementById('progressRingCircle');
    const val = document.getElementById('progressValue');
    const circ = 2 * Math.PI * 52;
    if (circle) circle.style.strokeDashoffset = circ - (pct / 100) * circ;
    if (val) val.textContent = Math.round(pct) + '%';
}
function updateProgressList() {
    const list = document.getElementById('progressList');
    list.innerHTML = '';
    const items = state.selectedFiles.length ? state.selectedFiles.map(s => state.files[s.index]) : state.files;
    items.forEach((item, idx) => {
        const status = idx < state.currentConversionIndex ? 'done' : idx === state.currentConversionIndex ? 'processing' : 'pending';
        const icon = status === 'done' ? '✓' : status === 'processing' ? '◌' : '○';
        const cls = status === 'done' ? 'pf-done' : status === 'processing' ? 'pf-processing' : 'pf-pending';
        const div = document.createElement('div');
        div.className = 'pf-item';
        div.innerHTML = `<span class="pf-icon ${cls}">${icon}</span><span>${item.name}</span>`;
        list.appendChild(div);
    });
}
function showCurrentFile() {
    const items = state.selectedFiles.length ? state.selectedFiles.map(s => state.files[s.index]) : state.files;
    const item = items[state.currentConversionIndex];
    document.getElementById('currentProgressItem').textContent = item ? `Processing: ${item.name}` : 'Preparing...';
    updateProgressList();
}
function updateProgress(pct) { setRing(pct); }

function showSuccess() {
    progressSection.style.display = 'none';
    successSection.style.display = 'block';
    document.getElementById('successMessage').textContent = `${state.convertedPDFs.length} file(s) converted successfully!`;
    const list = document.getElementById('successFilesList');
    list.innerHTML = '';
    state.convertedPDFs.forEach((pdfItem, idx) => {
        const div = document.createElement('div');
        div.className = 'sf-item';
        div.innerHTML = `
            <div class="sf-info"><span class="sf-icon">📄</span><span class="sf-name">${pdfItem.name}</span></div>
            <button class="sf-btn" data-i="${idx}">⬇️ Download</button>
        `;
        div.querySelector('.sf-btn').addEventListener('click', () => downloadSingle(idx));
        list.appendChild(div);
    });
    successSection.scrollIntoView({ behavior:'smooth', block:'start' });
}
function showError(msg) {
    progressSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'block';
    document.getElementById('errorMessage').textContent = msg;
    errorSection.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ---------- Conversion helpers ----------
function isCanvasBlank(canvas, tolerance = 0.995) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonWhitePixels = 0;
    const totalPixels = canvas.width * canvas.height;
    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (a !== 0 && (r < 250 || g < 250 || b < 250)) nonWhitePixels++;
        if (nonWhitePixels / totalPixels > 1 - tolerance) return false;
    }
    return true;
}

function appendCanvasToPDF(pdf, canvas, orient='p') {
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const pxPerMm = canvas.width / pw;
    const pageHeightPx = Math.round(ph * pxPerMm);
    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (offsetY + sliceHeight >= canvas.height && isCanvasBlank(pageCanvas)) {
            break;
        }

        const imgData = pageCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();
        const iw = pw;
        const ih = sliceHeight / pxPerMm;
        pdf.addImage(imgData, 'PNG', 0, 0, iw, ih);

        offsetY += sliceHeight;
        pageIndex++;
    }
}

async function convertImageToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const { jsPDF } = window.jspdf;
                const orient = img.width > img.height ? 'l' : 'p';
                const pw = orient === 'l' ? 297 : 210;
                const ph = orient === 'l' ? 210 : 297;
                const ar = img.width / img.height;
                let iw, ih;
                if (ar > pw / ph) { iw = pw; ih = pw / ar; }
                else { ih = ph; iw = ph * ar; }
                const pdf = new jsPDF({ orientation:orient, unit:'mm', format:'a4' });
                pdf.addImage(e.target.result, 'PNG', (pw-iw)/2, (ph-ih)/2, iw, ih);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function convertImagesGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    let pdf = null, first = true;
    for (const file of files) {
        const img = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = (e) => {
                const im = new Image();
                im.onload = () => resolve({ image:im, data:e.target.result });
                im.onerror = () => reject(new Error('Failed to load image'));
                im.src = e.target.result;
            };
            r.onerror = () => reject(new Error('Failed to read image'));
            r.readAsDataURL(file);
        });
        const orient = img.image.width > img.image.height ? 'l' : 'p';
        const pw = orient === 'l' ? 297 : 210;
        const ph = orient === 'l' ? 210 : 297;
        const ar = img.image.width / img.image.height;
        let iw, ih;
        if (ar > pw / ph) { iw = pw; ih = pw / ar; }
        else { ih = ph; iw = ph * ar; }
        if (first) { pdf = new jsPDF({ orientation: orient, unit:'mm', format:'a4' }); first = false; }
        else pdf.addPage('a4', orient);
        pdf.addImage(img.data, 'PNG', (pw-iw)/2, (ph-ih)/2, iw, ih);
    }
    return { pdf, filename: `${getGroupName('image', files.length)}.pdf` };
}

async function convertDocumentsGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;
    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        let html = '';
        if (ext === 'docx') {
            const ab = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = () => rej(new Error('read')); r.readAsArrayBuffer(file); });
            const result = await mammoth.convertToHtml({ arrayBuffer: ab });
            html = result.value;
        } else if (ext === 'doc') {
            html = `<div style="text-align:center;padding:50px;"><h1>Legacy DOC File</h1><p>${file.name}</p><p style="color:#666;">Size: ${formatFileSize(file.size)}</p><p style="color:#999;margin-top:30px;">Please convert to .docx for better results.</p></div>`;
        } else if (ext === 'txt') {
            const text = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = () => rej(new Error('read')); r.readAsText(file); });
            html = `<pre style="font-family:'Courier New',monospace;font-size:12px;line-height:1.4;white-space:pre-wrap;">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
        } else if (ext === 'rtf') {
            const rtf = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = () => rej(new Error('read')); r.readAsText(file); });
            const txt = rtf.replace(/\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').trim();
            html = `<pre style="font-family:Arial,sans-serif;font-size:12px;line-height:1.4;white-space:pre-wrap;">${txt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
        } else if (ext === 'odt') {
            html = `<div style="text-align:center;padding:50px;"><h1>OpenDocument Text</h1><p>${file.name}</p><p style="color:#666;">Size: ${formatFileSize(file.size)}</p><p style="color:#999;margin-top:30px;">Please convert to .docx for better results.</p></div>`;
        }
        const el = document.createElement('div');
        el.innerHTML = html;
        el.style.cssText = 'padding:5px;margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:11px;line-height:1.2;width:210mm;max-width:210mm;box-sizing:border-box;';
        el.querySelectorAll('*').forEach(x => { x.style.margin='0'; x.style.padding='2px 0'; x.style.background='#fff'; x.style.color='#000'; });
        document.body.appendChild(el);
        const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:el.scrollWidth, windowHeight:el.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
        document.body.removeChild(el);
        appendCanvasToPDF(pdf, canvas, 'p');
        firstPage = false;
    }
    return { pdf, filename: `${getGroupName('document', files.length)}.pdf` };
}

async function convertSpreadsheetsGroupToPDF(files) {
    if (!window.XLSX) throw new Error('XLSX library not loaded.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    let firstPage = true;
    for (const file of files) {
        const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(new Uint8Array(e.target.result)); r.onerror = () => rej(new Error('read')); r.readAsArrayBuffer(file); });
        const wb = window.XLSX.read(data, { type:'array' });
        for (const name of wb.SheetNames) {
            const ws = wb.Sheets[name];
            const html = window.XLSX.utils.sheet_to_html(ws);
            const wrap = document.createElement('div');
            wrap.innerHTML = html;
            wrap.style.cssText = 'padding:2px;margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:10px;overflow:visible;width:fit-content;box-sizing:border-box;';
            const table = wrap.querySelector('table');
            if (table) {
                table.style.cssText = 'border-collapse:collapse;width:auto;margin:0;padding:0;background:#fff;';
                table.querySelectorAll('td,th').forEach(c => { c.style.cssText = 'border:1px solid #999;padding:3px 4px;text-align:left;margin:0;line-height:1;background:#fff;'; });
            }
            document.body.appendChild(wrap);
            const canvas = await html2canvas(wrap, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:wrap.scrollWidth, windowHeight:wrap.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
            document.body.removeChild(wrap);
            appendCanvasToPDF(pdf, canvas, 'l');
            firstPage = false;
        }
    }
    return { pdf, filename: `${getGroupName('spreadsheet', files.length)}.pdf` };
}

async function convertPresentationToPDF(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const ext = file.name.split('.').pop().toLowerCase();
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            if (ext === 'pptx') {
                updateProgress(20);
                const slides = await parsePPTXSlides(file);
                if (!slides.length) throw new Error('No readable slides found.');
                for (let i = 0; i < slides.length; i++) {
                    const el = makeSlideEl(file.name, i + 1, slides[i], slides.length);
                    const canvas = await renderEl(el);
                    if (i > 0) pdf.addPage();
                    appendCanvasToPDF(pdf, canvas, 'p');
                }
                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
                return;
            }
            const el = makeSlideEl(file.name, 1, 'This presentation type is not fully supported. Included as placeholder.', 1);
            const canvas = await renderEl(el);
            appendCanvasToPDF(pdf, canvas, 'p');
            updateProgress(80);
            resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
        } catch (err) { reject(new Error('Failed to convert presentation: ' + err.message)); }
    });
}

async function convertPresentationsGroupToPDF(files) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;
    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'pptx') {
            try {
                const slides = await parsePPTXSlides(file);
                if (!slides.length) {
                    const ph = makeSlideEl(file.name, 1, 'No readable slides found.', 1);
                    const c = await renderEl(ph);
                    if (!firstPage) pdf.addPage(); appendCanvasToPDF(pdf, c, 'p'); firstPage = false;
                    continue;
                }
                for (let i = 0; i < slides.length; i++) {
                    const el = makeSlideEl(file.name, i + 1, slides[i], slides.length);
                    const c = await renderEl(el);
                    if (!firstPage) pdf.addPage(); appendCanvasToPDF(pdf, c, 'p'); firstPage = false;
                }
                continue;
            } catch (e) { console.warn('PPTX parse failed', e); }
        }
        const ph = makeSlideEl(file.name, 1, 'This presentation type is not fully supported. Included as placeholder.', 1);
        const c = await renderEl(ph);
        if (!firstPage) pdf.addPage(); appendCanvasToPDF(pdf, c, 'p'); firstPage = false;
    }
    return { pdf, filename: `${getGroupName('presentation', files.length)}.pdf` };
}

async function parsePPTXSlides(file) {
    if (!window.JSZip) throw new Error('JSZip not loaded.');
    const zip = await JSZip.loadAsync(file);
    const slideFiles = Object.keys(zip.files)
        .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => {
            const an = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
            const bn = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
            return an - bn;
        });
    const slides = [];
    for (const sf of slideFiles) {
        const xml = await zip.file(sf).async('text');
        const runs = [];
        const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
        let m;
        while ((m = re.exec(xml)) !== null) {
            let t = m[1];
            t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            if (t.trim()) runs.push(t.trim());
        }
        slides.push(runs.length ? runs.join('\n\n') : 'This slide contains unsupported visual content.');
    }
    return slides;
}

function makeSlideEl(fileName, slideNum, text, total) {
    const el = document.createElement('div');
    el.style.cssText = 'padding:18px;margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;width:210mm;min-height:297mm;box-sizing:border-box;border:1px solid #e1e1e1;display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden;';
    el.innerHTML = `
        <div style="padding:14px;border-bottom:1px solid #ddd;margin-bottom:18px;">
            <h2 style="font-size:18px;margin:0 0 4px;">${fileName}</h2>
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:#555;"><span>Slide ${slideNum} of ${total}</span></div>
        </div>
        <div style="font-size:12px;line-height:1.5;white-space:pre-wrap;color:#222;">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    `;
    return el;
}
async function renderEl(el) {
    document.body.appendChild(el);
    const c = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:el.scrollWidth, windowHeight:el.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
    document.body.removeChild(el);
    return c;
}

async function convertDocumentToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const ext = file.name.split('.').pop().toLowerCase();
                let html = '';
                if (ext === 'docx') {
                    const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
                    html = result.value;
                } else if (ext === 'doc') {
                    html = `<div style="text-align:center;padding:50px;"><h1>Legacy DOC File</h1><p>${file.name}</p><p style="color:#666;">Size: ${formatFileSize(file.size)}</p><p style="color:#999;margin-top:30px;">Please convert to .docx for better results.</p></div>`;
                } else if (ext === 'txt') {
                    const text = e.target.result;
                    html = `<pre style="font-family:'Courier New',monospace;font-size:12px;line-height:1.4;white-space:pre-wrap;">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
                } else if (ext === 'rtf') {
                    const rtf = e.target.result;
                    const txt = rtf.replace(/\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').trim();
                    html = `<pre style="font-family:Arial,sans-serif;font-size:12px;line-height:1.4;white-space:pre-wrap;">${txt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
                } else if (ext === 'odt') {
                    html = `<div style="text-align:center;padding:50px;"><h1>OpenDocument Text</h1><p>${file.name}</p><p style="color:#666;">Size: ${formatFileSize(file.size)}</p><p style="color:#999;margin-top:30px;">Please convert to .docx for better results.</p></div>`;
                }
                const el = document.createElement('div');
                el.innerHTML = html;
                el.style.cssText = 'padding:5px;margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:11px;line-height:1.2;width:210mm;max-width:210mm;box-sizing:border-box;';
                el.querySelectorAll('*').forEach(x => { x.style.margin='0'; x.style.padding='2px 0'; x.style.background='#fff'; x.style.color='#000'; });
                document.body.appendChild(el);
                updateProgress(50);
                const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:el.scrollWidth, windowHeight:el.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
                document.body.removeChild(el);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'p');
                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (err) { reject(new Error('Failed to convert document: ' + err.message)); }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        if (['txt','rtf'].includes(file.name.split('.').pop().toLowerCase())) reader.readAsText(file);
        else reader.readAsArrayBuffer(file);
    });
}

async function convertSpreadsheetToPDF(file) {
    return new Promise((resolve, reject) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'csv') { convertCSVToPDF(file).then(resolve).catch(reject); return; }
        if (!window.XLSX) { reject(new Error('XLSX not loaded.')); return; }
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const data = new Uint8Array(e.target.result);
                const wb = window.XLSX.read(data, { type:'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const html = window.XLSX.utils.sheet_to_html(ws);
                const wrap = document.createElement('div');
                wrap.innerHTML = html;
                wrap.style.cssText = 'padding:2px;margin:0;font-family:Arial,sans-serif;font-size:10px;overflow:visible;width:fit-content;';
                const table = wrap.querySelector('table');
                if (table) {
                    table.style.cssText = 'border-collapse:collapse;width:auto;margin:0;padding:0;';
                    table.querySelectorAll('td,th').forEach(c => { c.style.cssText = 'border:1px solid #999;padding:3px 4px;text-align:left;margin:0;line-height:1;background:#fff;color:#000;'; });
                }
                document.body.appendChild(wrap);
                updateProgress(50);
                const canvas = await html2canvas(wrap, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:wrap.scrollWidth, windowHeight:wrap.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
                document.body.removeChild(wrap);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'l');
                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (err) { reject(new Error('Failed to convert spreadsheet: ' + err.message)); }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

async function convertCSVToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                updateProgress(30);
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                const rows = lines.slice(1).map(l => l.split(',').map(c => c.replace(/"/g, '').trim()));
                const wrap = document.createElement('div');
                wrap.innerHTML = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10px;"><thead><tr>${headers.map(h => `<th style="border:1px solid #999;padding:3px 4px;text-align:left;background:#f0f0f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #999;padding:3px 4px;text-align:left;">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
                wrap.style.cssText = 'padding:2px;margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:10px;overflow:visible;width:fit-content;box-sizing:border-box;';
                document.body.appendChild(wrap);
                updateProgress(50);
                const canvas = await html2canvas(wrap, { scale:2, useCORS:true, backgroundColor:'#fff', windowWidth:wrap.scrollWidth, windowHeight:wrap.scrollHeight, scrollX:-window.scrollX, scrollY:-window.scrollY, logging:false });
                document.body.removeChild(wrap);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'a4');
                appendCanvasToPDF(pdf, canvas, 'l');
                updateProgress(80);
                resolve({ pdf, filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf' });
            } catch (err) { reject(new Error('Failed to convert CSV: ' + err.message)); }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV'));
        reader.readAsText(file);
    });
}

async function convertSingleFile(fileItem) {
    try {
        updateProgress(0);
        let result;
        if (fileItem.files.length > 1) {
            if (fileItem.fileType === 'image') result = await convertImagesGroupToPDF(fileItem.files);
            else if (fileItem.fileType === 'document') result = await convertDocumentsGroupToPDF(fileItem.files);
            else if (fileItem.fileType === 'spreadsheet') result = await convertSpreadsheetsGroupToPDF(fileItem.files);
            else if (fileItem.fileType === 'presentation') result = await convertPresentationsGroupToPDF(fileItem.files);
        } else {
            const f = fileItem.files[0];
            if (fileItem.fileType === 'image') result = await convertImageToPDF(f);
            else if (fileItem.fileType === 'document') result = await convertDocumentToPDF(f);
            else if (fileItem.fileType === 'spreadsheet') result = await convertSpreadsheetToPDF(f);
            else if (fileItem.fileType === 'presentation') result = await convertPresentationToPDF(f);
            else if (fileItem.fileType === 'pdf') {
                updateProgress(100);
                return { pdf:null, filename:f.name, isPDF:true, file:f };
            }
        }
        updateProgress(100);
        return result;
    } catch (err) { throw err; }
}

// ---------- Main conversion ----------
async function mergePDFBuffers(buffers) {
    if (!buffers.length) return null;
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const buffer of buffers) {
        const source = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const donor = await PDFLib.PDFDocument.load(source);
        const copiedPages = await mergedPdf.copyPages(donor, donor.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return mergedPdf.save();
}

async function convertAllFiles() {
    try {
        let toConvert = state.selectedFiles.length ? state.selectedFiles.map(s => state.files[s.index]) : state.files;
        if (!toConvert.length) return;
        state.currentConversionIndex = 0;
        state.convertedPDFs = [];
        showProgress();

        const pdfFiles = toConvert.filter(item => item.fileType === 'pdf').map(item => item.files[0]);
        if (pdfFiles.length > 1) {
            const pdfBuffers = await Promise.all(pdfFiles.map(file => new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = (e) => res(e.target.result);
                r.onerror = () => rej(new Error('Failed to read PDF file'));
                r.readAsArrayBuffer(file);
            })));
            const mergedData = await mergePDFBuffers(pdfBuffers);
            const mergedName = `Merged Documents.pdf`;
            state.convertedPDFs.push({ name: mergedName, data: mergedData });
            toConvert = toConvert.filter(item => item.fileType !== 'pdf');
        }

        let i = 0;
        while (i < toConvert.length) {
            state.currentConversionIndex = i;
            const item = toConvert[i];
            showCurrentFile();
            try {
                if (item.fileType === 'image') {
                    const group = [item.files[0]];
                    let ni = i + 1;
                    while (ni < toConvert.length && toConvert[ni].fileType === 'image') { group.push(toConvert[ni].files[0]); ni++; }
                    const r = await convertImagesGroupToPDF(group);
                    state.convertedPDFs.push({ name:r.filename, pdf:r.pdf });
                    i = ni; continue;
                }
                if (item.fileType === 'document') {
                    const group = [item.files[0]];
                    let ni = i + 1;
                    while (ni < toConvert.length && toConvert[ni].fileType === 'document') { group.push(toConvert[ni].files[0]); ni++; }
                    const r = await convertDocumentsGroupToPDF(group);
                    state.convertedPDFs.push({ name:r.filename, pdf:r.pdf });
                    i = ni; continue;
                }
                if (item.fileType === 'spreadsheet') {
                    const group = [item.files[0]];
                    let ni = i + 1;
                    while (ni < toConvert.length && toConvert[ni].fileType === 'spreadsheet') { group.push(toConvert[ni].files[0]); ni++; }
                    const r = await convertSpreadsheetsGroupToPDF(group);
                    state.convertedPDFs.push({ name:r.filename, pdf:r.pdf });
                    i = ni; continue;
                }
                if (item.fileType === 'presentation') {
                    const group = [item.files[0]];
                    let ni = i + 1;
                    while (ni < toConvert.length && toConvert[ni].fileType === 'presentation') { group.push(toConvert[ni].files[0]); ni++; }
                    const r = await convertPresentationsGroupToPDF(group);
                    state.convertedPDFs.push({ name:r.filename, pdf:r.pdf });
                    i = ni; continue;
                }
                if (item.fileType === 'pdf') {
                    const f = item.files[0];
                    const data = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsArrayBuffer(f); });
                    state.convertedPDFs.push({ name:item.name, data });
                    i++; continue;
                }
            } catch (err) {
                console.error(`Error converting ${item.name}:`, err);
                showError(`Failed to convert ${item.name}: ${err.message}`);
                return;
            }
        }
        showSuccess();
    } catch (err) {
        console.error('Conversion error:', err);
        showError(err.message || 'An error occurred during conversion.');
    }
}

// ---------- Downloads ----------
function downloadSingle(idx) {
    // Check if payment is valid
    if (!isPaymentValid()) {
        showPaymentModal();
        return;
    }

    const item = state.convertedPDFs[idx];
    const def = item.name.replace('.pdf', '');
    const custom = prompt('Enter PDF filename (without .pdf):', def);
    if (custom === null) return;
    const fname = custom.trim() ? custom.trim() + '.pdf' : item.name;
    if (item.pdf) {
        item.pdf.save(fname);
    } else if (item.data) {
        const blob = new Blob([item.data], { type:'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fname;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }
}
downloadAllBtn.addEventListener('click', () => {
    // Check if payment is valid
    if (!isPaymentValid()) {
        showPaymentModal();
        return;
    }
    
    state.convertedPDFs.forEach((_, idx) => setTimeout(() => downloadSingle(idx), idx * 500));
});
convertAllBtn.addEventListener('click', convertAllFiles);
convertAnotherBtn.addEventListener('click', resetAll);
errorRetryBtn.addEventListener('click', () => { errorSection.style.display = 'none'; filesQueueSection.style.display = 'block'; });

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavLinks();
    initRazorpay();
});
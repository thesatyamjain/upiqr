/**
 * THE UPI QR — Core Application Controller
 */

// Initialize lucide icons
lucide.createIcons();

// Config / Constant Data
const BANK_HANDLES = [
    { handle: "@okhdfcbank", bank: "HDFC Bank" },
    { handle: "@okaxis", bank: "Axis Bank" },
    { handle: "@okicici", bank: "ICICI Bank" },
    { handle: "@oksbi", bank: "State Bank of India" },
    { handle: "@paytm", bank: "Paytm Payments Bank" },
    { handle: "@ybl", bank: "Yes Bank (PhonePe)" },
    { handle: "@barodampay", bank: "Bank of Baroda" },
    { handle: "@unionbank", bank: "Union Bank of India" },
    { handle: "@upi", bank: "NPCI Universal" }
];

// Theme configurations
const THEMES = {
    "dark-metallic": {
        bgStart: "#1f1f2e",
        bgEnd: "#0a0a0f",
        cardBg: "rgba(25, 25, 35, 0.6)",
        accent: "#a78bfa",
        accentLight: "#c084fc",
        textMain: "#ffffff",
        textSub: "#94a3b8",
        glassBorder: "rgba(255, 255, 255, 0.08)",
        qrDark: "#0d0d15"
    },
    "neon-violet": {
        bgStart: "#4f46e5",
        bgEnd: "#0f0b29",
        cardBg: "rgba(20, 15, 45, 0.55)",
        accent: "#06b6d4",
        accentLight: "#22d3ee",
        textMain: "#ffffff",
        textSub: "#cbd5e1",
        glassBorder: "rgba(255, 255, 255, 0.12)",
        qrDark: "#080612"
    },
    "emerald-glow": {
        bgStart: "#064e3b",
        bgEnd: "#021c15",
        cardBg: "rgba(10, 35, 25, 0.6)",
        accent: "#10b981",
        accentLight: "#34d399",
        textMain: "#ffffff",
        textSub: "#a7f3d0",
        glassBorder: "rgba(255, 255, 255, 0.09)",
        qrDark: "#020f0b"
    },
    "rose-gold": {
        bgStart: "#501d2d",
        bgEnd: "#14050a",
        cardBg: "rgba(35, 15, 20, 0.6)",
        accent: "#f43f5e",
        accentLight: "#fb7185",
        textMain: "#ffffff",
        textSub: "#fecdd3",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        qrDark: "#100206"
    }
};

// State Variables
let state = {
    payeeName: "Aditya Sharma",
    username: "adityasharma",
    handle: "@okhdfcbank",
    amountEnabled: true,
    amount: "150000",
    note: "Consulting Fee",
    theme: "dark-metallic"
};

// UI Elements
const payeeInput = document.getElementById("payee-name");
const usernameInput = document.getElementById("upi-username");
const handleSelectTrigger = document.getElementById("handle-select-trigger");
const handleSelectOptions = document.getElementById("handle-select-options");
const selectedHandleText = document.getElementById("selected-handle-text");
const vpaPreviewText = document.getElementById("vpa-preview-text");
const amountToggle = document.getElementById("amount-toggle");
const amountInputContainer = document.getElementById("amount-input-container");
const amountInput = document.getElementById("amount");
const formattedAmountText = document.getElementById("indian-formatted-amount");
const wordsAmountText = document.getElementById("indian-words-amount");
const noteInput = document.getElementById("note");
const themeButtons = document.querySelectorAll(".theme-btn");
const btnShare = document.getElementById("btn-share");
const btnDownload = document.getElementById("btn-download");

// Toast Notification Function
function showToast(message, icon = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i data-lucide="${icon}" class="toast-icon"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons(); // Hydrate the icon
    
    // Automatically remove after animation finishes (3.3s total)
    setTimeout(() => {
        toast.remove();
    }, 3300);
}

// --------------------------------------------------------------------------
// Core Logic: Conversions & Formatting
// --------------------------------------------------------------------------

// Format input amount to Indian Currency format (e.g. 150000 -> ₹ 1,50,000.00)
function formatIndianCurrency(value) {
    if (!value || isNaN(value)) return "₹ 0.00";
    
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(value);
}

// Recursively convert numbers to English words in Indian system
function convertAmount(n) {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
    if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertAmount(n % 100) : "");
    if (n < 100000) return convertAmount(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convertAmount(n % 1000) : "");
    if (n < 10000000) return convertAmount(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convertAmount(n % 100000) : "");
    return convertAmount(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convertAmount(n % 10000000) : "");
}

// Convert amount values to official Rupees words representation
function numberToIndianWords(value) {
    const cleanVal = parseFloat(value);
    if (isNaN(cleanVal) || cleanVal === 0) return "Zero Rupees Only";
    if (cleanVal < 0) return "Negative Amount Not Allowed";
    
    // Split decimals and integer parts
    const parts = cleanVal.toFixed(2).split('.');
    const wholePart = parseInt(parts[0], 10);
    const decimalPart = parseInt(parts[1], 10);
    
    let words = "Rupees ";
    
    if (wholePart > 0) {
        words += convertAmount(wholePart);
    } else {
        words += "Zero";
    }
    
    if (decimalPart > 0) {
        words += " and " + convertAmount(decimalPart) + " Paise";
    }
    
    return words + " Only";
}

// Check VPA validity constraints (must contain only alphanumeric, dots, and hyphens)
function validateVPAUsername(val) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}$/;
    return upiRegex.test(val);
}

// --------------------------------------------------------------------------
// Custom Selection List Dropdown Initialization
// --------------------------------------------------------------------------
function initHandleDropdown() {
    handleSelectOptions.innerHTML = "";
    BANK_HANDLES.forEach(item => {
        const option = document.createElement("div");
        option.className = "custom-option";
        if (item.handle === state.handle) option.classList.add("selected");
        
        option.innerHTML = `
            <span class="option-handle">${item.handle}</span>
            <span class="option-bank">${item.bank}</span>
        `;
        
        option.addEventListener("click", () => {
            state.handle = item.handle;
            selectedHandleText.textContent = item.handle;
            vpaPreviewText.textContent = `${state.username}${state.handle}`;
            
            // Highlight active selection
            document.querySelectorAll(".custom-option").forEach(el => el.classList.remove("selected"));
            option.classList.add("selected");
            
            handleSelectContainerClose();
            updateCard();
        });
        
        handleSelectOptions.appendChild(option);
    });
}

function handleSelectContainerClose() {
    document.querySelector(".custom-select-container").classList.remove("open");
}

function handleSelectContainerToggle() {
    document.querySelector(".custom-select-container").classList.toggle("open");
}

// Close selector if clicking outside
window.addEventListener("click", (e) => {
    const container = document.querySelector(".custom-select-container");
    if (!container.contains(e.target)) {
        handleSelectContainerClose();
    }
});

handleSelectTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    handleSelectContainerToggle();
});

// --------------------------------------------------------------------------
// HTML5 Canvas Card Rendering
// --------------------------------------------------------------------------

// Draw custom rounded rectangle with helper compatibility
function drawRoundedRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Centralized dynamic drawing subroutine
async function renderCardOnCanvas(canvas, scale = 1) {
    const ctx = canvas.getContext("2d");
    const theme = THEMES[state.theme];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Base layout coordinates scaled
    const w = canvas.width;
    const h = canvas.height;
    
    // 1. Draw premium background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, theme.bgStart);
    bgGradient.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);
    
    // 2. Draw card border accent glow
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(1 * scale, 1 * scale, w - 2 * scale, h - 2 * scale);
    ctx.restore();
    
    // 3. Draw ambient light overlay textures
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    const lightGlow = ctx.createRadialGradient(w/2, 0, 50 * scale, w/2, 0, w * 0.7);
    lightGlow.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    lightGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    
    // 4. Draw Header SCAN & PAY Title & official NPCI format look
    ctx.save();
    ctx.font = `800 ${24 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.letterSpacing = "2px";
    ctx.textAlign = "center";
    ctx.fillText("SCAN & PAY", w / 2, 60 * scale);
    
    ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText("SECURE UPI TRANSACTION", w / 2, 82 * scale);
    ctx.restore();
    
    // 5. Draw QR code central glassmorphic container
    const qrContainerSize = 310 * scale;
    const qrContainerX = (w - qrContainerSize) / 2;
    const qrContainerY = 115 * scale;
    const qrContainerRadius = 24 * scale;
    
    ctx.save();
    // Blur simulation: draw glassmorphic background card
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.glassBorder;
    ctx.lineWidth = 1.5 * scale;
    drawRoundedRect(ctx, qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, qrContainerRadius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // 6. Draw QR Code dynamic image representation
    // UPI payment URI string construction
    // e.g. upi://pay?pa=username@handle&pn=PayeeName&am=Amount&tn=Note
    const cleanPayee = encodeURIComponent(state.payeeName);
    const vpa = `${state.username}${state.handle}`;
    let upiString = `upi://pay?pa=${vpa}&pn=${cleanPayee}`;
    if (state.amountEnabled && state.amount) {
        upiString += `&am=${parseFloat(state.amount).toFixed(2)}`;
    }
    if (state.note) {
        upiString += `&tn=${encodeURIComponent(state.note)}`;
    }
    
    // Generate QR using temporary hidden canvas to get high quality data
    const tempCanvas = document.createElement("canvas");
    const qrSizePixel = 240 * scale;
    
    await new Promise((resolve) => {
        QRCode.toCanvas(tempCanvas, upiString, {
            width: qrSizePixel,
            margin: 0,
            color: {
                dark: theme.qrDark,
                light: "#ffffff"
            },
            errorCorrectionLevel: 'H'
        }, () => {
            resolve();
        });
    });
    
    // Draw white background inside glass block behind QR code
    const qrBoxSize = 256 * scale;
    const qrBoxX = (w - qrBoxSize) / 2;
    const qrBoxY = qrContainerY + (qrContainerSize - qrBoxSize) / 2;
    
    ctx.save();
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 14 * scale);
    ctx.fill();
    
    // Render QR Code onto main card canvas
    const qrImgX = qrBoxX + (qrBoxSize - qrSizePixel) / 2;
    const qrImgY = qrBoxY + (qrBoxSize - qrSizePixel) / 2;
    ctx.drawImage(tempCanvas, qrImgX, qrImgY, qrSizePixel, qrSizePixel);
    ctx.restore();
    
    // 7. Draw payee details (Name & VPA id)
    const infoYStart = qrContainerY + qrContainerSize + 30 * scale;
    
    ctx.save();
    ctx.textAlign = "center";
    
    // Draw Name
    ctx.font = `700 ${22 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText(state.payeeName || "Payee Name", w / 2, infoYStart);
    
    // Draw VPA
    ctx.font = `500 ${14 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = theme.textSub;
    ctx.fillText(vpa, w / 2, infoYStart + 22 * scale);
    ctx.restore();
    
    // 8. Draw Amount if specified
    if (state.amountEnabled && state.amount) {
        const amountY = infoYStart + 64 * scale;
        const formatted = formatIndianCurrency(state.amount);
        const words = numberToIndianWords(state.amount);
        
        ctx.save();
        ctx.textAlign = "center";
        
        // Custom background pill for amount
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1 * scale;
        const pillWidth = w - 80 * scale;
        const pillHeight = 65 * scale;
        drawRoundedRect(ctx, 40 * scale, amountY - 24 * scale, pillWidth, pillHeight, 14 * scale);
        ctx.fill();
        ctx.stroke();
        
        // Draw amount text
        ctx.font = `800 ${28 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = theme.accentLight;
        ctx.fillText(formatted, w / 2, amountY + 8 * scale);
        
        // Draw words text
        ctx.font = `italic 500 ${9.5 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = theme.textSub;
        
        // Truncate words text if too long
        let wordsDisplay = words;
        if (wordsDisplay.length > 55) {
            wordsDisplay = wordsDisplay.substr(0, 52) + "...";
        }
        ctx.fillText(wordsDisplay, w / 2, amountY + 28 * scale);
        ctx.restore();
    }
    
    // 9. Draw Note / Description if present
    if (state.note) {
        const noteY = h - 75 * scale;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = theme.textSub;
        ctx.letterSpacing = "0.5px";
        
        // Draw a tiny subtle dot or label before note
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillText(`NOTE: "${state.note.toUpperCase()}"`, w / 2, noteY);
        ctx.restore();
    }
    
    // 10. Draw Footer security stamp at bottom
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `600 ${9 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("POWERED BY BHIM UPI SYSTEM • SECURE LINK", w / 2, h - 35 * scale);
    ctx.restore();
}

// Render both preview and export canvas blocks
function updateCard() {
    const previewCanvas = document.getElementById("payment-card-canvas");
    const exportCanvas = document.getElementById("export-canvas");
    
    // Async renders
    renderCardOnCanvas(previewCanvas, 1);
    renderCardOnCanvas(exportCanvas, 2);
}

// --------------------------------------------------------------------------
// Event Listeners & State Binding
// --------------------------------------------------------------------------

function setupEventListeners() {
    // Payee Name Input
    payeeInput.value = state.payeeName;
    payeeInput.addEventListener("input", (e) => {
        state.payeeName = e.target.value;
        updateCard();
    });
    
    // VPA Username Input
    usernameInput.value = state.username;
    usernameInput.addEventListener("input", (e) => {
        let val = e.target.value.toLowerCase().replace(/\s+/g, "");
        usernameInput.value = val; // Force clean input
        
        if (validateVPAUsername(val) || val === "") {
            state.username = val;
            usernameInput.style.borderColor = "";
        } else {
            usernameInput.style.borderColor = "#ef4444";
        }
        
        vpaPreviewText.textContent = `${state.username}${state.handle}`;
        updateCard();
    });
    
    // Amount Toggle Switch
    amountToggle.checked = state.amountEnabled;
    amountToggle.addEventListener("change", (e) => {
        state.amountEnabled = e.target.checked;
        if (state.amountEnabled) {
            amountInputContainer.style.display = "flex";
            setTimeout(() => {
                amountInputContainer.style.opacity = "1";
                amountInputContainer.style.transform = "scaleY(1)";
            }, 10);
        } else {
            amountInputContainer.style.opacity = "0";
            amountInputContainer.style.transform = "scaleY(0.8)";
            setTimeout(() => {
                amountInputContainer.style.display = "none";
            }, 200);
        }
        updateCard();
    });
    
    // Amount Value Text Input
    amountInput.value = state.amount;
    
    // Perform initial formatting calculations
    formattedAmountText.textContent = formatIndianCurrency(state.amount);
    wordsAmountText.textContent = numberToIndianWords(state.amount);
    
    amountInput.addEventListener("input", (e) => {
        // Strip everything except numbers and a single dot
        let cleanVal = e.target.value.replace(/[^0-9.]/g, "");
        
        // Restrict duplicate dots
        const dotCount = (cleanVal.match(/\./g) || []).length;
        if (dotCount > 1) {
            cleanVal = cleanVal.substr(0, cleanVal.lastIndexOf('.'));
        }
        
        // Restrict values up to 2 decimal places
        if (cleanVal.includes('.')) {
            const parts = cleanVal.split('.');
            if (parts[1].length > 2) {
                cleanVal = `${parts[0]}.${parts[1].substr(0, 2)}`;
            }
        }
        
        amountInput.value = cleanVal;
        state.amount = cleanVal;
        
        // Update labels
        formattedAmountText.textContent = formatIndianCurrency(cleanVal);
        wordsAmountText.textContent = numberToIndianWords(cleanVal);
        updateCard();
    });
    
    // Transaction Note input
    noteInput.value = state.note;
    noteInput.addEventListener("input", (e) => {
        state.note = e.target.value;
        updateCard();
    });
    
    // Theme buttons selector
    themeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            themeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            state.theme = btn.dataset.theme;
            updateCard();
        });
    });
    
    // Download action trigger
    btnDownload.addEventListener("click", () => {
        const exportCanvas = document.getElementById("export-canvas");
        const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.95);
        
        const link = document.createElement("a");
        const safeName = state.payeeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        link.download = `upi_qr_${safeName}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("Payment card downloaded successfully!", "download");
    });
    
    // Share / Web Share Action trigger
    btnShare.addEventListener("click", async () => {
        const exportCanvas = document.getElementById("export-canvas");
        
        try {
            // Get Blob from export canvas
            exportCanvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error("Canvas rendering blob failed");
                }
                
                const safeName = state.payeeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                const file = new File([blob], `upi_qr_${safeName}.jpg`, { type: "image/jpeg" });
                
                // Verify sharing capability in browser
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: "UPI QR Payment Card",
                        text: `Scan to pay ${state.payeeName} securely via UPI.`
                    });
                    showToast("Card shared successfully!", "check-circle");
                } else {
                    // Fallback to Clipboard copy + direct download
                    const copyDataUrl = exportCanvas.toDataURL("image/jpeg", 0.9);
                    
                    // Trigger download download
                    const link = document.createElement("a");
                    link.download = `upi_qr_${safeName}.jpg`;
                    link.href = copyDataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast("Direct sharing unsupported. Card downloaded!", "alert-triangle");
                }
            }, "image/jpeg", 0.95);
        } catch (err) {
            console.error("Sharing failed: ", err);
            showToast("Failed to share. Direct download active instead.", "alert-octagon");
        }
    });
}

// --------------------------------------------------------------------------
// Initialization Entry Point
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initHandleDropdown();
    setupEventListeners();
    updateCard();
});

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
        bgStart: "#14213d",
        bgEnd: "#070d1b",
        cardBg: "rgba(255, 255, 255, 0.05)",
        accent: "#6ea8fe",
        accentLight: "#9bc1ff",
        textMain: "#ffffff",
        textSub: "#a7b6cf",
        glassBorder: "rgba(255, 255, 255, 0.08)",
        qrDark: "#0b1730"
    },
    "neon-violet": {
        bgStart: "#312e81",
        bgEnd: "#12113a",
        cardBg: "rgba(255, 255, 255, 0.07)",
        accent: "#a78bfa",
        accentLight: "#c4b5fd",
        textMain: "#ffffff",
        textSub: "#d8d3ff",
        glassBorder: "rgba(255, 255, 255, 0.12)",
        qrDark: "#231f58"
    },
    "emerald-glow": {
        bgStart: "#0c5b4d",
        bgEnd: "#062b28",
        cardBg: "rgba(255, 255, 255, 0.06)",
        accent: "#57d6b3",
        accentLight: "#8ce9ce",
        textMain: "#ffffff",
        textSub: "#b9eadc",
        glassBorder: "rgba(255, 255, 255, 0.09)",
        qrDark: "#073c35"
    },
    "rose-gold": {
        bgStart: "#b54728",
        bgEnd: "#4a1721",
        cardBg: "rgba(255, 255, 255, 0.07)",
        accent: "#ffcb77",
        accentLight: "#ffe0a8",
        textMain: "#ffffff",
        textSub: "#ffe1c4",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        qrDark: "#571d1a"
    }
};

// State Variables
let state = {
    payeeName: "",
    username: "",
    handle: "@okhdfcbank",
    amount: "",
    note: "",
    theme: "dark-metallic"
};

const STORAGE_KEY = "upi-qr-card-details-v1";
const STANDARD_UPI_TRANSACTION_LIMIT = 100000;
let renderVersion = 0;
let latestRenderPromise = Promise.resolve();
let amountLimitFeedbackTimer;

function loadSavedState() {
    try {
        const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!savedState || typeof savedState !== "object") return;

        const savedHandleIsValid = BANK_HANDLES.some(({ handle }) => handle === savedState.handle);
        state = {
            ...state,
            payeeName: typeof savedState.payeeName === "string" ? savedState.payeeName : state.payeeName,
            username: typeof savedState.username === "string" ? savedState.username : state.username,
            amount: typeof savedState.amount === "string" ? savedState.amount : state.amount,
            note: typeof savedState.note === "string" ? savedState.note : state.note,
            theme: THEMES[savedState.theme] ? savedState.theme : state.theme,
            handle: savedHandleIsValid ? savedState.handle : state.handle
        };
    } catch (err) {
        // Storage can be unavailable in private browsing or blocked contexts.
        console.warn("Saved UPI details could not be restored:", err);
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            payeeName: state.payeeName,
            username: state.username,
            handle: state.handle,
            amount: state.amount,
            note: state.note,
            theme: state.theme
        }));
    } catch (err) {
        console.warn("UPI details could not be saved locally:", err);
    }
}

// UI Elements
const payeeInput = document.getElementById("payee-name");
const usernameInput = document.getElementById("upi-username");
const handleSelectTrigger = document.getElementById("handle-select-trigger");
const handleSelectOptions = document.getElementById("handle-select-options");
const selectedHandleText = document.getElementById("selected-handle-text");
const vpaPreviewText = document.getElementById("vpa-preview-text");
const amountInput = document.getElementById("amount");
const amountLimitText = document.getElementById("amount-limit");
const formattedAmountText = document.getElementById("indian-formatted-amount");
const wordsAmountText = document.getElementById("indian-words-amount");
const noteInput = document.getElementById("note");
const themeButtons = document.querySelectorAll(".theme-btn");
const btnShare = document.getElementById("btn-share");
const btnDownload = document.getElementById("btn-download");
const btnMore = document.getElementById("btn-more");
const additionalOptions = document.getElementById("additional-options");

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

function formatIndianAmountInput(value) {
    if (!value) return "";
    const [wholePart, decimalPart] = value.split(".");
    const groupedWholePart = Number(wholePart || 0).toLocaleString("en-IN");
    return decimalPart === undefined ? groupedWholePart : `${groupedWholePart}.${decimalPart}`;
}

function showAmountLimitFeedback() {
    const inputWrapper = amountInput.closest(".input-wrapper");
    inputWrapper.classList.remove("limit-reached");
    amountLimitText.classList.remove("limit-reached");
    // Reflow lets the animation play again on each blocked keystroke or paste.
    void inputWrapper.offsetWidth;
    inputWrapper.classList.add("limit-reached");
    amountLimitText.classList.add("limit-reached");
    clearTimeout(amountLimitFeedbackTimer);
    amountLimitFeedbackTimer = setTimeout(() => {
        inputWrapper.classList.remove("limit-reached");
        amountLimitText.classList.remove("limit-reached");
    }, 700);
}

// Check VPA validity constraints (must contain only alphanumeric, dots, and hyphens)
function validateVPAUsername(val) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}$/;
    return upiRegex.test(val);
}

function getPaymentValidationError() {
    if (!state.payeeName.trim()) return "Enter the payee name before exporting.";
    if (!validateVPAUsername(state.username)) return "Enter a valid UPI ID username (2–64 letters, numbers, dots, hyphens, or underscores).";
    const amount = Number.parseFloat(state.amount);
    if (Number.isFinite(amount) && amount > STANDARD_UPI_TRANSACTION_LIMIT) {
        return "Standard personal UPI payments are limited to ₹1,00,000 per transaction. Your bank may set a lower limit.";
    }
    return "";
}

function buildUpiUri(data) {
    const vpa = `${data.username}${data.handle}`;
    let uri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(data.payeeName.trim())}&cu=INR`;
    const amount = Number.parseFloat(data.amount);

    if (Number.isFinite(amount) && amount > 0) {
        uri += `&am=${amount.toFixed(2)}`;
    }
    if (data.note.trim()) {
        uri += `&tn=${encodeURIComponent(data.note.trim())}`;
    }
    return { uri, vpa };
}

// --------------------------------------------------------------------------
// Custom Selection List Dropdown Initialization
// --------------------------------------------------------------------------
function initHandleDropdown() {
    handleSelectOptions.innerHTML = "";
    BANK_HANDLES.forEach(item => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(item.handle === state.handle));
        if (item.handle === state.handle) option.classList.add("selected");
        
        option.innerHTML = `
            <span class="option-handle">${item.handle}</span>
            <span class="option-bank">${item.bank}</span>
        `;
        
        option.addEventListener("click", () => {
            state.handle = item.handle;
            selectedHandleText.textContent = item.handle;
            vpaPreviewText.textContent = state.username ? `${state.username}${state.handle}` : "—";
            
            // Highlight active selection
            document.querySelectorAll(".custom-option").forEach(el => el.classList.remove("selected"));
            document.querySelectorAll(".custom-option").forEach(el => el.setAttribute("aria-selected", "false"));
            option.classList.add("selected");
            option.setAttribute("aria-selected", "true");
            
            handleSelectContainerClose();
            updateCard();
        });
        
        handleSelectOptions.appendChild(option);
    });
}

function handleSelectContainerClose() {
    document.querySelector(".custom-select-container").classList.remove("open");
    handleSelectTrigger.setAttribute("aria-expanded", "false");
}

function handleSelectContainerToggle() {
    const isOpen = document.querySelector(".custom-select-container").classList.toggle("open");
    handleSelectTrigger.setAttribute("aria-expanded", String(isOpen));
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

handleSelectTrigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelectContainerToggle();
    } else if (e.key === "Escape") {
        handleSelectContainerClose();
    }
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
async function renderCardOnCanvas(canvas, scale, data, version) {
    // Render off-screen so a stale asynchronous QR generation cannot partially
    // overwrite a newer card.
    const stagingCanvas = document.createElement("canvas");
    stagingCanvas.width = canvas.width;
    stagingCanvas.height = canvas.height;
    const ctx = stagingCanvas.getContext("2d");
    const theme = THEMES[data.theme];
    
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
    
    // 4. Draw compact header
    ctx.save();
    ctx.font = `800 ${22 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.letterSpacing = "1px";
    ctx.textAlign = "center";
    ctx.fillText("UPI QR", w / 2, 54 * scale);
    
    ctx.font = `600 ${10 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText("SCAN & PAY USING ANY UPI APP", w / 2, 76 * scale);
    ctx.restore();
    
    // 5. Draw QR Code dynamic image representation
    // UPI payment URI string construction
    // e.g. upi://pay?pa=username@handle&pn=PayeeName&am=Amount&tn=Note
    const { uri: upiString, vpa } = buildUpiUri(data);
    
    // Generate QR using temporary hidden canvas to get high quality data
    const tempCanvas = document.createElement("canvas");
    const qrSizePixel = 344 * scale;
    
    await new Promise((resolve, reject) => {
        QRCode.toCanvas(tempCanvas, upiString, {
            width: qrSizePixel,
            margin: 0,
            color: {
                dark: theme.qrDark,
                light: "#ffffff"
            },
            errorCorrectionLevel: 'H'
        }, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    if (version !== renderVersion) return;
    
    // A single, generous high-contrast QR surface keeps the card easy to scan.
    const qrBoxSize = 380 * scale;
    const qrBoxX = (w - qrBoxSize) / 2;
    const qrBoxY = 112 * scale;
    
    ctx.save();
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18 * scale);
    ctx.fill();
    
    // Render QR Code onto main card canvas
    const qrImgX = qrBoxX + (qrBoxSize - qrSizePixel) / 2;
    const qrImgY = qrBoxY + (qrBoxSize - qrSizePixel) / 2;
    ctx.drawImage(tempCanvas, qrImgX, qrImgY, qrSizePixel, qrSizePixel);
    ctx.restore();
    
    // 6. Draw payee details directly beneath the QR code
    const infoYStart = qrBoxY + qrBoxSize + 52 * scale;
    const infoX = 70 * scale;
    let contentBottom = infoYStart + 22 * scale;
    
    ctx.save();
    ctx.textAlign = "left";

    // A small label gives the payment details a clear visual hierarchy.
    ctx.font = `700 ${10 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = theme.textSub;
    ctx.fillText("PAY TO", infoX, infoYStart - 32 * scale);
    
    // Draw Name
    ctx.font = `700 ${22 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = theme.textMain;
    if (data.payeeName) {
        ctx.fillText(data.payeeName, infoX, infoYStart);
    }
    
    // Draw VPA
    ctx.font = `500 ${14 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = theme.textSub;
    if (data.username) {
        ctx.fillText(vpa, infoX, infoYStart + 22 * scale);
    }
    ctx.restore();
    
    // 8. Draw Amount if specified
    if (Number.isFinite(Number.parseFloat(data.amount)) && Number.parseFloat(data.amount) > 0) {
        const amountY = infoYStart + 78 * scale;
        const formatted = formatIndianCurrency(data.amount);
        const words = numberToIndianWords(data.amount);
        
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
        contentBottom = amountY + 35 * scale;
    }
    
    // 9. Draw Note / Description if present
    if (data.note) {
        const noteY = contentBottom + 42 * scale;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = theme.textSub;
        ctx.letterSpacing = "0.5px";
        
        // Draw a tiny subtle dot or label before note
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillText(`NOTE: "${data.note.toUpperCase()}"`, w / 2, noteY);
        ctx.restore();
    }
    
    // 10. Draw a minimal security stamp at the bottom
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `600 ${9 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("POWERED BY NPCI UPI", w / 2, h - 35 * scale);
    ctx.restore();

    if (version !== renderVersion) return;
    const targetCtx = canvas.getContext("2d");
    targetCtx.clearRect(0, 0, canvas.width, canvas.height);
    targetCtx.drawImage(stagingCanvas, 0, 0);
}

// Render both preview and export canvas blocks
function updateCard() {
    const previewCanvas = document.getElementById("payment-card-canvas");
    const exportCanvas = document.getElementById("export-canvas");
    
    const version = ++renderVersion;
    const data = { ...state };
    saveState();
    latestRenderPromise = Promise.all([
        renderCardOnCanvas(previewCanvas, 1, data, version),
        renderCardOnCanvas(exportCanvas, 2, data, version)
    ]);
    latestRenderPromise.catch((err) => {
        console.error("Card rendering failed:", err);
        showToast("Could not generate the QR card. Please shorten the details.", "alert-octagon");
    });
    return latestRenderPromise;
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas rendering blob failed")), type, quality);
    });
}

async function waitForCurrentRender() {
    // If a user types while a render is pending, wait for the newest version
    // rather than exporting the last completed canvas.
    while (true) {
        const pendingRender = latestRenderPromise;
        await pendingRender;
        if (pendingRender === latestRenderPromise) return;
    }
}

// --------------------------------------------------------------------------
// Event Listeners & State Binding
// --------------------------------------------------------------------------

function setupEventListeners() {
    // Payee Name Input
    payeeInput.value = state.payeeName;
    selectedHandleText.textContent = state.handle;
    vpaPreviewText.textContent = state.username ? `${state.username}${state.handle}` : "—";
    payeeInput.addEventListener("input", (e) => {
        state.payeeName = e.target.value;
        updateCard();
    });
    
    // VPA Username Input
    usernameInput.value = state.username;
    usernameInput.addEventListener("input", (e) => {
        let val = e.target.value.toLowerCase().replace(/\s+/g, "");
        usernameInput.value = val; // Force clean input
        
        state.username = val;
        if (validateVPAUsername(val) || val === "") {
            usernameInput.style.borderColor = "";
            usernameInput.setCustomValidity("");
        } else {
            usernameInput.style.borderColor = "#ef4444";
            usernameInput.setCustomValidity("Use 2–64 letters, numbers, dots, hyphens, or underscores.");
        }
        
        vpaPreviewText.textContent = state.username ? `${state.username}${state.handle}` : "—";
        updateCard();
    });
    
    // Amount Value Text Input
    amountInput.value = formatIndianAmountInput(state.amount);
    
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

        // Reject input beyond the standard personal UPI ₹1 lakh limit and
        // preserve the last valid value instead of silently changing it.
        if (Number.parseFloat(cleanVal) > STANDARD_UPI_TRANSACTION_LIMIT) {
            amountInput.value = formatIndianAmountInput(state.amount);
            showAmountLimitFeedback();
            return;
        }
        
        amountInput.value = formatIndianAmountInput(cleanVal);
        state.amount = cleanVal;
        const exceedsStandardLimit = Number.parseFloat(cleanVal) > STANDARD_UPI_TRANSACTION_LIMIT;
        amountInput.setCustomValidity(exceedsStandardLimit ? "Standard personal UPI payments are limited to ₹1,00,000 per transaction." : "");
        amountInput.style.borderColor = exceedsStandardLimit ? "#ef4444" : "";
        
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
    themeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.theme === state.theme));
    themeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            themeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            state.theme = btn.dataset.theme;
            updateCard();
        });
    });

    btnMore.addEventListener("click", () => {
        const isExpanded = btnMore.getAttribute("aria-expanded") === "true";
        btnMore.setAttribute("aria-expanded", String(!isExpanded));
        additionalOptions.hidden = isExpanded;
    });
    
    // Download action trigger
    btnDownload.addEventListener("click", async () => {
        const validationError = getPaymentValidationError();
        if (validationError) {
            showToast(validationError, "alert-triangle");
            return;
        }
        const exportCanvas = document.getElementById("export-canvas");
        try {
            await waitForCurrentRender();
            const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.95);
        
        const link = document.createElement("a");
        const safeName = state.payeeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        link.download = `upi_qr_${safeName}.jpg`;
        link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Payment card downloaded successfully!", "download");
        } catch (err) {
            console.error("Download failed:", err);
            showToast("Could not download the card. Please try again.", "alert-octagon");
        }
    });
    
    // Share / Web Share Action trigger
    btnShare.addEventListener("click", async () => {
        const validationError = getPaymentValidationError();
        if (validationError) {
            showToast(validationError, "alert-triangle");
            return;
        }
        const exportCanvas = document.getElementById("export-canvas");
        
        try {
            await waitForCurrentRender();
            const blob = await canvasToBlob(exportCanvas, "image/jpeg", 0.95);
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
    loadSavedState();
    initHandleDropdown();
    setupEventListeners();
    updateCard();
});

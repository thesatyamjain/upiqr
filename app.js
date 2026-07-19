/**
 * THE UPI QR — Core Application Controller
 */

// Categorized UPI Bank Handles grouped by App & Provider
const BANK_HANDLE_CATEGORIES = [
    {
        category: "Google Pay (GPay)",
        items: [
            { handle: "@okhdfcbank", bank: "HDFC Bank (GPay)" },
            { handle: "@okicici", bank: "ICICI Bank (GPay)" },
            { handle: "@oksbi", bank: "State Bank of India (GPay)" },
            { handle: "@okaxis", bank: "Axis Bank (GPay)" }
        ]
    },
    {
        category: "PhonePe",
        items: [
            { handle: "@ybl", bank: "Yes Bank (PhonePe)" },
            { handle: "@ibl", bank: "ICICI Bank (PhonePe)" },
            { handle: "@axl", bank: "Axis Bank (PhonePe)" }
        ]
    },
    {
        category: "Paytm",
        items: [
            { handle: "@paytm", bank: "Paytm Payments Bank" },
            { handle: "@ptaxis", bank: "Axis Bank (Paytm)" },
            { handle: "@pthdfc", bank: "HDFC Bank (Paytm)" },
            { handle: "@ptsbi", bank: "SBI (Paytm)" },
            { handle: "@pytm", bank: "Paytm VPA" }
        ]
    },
    {
        category: "BHIM & Major Banks",
        items: [
            { handle: "@upi", bank: "BHIM / NPCI Universal" },
            { handle: "@sbi", bank: "State Bank of India" },
            { handle: "@hdfcbank", bank: "HDFC Bank" },
            { handle: "@icici", bank: "ICICI Bank" },
            { handle: "@axisbank", bank: "Axis Bank" },
            { handle: "@kotak", bank: "Kotak Mahindra Bank" },
            { handle: "@barodampay", bank: "Bank of Baroda" },
            { handle: "@pnb", bank: "Punjab National Bank" },
            { handle: "@cnrb", bank: "Canara Bank" },
            { handle: "@unionbank", bank: "Union Bank of India" },
            { handle: "@indianbank", bank: "Indian Bank" },
            { handle: "@indus", bank: "IndusInd Bank" },
            { handle: "@federal", bank: "Federal Bank" },
            { handle: "@idfcfirst", bank: "IDFC First Bank" },
            { handle: "@rbl", bank: "RBL Bank" },
            { handle: "@bandhan", bank: "Bandhan Bank" },
            { handle: "@aupamb", bank: "AU Small Finance Bank" }
        ]
    },
    {
        category: "Amazon Pay",
        items: [
            { handle: "@apl", bank: "Amazon Pay (Axis Bank)" },
            { handle: "@rapl", bank: "Amazon Pay (RBL Bank)" }
        ]
    },
    {
        category: "CRED & FinTech",
        items: [
            { handle: "@cred", bank: "CRED UPI (Axis Bank)" },
            { handle: "@ikwik", bank: "MobiKwik" }
        ]
    },
    {
        category: "WhatsApp Pay",
        items: [
            { handle: "@waicici", bank: "WhatsApp Pay (ICICI)" },
            { handle: "@wahdfcbank", bank: "WhatsApp Pay (HDFC)" },
            { handle: "@wasbi", bank: "WhatsApp Pay (SBI)" },
            { handle: "@waaxis", bank: "WhatsApp Pay (Axis)" }
        ]
    }
];

const BANK_HANDLES = BANK_HANDLE_CATEGORIES.flatMap(cat => cat.items);

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
    theme: "dark-metallic",
    exportFormat: "png",
    qrBadge: "none",
    customLogoDataUrl: "",
    showPayeeName: true,
    showVpa: true,
    showAmount: true,
    showAmountWords: true,
    showNote: true
};

let customLogoImg = null;
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
            handle: savedHandleIsValid ? savedState.handle : state.handle,
            exportFormat: savedState.exportFormat === "jpg" ? "jpg" : "png",
            qrBadge: savedState.qrBadge === "custom" ? "custom" : "none",
            customLogoDataUrl: typeof savedState.customLogoDataUrl === "string" ? savedState.customLogoDataUrl : "",
            showPayeeName: typeof savedState.showPayeeName === "boolean" ? savedState.showPayeeName : state.showPayeeName,
            showVpa: typeof savedState.showVpa === "boolean" ? savedState.showVpa : state.showVpa,
            showAmount: typeof savedState.showAmount === "boolean" ? savedState.showAmount : state.showAmount,
            showAmountWords: typeof savedState.showAmountWords === "boolean" ? savedState.showAmountWords : state.showAmountWords,
            showNote: typeof savedState.showNote === "boolean" ? savedState.showNote : state.showNote
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
            theme: state.theme,
            exportFormat: state.exportFormat,
            qrBadge: state.qrBadge,
            customLogoDataUrl: state.customLogoDataUrl,
            showPayeeName: state.showPayeeName,
            showVpa: state.showVpa,
            showAmount: state.showAmount,
            showAmountWords: state.showAmountWords,
            showNote: state.showNote
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
const logoButtons = document.querySelectorAll(".logo-btn");
const togglePayeeName = document.getElementById("toggle-payee-name");
const toggleVpa = document.getElementById("toggle-vpa");
const toggleAmount = document.getElementById("toggle-amount");
const toggleAmountWords = document.getElementById("toggle-amount-words");
const toggleNote = document.getElementById("toggle-note");
const btnReset = document.getElementById("btn-reset");
const btnShare = document.getElementById("btn-share");
const btnDownload = document.getElementById("btn-download");
const btnDownloadMenu = document.getElementById("btn-download-menu");
const downloadFormatMenu = document.getElementById("download-format-menu");
const btnMore = document.getElementById("btn-more");
const settingsModal = document.getElementById("settings-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnDoneModal = document.getElementById("btn-done-modal");
const customSelectContainer = document.querySelector(".custom-select-container");

// Toast Notification Function
function showToast(message, icon = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    const iconEl = document.createElement("i");
    iconEl.setAttribute("data-lucide", icon);
    iconEl.className = "toast-icon";
    const textEl = document.createElement("span");
    textEl.textContent = message;
    toast.appendChild(iconEl);
    toast.appendChild(textEl);
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
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const num = parseFloat(value);
    // Route both empty and zero through the same formatter so output is always consistent
    return formatter.format(isNaN(num) ? 0 : num);
}

// Recursively convert numbers to English words in Indian system
function convertAmount(n) {
    if (n === 0) return "Zero";
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

const HINDI_NUMBERS = [
    "", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ", "दस",
    "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस",
    "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
    "इकत्तीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस", "चालीस",
    "इकतालीस", "बयालीस", "तैंतालीस", "चौंतालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उंचास", "पचास",
    "इक्कावन", "बावन", "तिरेपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्टावन", "उनसठ", "साठ",
    "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सरसठ", "अड़सठ", "उनहत्तर", "सत्तर",
    "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी", "अस्सी",
    "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे",
    "इक्यानवे", "बायानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्न्यानवे"
];

// Convert numbers to Hindi words in Indian numbering system
function convertAmountHindi(n) {
    if (n === 0) return "शून्य";
    if (n < 100) return HINDI_NUMBERS[n];
    if (n < 1000) return HINDI_NUMBERS[Math.floor(n / 100)] + " सौ" + (n % 100 !== 0 ? " " + convertAmountHindi(n % 100) : "");
    if (n < 100000) return convertAmountHindi(Math.floor(n / 1000)) + " हज़ार" + (n % 1000 !== 0 ? " " + convertAmountHindi(n % 1000) : "");
    if (n < 10000000) return convertAmountHindi(Math.floor(n / 100000)) + " लाख" + (n % 100000 !== 0 ? " " + convertAmountHindi(n % 100000) : "");
    return convertAmountHindi(Math.floor(n / 10000000)) + " करोड़" + (n % 10000000 !== 0 ? " " + convertAmountHindi(n % 10000000) : "");
}

function numberToHindiWords(value) {
    const cleanVal = parseFloat(value);
    if (isNaN(cleanVal) || cleanVal === 0) return "शून्य रुपये मात्र";
    if (cleanVal < 0) return "अमान्य राशि";
    
    const parts = cleanVal.toFixed(2).split('.');
    const wholePart = parseInt(parts[0], 10);
    const decimalPart = parseInt(parts[1], 10);
    
    let words = "";
    if (wholePart > 0) {
        words += convertAmountHindi(wholePart) + " रुपये";
    } else {
        words += "शून्य रुपये";
    }
    
    if (decimalPart > 0) {
        words += " और " + convertAmountHindi(decimalPart) + " पैसे";
    }
    
    return words + " मात्र";
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
    BANK_HANDLE_CATEGORIES.forEach(cat => {
        const catHeader = document.createElement("div");
        catHeader.className = "custom-select-category";
        catHeader.textContent = cat.category;
        handleSelectOptions.appendChild(catHeader);

        cat.items.forEach(item => {
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
    });
}

function handleSelectContainerClose() {
    customSelectContainer.classList.remove("open");
    handleSelectTrigger.setAttribute("aria-expanded", "false");
}

function handleSelectContainerToggle() {
    const isOpen = customSelectContainer.classList.toggle("open");
    handleSelectTrigger.setAttribute("aria-expanded", String(isOpen));
}

// Close selector if clicking outside
window.addEventListener("click", (e) => {
    if (!customSelectContainer.contains(e.target)) {
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
    
    // 4. Draw compact header (Hindi primary, English secondary)
    ctx.save();
    ctx.font = `800 ${22 * scale}px 'Noto Sans Devanagari', 'Outfit', sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.textAlign = "center";
    ctx.fillText("भुगतान के लिए स्कैन करें", w / 2, 44 * scale);
    
    ctx.font = `600 ${9.5 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText("SCAN & PAY WITH ANY UPI APP", w / 2, 64 * scale);
    ctx.restore();
    
    // 5. Draw QR Code dynamic image representation
    // UPI payment URI string construction
    // e.g. upi://pay?pa=username@handle&pn=PayeeName&am=Amount&tn=Note
    const { uri: upiString, vpa } = buildUpiUri(data);
    
    // Generate QR using temporary hidden canvas to get high quality data
    const tempCanvas = document.createElement("canvas");
    const qrSizePixel = 274 * scale;
    
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
    const qrBoxSize = 314 * scale;
    const qrBoxX = (w - qrBoxSize) / 2;
    const qrBoxY = 88 * scale;
    
    ctx.save();
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18 * scale);
    ctx.fill();
    
    // Render QR Code onto main card canvas
    const qrImgX = qrBoxX + (qrBoxSize - qrSizePixel) / 2;
    const qrImgY = qrBoxY + (qrBoxSize - qrSizePixel) / 2;
    ctx.drawImage(tempCanvas, qrImgX, qrImgY, qrSizePixel, qrSizePixel);
    ctx.restore();

    // Draw Center Logo Badge on top of QR Code if enabled (custom logo)
    if (data.qrBadge === "custom" && data.customLogoDataUrl) {
        ctx.save();
        const badgeSize = 54 * scale;
        const badgeX = qrBoxX + (qrBoxSize - badgeSize) / 2;
        const badgeY = qrBoxY + (qrBoxSize - badgeSize) / 2;

        drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 14 * scale);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        if (!customLogoImg || customLogoImg.src !== data.customLogoDataUrl) {
            customLogoImg = new Image();
            customLogoImg.onload = () => updateCard();
            customLogoImg.src = data.customLogoDataUrl;
        }

        if (customLogoImg && customLogoImg.complete && customLogoImg.naturalWidth > 0) {
            ctx.save();
            const innerPadding = 6 * scale;
            const imgSize = badgeSize - innerPadding * 2;
            const imgX = badgeX + innerPadding;
            const imgY = badgeY + innerPadding;
            
            drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 10 * scale);
            ctx.clip();
            ctx.drawImage(customLogoImg, imgX, imgY, imgSize, imgSize);
            ctx.restore();
        }
        ctx.restore();
    }

    
    // 6. Draw payee details directly beneath the QR code
    const infoYStart = qrBoxY + qrBoxSize + 108 * scale;
    const infoX = 70 * scale;
    let contentBottom = qrBoxY + qrBoxSize + 40 * scale;
    
    const shouldShowName = Boolean(data.showPayeeName && data.payeeName && data.payeeName.trim());
    const shouldShowVpa = Boolean(data.showVpa && data.username && data.username.trim());
    
    if (shouldShowName || shouldShowVpa) {
        ctx.save();
        ctx.textAlign = "left";

        ctx.font = `700 ${11 * scale}px 'Noto Sans Devanagari', 'Inter', sans-serif`;
        ctx.fillStyle = theme.textSub;
        ctx.fillText("भुगतान प्राप्तकर्ता • PAYEE", infoX, infoYStart - 32 * scale);
        
        let currentY = infoYStart;

        if (shouldShowName) {
            ctx.font = `700 ${24 * scale}px 'Noto Sans Devanagari', 'Outfit', sans-serif`;
            ctx.fillStyle = theme.textMain;
            ctx.fillText(data.payeeName, infoX, currentY);
        }
        
        if (shouldShowVpa) {
            ctx.font = `500 ${14 * scale}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = theme.textSub;
            const vpaY = shouldShowName ? currentY + 26 * scale : infoYStart;
            ctx.fillText(vpa, infoX, vpaY);
            currentY = vpaY;
        }
        
        contentBottom = currentY + 22 * scale;
        ctx.restore();
    }
    
    // 8. Draw Amount if specified and enabled
    const hasValidAmount = Number.isFinite(Number.parseFloat(data.amount)) && Number.parseFloat(data.amount) > 0;
    if (data.showAmount && hasValidAmount) {
        const amountY = (shouldShowName || shouldShowVpa) ? (contentBottom + 45 * scale) : (infoYStart + 20 * scale);
        const formatted = formatIndianCurrency(data.amount);
        const wordsHindi = numberToHindiWords(data.amount);
        const wordsEnglish = numberToIndianWords(data.amount);
        const showWords = data.showAmountWords;
        
        ctx.save();
        ctx.textAlign = "center";
        
        const pillWidth = w - 80 * scale;
        const pillHeight = showWords ? 88 * scale : 52 * scale;
        drawRoundedRect(ctx, 40 * scale, amountY - 28 * scale, pillWidth, pillHeight, 14 * scale);
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.lineWidth = 1 * scale;
        ctx.fill();
        ctx.stroke();
        
        ctx.font = `800 ${30 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = theme.accentLight;
        
        if (showWords) {
            ctx.fillText(formatted, w / 2, amountY + 5 * scale);
            
            // Hindi Primary Words
            ctx.font = `600 ${10.5 * scale}px 'Noto Sans Devanagari', sans-serif`;
            ctx.fillStyle = theme.accentLight;
            let hindiDisplay = wordsHindi.length > 55 ? wordsHindi.slice(0, 52) + "..." : wordsHindi;
            ctx.fillText(hindiDisplay, w / 2, amountY + 29 * scale);

            // English Secondary Words
            ctx.font = `italic 500 ${8.5 * scale}px 'Inter', sans-serif`;
            ctx.fillStyle = theme.textSub;
            let engDisplay = wordsEnglish.length > 55 ? wordsEnglish.slice(0, 52) + "..." : wordsEnglish;
            ctx.fillText(engDisplay, w / 2, amountY + 45 * scale);

            contentBottom = amountY + 54 * scale;
        } else {
            ctx.fillText(formatted, w / 2, amountY + 6 * scale);
            contentBottom = amountY + 24 * scale;
        }
        ctx.restore();
    }
    
    // 9. Draw Note / Description if present and enabled
    let lastContentY = contentBottom;
    if (data.showNote && data.note && data.note.trim()) {
        const noteY = contentBottom + 52 * scale;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = `600 ${11 * scale}px 'Noto Sans Devanagari', 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillText(`विवरण (NOTE): "${data.note}"`, w / 2, noteY);
        ctx.restore();
        lastContentY = noteY;
    }
    
    // 10. Draw a minimal security stamp at the bottom
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `600 ${9.5 * scale}px 'Noto Sans Devanagari', 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillText("सभी UPI ऐप्स से भुगतान स्वीकार्य • POWERED BY NPCI UPI", w / 2,
        Math.min(Math.max(lastContentY + 48 * scale, h * 0.78), h - 28 * scale));
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
    wordsAmountText.textContent = `${numberToHindiWords(state.amount)} (${numberToIndianWords(state.amount)})`;
    
    amountInput.addEventListener("input", (e) => {
        // Strip everything except numbers and a single dot
        let cleanVal = e.target.value.replace(/[^0-9.]/g, "");

        // Treat a lone decimal point as empty — no valid number yet
        if (cleanVal === ".") cleanVal = "";
        
        // Restrict duplicate dots
        const dotCount = (cleanVal.match(/\./g) || []).length;
        if (dotCount > 1) {
            cleanVal = cleanVal.slice(0, cleanVal.lastIndexOf('.'));
        }
        
        // Restrict values up to 2 decimal places
        if (cleanVal.includes('.')) {
            const parts = cleanVal.split('.');
            if (parts[1].length > 2) {
                cleanVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
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
        amountInput.setCustomValidity("");
        amountInput.style.borderColor = "";
        
        // Update labels
        formattedAmountText.textContent = formatIndianCurrency(cleanVal);
        wordsAmountText.textContent = `${numberToHindiWords(cleanVal)} (${numberToIndianWords(cleanVal)})`;
        updateCard();
    });
    
    // Transaction Note input
    const noteCounter = document.getElementById("note-char-count");
    noteInput.value = state.note;
    if (noteCounter) noteCounter.textContent = `${state.note.length}/25`;
    noteInput.addEventListener("input", (e) => {
        state.note = e.target.value;
        if (noteCounter) noteCounter.textContent = `${state.note.length}/25`;
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

    // Card Display Settings visibility toggles
    if (togglePayeeName) togglePayeeName.checked = state.showPayeeName;
    if (toggleVpa) toggleVpa.checked = state.showVpa;
    if (toggleAmount) toggleAmount.checked = state.showAmount;
    if (toggleAmountWords) toggleAmountWords.checked = state.showAmountWords;
    if (toggleNote) toggleNote.checked = state.showNote;

    const bindToggle = (element, stateKey) => {
        if (!element) return;
        element.addEventListener("change", (e) => {
            state[stateKey] = e.target.checked;
            updateCard();
        });
    };

    bindToggle(togglePayeeName, "showPayeeName");
    bindToggle(toggleVpa, "showVpa");
    bindToggle(toggleAmount, "showAmount");
    bindToggle(toggleAmountWords, "showAmountWords");
    bindToggle(toggleNote, "showNote");

    function openModal() {
        if (!settingsModal) return;
        settingsModal.removeAttribute("hidden");
        settingsModal.setAttribute("aria-hidden", "false");
        btnMore.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        if (!settingsModal) return;
        settingsModal.setAttribute("hidden", "");
        settingsModal.setAttribute("aria-hidden", "true");
        btnMore.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    // Custom Logo File Uploader & Badge selector
    const customLogoFile = document.getElementById("custom-logo-file");
    const customLogoContainer = document.getElementById("custom-logo-container");
    const customLogoFileLabel = document.getElementById("custom-logo-file-label");
    const btnRemoveCustomLogo = document.getElementById("btn-remove-custom-logo");

    const updateCustomLogoUI = () => {
        const isCustom = state.qrBadge === "custom";
        if (customLogoContainer) customLogoContainer.hidden = !isCustom;
        if (customLogoFileLabel) {
            customLogoFileLabel.textContent = state.customLogoDataUrl ? "Logo Uploaded ✔ (Change)" : "Upload Shop Logo";
        }
        if (btnRemoveCustomLogo) {
            btnRemoveCustomLogo.hidden = !state.customLogoDataUrl;
        }
    };

    updateCustomLogoUI();

    logoButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.badge === state.qrBadge));
    logoButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            logoButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.qrBadge = btn.dataset.badge;
            updateCustomLogoUI();
            saveState();
            updateCard();
        });
    });

    if (customLogoFile) {
        customLogoFile.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                showToast("Image size must be under 5MB", "alert-triangle");
                return;
            }
            const reader = new FileReader();
            reader.onload = (evt) => {
                state.customLogoDataUrl = evt.target.result;
                state.qrBadge = "custom";
                logoButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.badge === state.qrBadge));
                updateCustomLogoUI();
                saveState();
                updateCard();
                showToast("Custom shop logo applied!", "check-circle");
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnRemoveCustomLogo) {
        btnRemoveCustomLogo.addEventListener("click", () => {
            state.customLogoDataUrl = "";
            state.qrBadge = "none";
            if (customLogoFile) customLogoFile.value = "";
            logoButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.badge === state.qrBadge));
            updateCustomLogoUI();
            saveState();
            updateCard();
            showToast("Custom logo removed", "info");
        });
    }

    // Reset Form button
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            state.payeeName = "";
            state.username = "";
            state.amount = "";
            state.note = "";
            state.theme = "dark-metallic";
            state.qrBadge = "none";
            state.customLogoDataUrl = "";
            if (customLogoFile) customLogoFile.value = "";

            payeeInput.value = "";
            usernameInput.value = "";
            amountInput.value = "";
            noteInput.value = "";
            
            formattedAmountText.textContent = "₹ 0.00";
            wordsAmountText.textContent = "शून्य रुपये मात्र (Zero Rupees Only)";
            vpaPreviewText.textContent = "—";
            const noteCounter = document.getElementById("note-char-count");
            if (noteCounter) noteCounter.textContent = "0/25";

            themeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.theme === state.theme));
            logoButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.badge === state.qrBadge));
            updateCustomLogoUI();

            saveState();
            updateCard();
            showToast("Form details reset!", "rotate-ccw");
        });
    }



    btnMore.addEventListener("click", openModal);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnDoneModal) btnDoneModal.addEventListener("click", closeModal);

    if (settingsModal) {
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                closeModal();
            }
        });
    }

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && settingsModal && !settingsModal.hasAttribute("hidden")) {
            closeModal();
        }
    });

    // Download format dropdown menu handler
    const menuItems = document.querySelectorAll(".download-menu-item");
    const downloadBtnLabel = document.getElementById("download-btn-label");

    const updateFormatUI = () => {
        menuItems.forEach(item => {
            const isActive = item.dataset.format === state.exportFormat;
            item.classList.toggle("active", isActive);
        });
        if (downloadBtnLabel) {
            downloadBtnLabel.textContent = `Download ${state.exportFormat.toUpperCase()}`;
        }
    };

    updateFormatUI();

    if (btnDownloadMenu && downloadFormatMenu) {
        const toggleDownloadMenu = (e) => {
            if (e) e.stopPropagation();
            const isOpen = !downloadFormatMenu.hasAttribute("hidden");
            if (isOpen) {
                downloadFormatMenu.setAttribute("hidden", "");
                btnDownloadMenu.setAttribute("aria-expanded", "false");
            } else {
                downloadFormatMenu.removeAttribute("hidden");
                btnDownloadMenu.setAttribute("aria-expanded", "true");
            }
        };

        btnDownloadMenu.addEventListener("click", toggleDownloadMenu);

        window.addEventListener("click", (e) => {
            if (!downloadFormatMenu.hasAttribute("hidden") && !downloadFormatMenu.contains(e.target) && e.target !== btnDownloadMenu) {
                downloadFormatMenu.setAttribute("hidden", "");
                btnDownloadMenu.setAttribute("aria-expanded", "false");
            }
        });

        menuItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                state.exportFormat = item.dataset.format === "jpg" ? "jpg" : "png";
                updateFormatUI();
                saveState();
                downloadFormatMenu.setAttribute("hidden", "");
                btnDownloadMenu.setAttribute("aria-expanded", "false");
                btnDownload.click();
            });
        });
    }
    
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
            const isPng = state.exportFormat === "png";
            const mimeType = isPng ? "image/png" : "image/jpeg";
            const ext = isPng ? "png" : "jpg";
            const dataUrl = isPng ? exportCanvas.toDataURL("image/png") : exportCanvas.toDataURL("image/jpeg", 0.95);
            const link = document.createElement("a");
            const safeName = state.payeeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            const amt = parseFloat(state.amount);
            const amtPart = Number.isFinite(amt) && amt > 0 ? `_${Math.floor(amt)}` : "";
            link.download = `upi_qr_${safeName}${amtPart}.${ext}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`Payment card downloaded as ${ext.toUpperCase()}!`, "download");
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
            const isPng = state.exportFormat === "png";
            const mimeType = isPng ? "image/png" : "image/jpeg";
            const ext = isPng ? "png" : "jpg";
            const blob = await canvasToBlob(exportCanvas, mimeType, isPng ? undefined : 0.95);
            const safeName = state.payeeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            const amt = parseFloat(state.amount);
            const amtPart = Number.isFinite(amt) && amt > 0 ? `_${Math.floor(amt)}` : "";
            const file = new File([blob], `upi_qr_${safeName}${amtPart}.${ext}`, { type: mimeType });
                
            // Verify sharing capability in browser
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "UPI QR Payment Card",
                    text: `Scan to pay ${state.payeeName} securely via UPI.`
                });
                showToast("Card shared successfully!", "check-circle");
            } else {
                // Fallback to direct download
                const link = document.createElement("a");
                link.download = `upi_qr_${safeName}${amtPart}.${ext}`;
                link.href = exportCanvas.toDataURL(mimeType, isPng ? undefined : 0.95);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                    
                showToast("Direct sharing unsupported. Card downloaded!", "alert-triangle");
            }
        } catch (err) {
            console.error("Share failed:", err);
            showToast("Could not share the card. Please try downloading instead.", "alert-octagon");
        }
    });
}

// --------------------------------------------------------------------------
// Application Initialization
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadSavedState();
    initHandleDropdown();
    setupEventListeners();
    updateCard();
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// Register Offline Service Worker (PWA)
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(err => {
            console.warn("Offline service worker registration failed:", err);
        });
    });
}

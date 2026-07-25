const countdownElement = document.getElementById('countdown');
const untilElement = document.getElementById('until');
const currentElement = document.getElementById('current');
const targetDateInput = document.getElementById('targetDate');
const dateLabel = document.getElementById('dateLabel');
const githubButton = document.getElementById('visitmygithub');

const defaultDate = new Date('2027-01-01T00:00:00');
const githubLink = 'https://github.com/SanityGuy';

const TRANSLATIONS = {
    en: {
        title: 'Countdown Timer',
        dateLabel: 'Enter target date and time:',
        finished: 'Countdown Finished!',
        loading: 'Loading...',
        currentDate: (date, time) => `Current Date: ${date}, Time: ${time}`,
        until: (date, time) => `until ${date}, Time: ${time}`,
        githubLabel: 'GitHub',
    },
    ru: {
        title: 'Таймер обратного отсчёта',
        dateLabel: 'Введите дату и время:',
        finished: 'Отсчёт завершён!',
        loading: 'Загрузка...',
        currentDate: (date, time) => `Текущая дата: ${date}, Время: ${time}`,
        until: (date, time) => `до ${date}, Время: ${time}`,
        githubLabel: 'ГитХаб',
    },
    id: {
        title: 'Penghitung Mundur',
        dateLabel: 'Masukkan tanggal dan waktu target:',
        finished: 'Hitung mundur selesai!',
        loading: 'Memuat...',
        currentDate: (date, time) => `Tanggal Sekarang: ${date}, Pukul: ${time}`,
        until: (date, time) => `sampai ${date}, Pukul: ${time}`,
        githubLabel: 'Github',
    },
};

const COLORS = {
    theme: {
        background: '#ffffff',
        text: '#ffffff',
        shadow: '0 0 25px rgb(125, 25, 255)',
    },
    warning: {
        text: '#ffc061',
        shadow: '0 0 25px rgb(255, 231, 97)',
    },
    danger: {
        text: '#ff4646',
        shadow: '0 0 25px rgb(255, 64, 64)',
    },
}

const THRESHOLD = {
    zero: 0,
    tenSeconds: 10_000,
    oneMinute: 60_000,
}

const FIXED_UNITS = [
    { label: "w", ms: 1000 * 60 * 60 * 24 * 7 },
    { label: "d", ms: 1000 * 60 * 60 * 24 },
    { label: "h", ms: 1000 * 60 * 60 },
    { label: "min", ms: 1000 * 60 },
    { label: "s", ms: 1000 }
]

let currentLang = localStorage.getItem('lang') || 'en';
let confettiTriggered = false;

if (typeof flatpickr !== 'undefined') {
    flatpickr(targetDateInput, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: targetDateInput.value ? targetDateInput.value : defaultDate,

        onReady(selectedDates) {
            if (selectedDates[0]) updateUntil(selectedDates[0]);
        },

        onChange(selectedDates) {
            if (selectedDates[0]) updateUntil(selectedDates[0]);
        }
    });
} else {
    console.error("flatpickr is not defined. Please ensure that the flatpickr library is included in your HTML.");
}

dateLabel.textContent = `Enter target date and time:`;
githubButton.innerHTML = `<a href="${githubLink}" target="_blank"><i class="fa-brands fa-github"></i> ${getLangStrings().githubLabel}</a>`

const pad = (num, suffix) => String(num).padStart(2, '0') + suffix;

function applyLang(lang) {
    const t = TRANSLATIONS[lang];
    if (!t) return;

    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    const titleEl = document.getElementById('title');
    const dateLabelEl = document.getElementById('dateLabel');
    const githubLabelEl = document.getElementById('githubLabel');

    if (titleEl) titleEl.textContent = t.title;
    if (dateLabelEl) dateLabelEl.textContent = t.dateLabel;
    if (githubLabelEl) githubLabelEl.textContent = t.githubLabel;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        const isActive = btn.dataset.lang === lang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    updateCountdown();
}

function getLangStrings() {
    return TRANSLATIONS[currentLang] || TRANSLATIONS.en;
}

function extractCalendarUnits(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    const reference = new Date(startDate);
    reference.setFullYear(reference.getFullYear() + years);
    reference.setMonth(reference.getMonth() + months);

    if (reference > endDate) {
        months--;
        if (months < 0) {
            years--;
            months = 11;
        }
        reference.setMonth(reference.getMonth() - 1);
    }

    const remainderMs = endDate - reference;
    return { years, months, remainderMs };
}

function formatRemainingTime(timeDifference, fromDate) {
    if (timeDifference <= THRESHOLD.zero) return "0s";

    const toDate = new Date(fromDate.getTime() + timeDifference);
    const { years, months, remainderMs } = extractCalendarUnits(fromDate, toDate);

    const parts = [];
    if (years) parts.push(pad(years, "y"));
    if (months) parts.push(pad(months, "m"));

    let remaining = remainderMs;
    for (const { label, ms } of FIXED_UNITS) {
        const count = Math.floor(remaining / ms);

        if (count > 0 || parts.length > 0) {
            parts.push(pad(count, label));
            remaining %= ms;
        }
    }

    return parts.join(" ") || "0s";
}

function getTargetDate() {
    return targetDateInput.value ? new Date(targetDateInput.value) : defaultDate;
}

function calculateRemainingTime(targetDate) {
    return targetDate - new Date();
}

function isFinished(timeDifference) {
    return timeDifference <= THRESHOLD.zero;
}

function updateCountdownColor(timeDifference) {
    let color;

    if (timeDifference <= THRESHOLD.tenSeconds) color = COLORS.danger;
    else if (timeDifference <= THRESHOLD.oneMinute) color = COLORS.warning;
    else color = COLORS.theme;

    countdownElement.style.color = color.text;
    countdownElement.style.textShadow = color.shadow;
}

function updateCurrentTime(now) {
    const t = getLangStrings();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentElement.textContent = t.currentDate(date, time);
}

function updateUntil(targetDate) {
    if (!targetDate) return;
    const t = getLangStrings();
    const date = targetDate.toLocaleDateString();
    const time = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    untilElement.textContent = t.until(date, time);
}

function updateCountdownText(timeDifference) {
    countdownElement.textContent = formatRemainingTime(timeDifference, new Date());
    document.title = formatRemainingTime(timeDifference, new Date());
}

function showFinishedMessage(targetDate) {
    countdownElement.textContent = getLangStrings().finished;
    document.title = getLangStrings().finished;
}

function updateCountdown() {
    const targetDate = getTargetDate();
    const timeDifference = calculateRemainingTime(targetDate);

    if (isFinished(timeDifference)) {
        showFinishedMessage();
        updateCountdownColor(timeDifference);

        if (!confettiTriggered) {
            confettiTriggered = true;
            confetti();
        }
    }
    else {
        confettiTriggered = false;
        updateUntil(targetDate);
        updateCurrentTime(new Date());
        updateCountdownColor(timeDifference);
        updateCountdownText(timeDifference);
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

applyLang(currentLang);
updateCountdown();
setInterval(updateCountdown, 1000);
console.log('COUNTDOWN TIMER HAS LOADED SUCCESSFULLY!');
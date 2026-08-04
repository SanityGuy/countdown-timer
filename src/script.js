const $ = id => document.getElementById(id);
const [elCd, elUntil, elCurr, elTarget, elLabel, elGit, themeTgl, langSel, btnPause, btnReset, lblPause, lblReset, pBar, elEvt] =
    ['countdown', 'until', 'current', 'targetDate', 'dateLabel', 'visitmygithub', 'themeToggle', 'langSelect', 'pauseBtn', 'resetBtn', 'pauseLabel', 'resetLabel', 'progressBar', 'eventTitleInput'].map($);

const defDate = new Date(Date.now() + 864e5 * 7);
const TRANS = {
    en: { t: 'Countdown Timer', d: 'Enter target date and time:', f: 'Finished!', p: 'Pause', r: 'Resume', rs: 'Reset', cur: (d, t) => `Current Date: ${d}, Time: ${t}`, unt: (d, t) => `until ${d}, Time: ${t}`, git: 'GitHub' },
    ru: { t: 'Таймер отсчёта', d: 'Введите дату и время:', f: 'Завершён!', p: 'Пауза', r: 'Продолжить', rs: 'Сброс', cur: (d, t) => `Текущая дата: ${d}, Время: ${t}`, unt: (d, t) => `до ${d}, Время: ${t}`, git: 'ГитХаб' },
    id: { t: 'Penghitung Mundur', d: 'Masukkan tanggal target:', f: 'Selesai!', p: 'Jeda', r: 'Lanjut', rs: 'Atur Ulang', cur: (d, t) => `Tanggal: ${d}, Pukul: ${t}`, unt: (d, t) => `sampai ${d}, Pukul: ${t}`, git: 'Github' }
};

const UNITS = [{ l: "w", ms: 6048e5 }, { l: "d", ms: 864e5 }, { l: "h", ms: 36e5 }, { l: "min", ms: 6e4 }, { l: "s", ms: 1e3 }];
let cL = localStorage.getItem('lang') || 'en', cT = localStorage.getItem('theme') || 'dark';
let isPsd = false, isConf = false, fInst = null, iDiff = 0, pRem = 0;

function pad(n, s) { return String(n).padStart(2, '0') + s; }
function getT() { return TRANS[cL] || TRANS.en; }
function getTgt() { return elTarget.value ? new Date(elTarget.value) : defDate; }
function getDiff(d) { return isPsd ? pRem : d - new Date(); }

function applyTheme(t) {
    cT = t; localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
    themeTgl.innerHTML = `<i class="fa-solid fa-${t === 'dark' ? 'moon' : 'sun'}"></i>`;
}

function updUntil(d) {
    if (d) elUntil.textContent = getT().unt(d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
}

function fmtTime(diff, from) {
    if (diff <= 0) return "0s";
    const to = new Date(from.getTime() + diff);
    let y = to.getFullYear() - from.getFullYear(), m = to.getMonth() - from.getMonth();
    if (m < 0) { y--; m += 12; }
    const ref = new Date(from); ref.setFullYear(ref.getFullYear() + y); ref.setMonth(ref.getMonth() + m);
    if (ref > to) { m--; if (m < 0) { y--; m = 11; } ref.setMonth(ref.getMonth() - 1); }
    const pts = [];
    if (y) pts.push(pad(y, "y")); if (m) pts.push(pad(m, "m"));
    let rem = to - ref;
    for (let { l, ms } of UNITS) {
        const c = Math.floor(rem / ms);
        if (c > 0 || pts.length > 0) { pts.push(pad(c, l)); rem %= ms; }
    }
    return pts.join(" ") || "0s";
}

function updCd() {
    const tgt = getTgt(), diff = getDiff(tgt), t = getT(), now = new Date();
    elCurr.textContent = t.cur(now.toLocaleDateString(), now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (diff <= 0) {
        elCd.textContent = t.f; document.title = `${t.f} - ${elEvt.value || 'Countdown'}`;
        elCd.style.color = '#ff4646'; elCd.style.textShadow = '0 0 25px rgb(255, 64, 64)'; pBar.style.width = '100%';
        if (!isConf) { isConf = true; confetti(); }
    } else {
        const fmt = fmtTime(diff, now);
        elCd.textContent = fmt; document.title = `${fmt} - ${elEvt.value || 'Countdown'}`;
        elCd.style.color = diff <= 1e4 ? '#ff4646' : diff <= 6e4 ? '#ffc061' : 'var(--text-primary)';
        elCd.style.textShadow = diff <= 1e4 ? '0 0 25px rgb(255, 64, 64)' : diff <= 6e4 ? '0 0 25px rgb(255, 231, 97)' : '0 0 25px var(--glow-shadow)';
        pBar.style.width = iDiff > 0 ? `${Math.min(100, Math.max(0, ((iDiff - diff) / iDiff) * 100))}%` : '0%';
    }
}

function setTgt(d) { isConf = false; iDiff = d - Date.now(); updUntil(d); updCd(); }

function applyLang(l) {
    if (!TRANS[l]) return;
    cL = l; localStorage.setItem('lang', l); document.documentElement.lang = l;
    const t = getT();
    $('title').textContent = t.t; elLabel.textContent = t.d; $('githubLabel').textContent = t.git;
    lblPause.textContent = isPsd ? t.r : t.p; lblReset.textContent = t.rs; langSel.value = l;
    updCd();
}

if (typeof flatpickr !== 'undefined') {
    fInst = flatpickr(elTarget, {
        enableTime: true, time_24hr: true, dateFormat: "Y-m-d H:i", defaultDate: elTarget.value || defDate,
        onReady: d => d[0] && setTgt(d[0]), onChange: d => d[0] && setTgt(d[0])
    });
}

themeTgl.onclick = () => applyTheme(cT === 'dark' ? 'light' : 'dark');
langSel.onchange = e => applyLang(e.target.value);

btnPause.onclick = () => {
    if (isPsd) {
        const nt = new Date(Date.now() + pRem);
        fInst ? fInst.setDate(nt) : elTarget.value = nt.toISOString().slice(0, 16);
        isPsd = false; lblPause.textContent = getT().p; btnPause.innerHTML = `<i class="fa-solid fa-pause"></i> <span id="pauseLabel">${getT().p}</span>`;
    } else {
        pRem = getDiff(getTgt()); isPsd = true;
        lblPause.textContent = getT().r; btnPause.innerHTML = `<i class="fa-solid fa-play"></i> <span id="pauseLabel">${getT().r}</span>`;
    }
};

btnReset.onclick = () => {
    isPsd = false; lblPause.textContent = getT().p; btnPause.innerHTML = `<i class="fa-solid fa-pause"></i> <span id="pauseLabel">${getT().p}</span>`;
    fInst && fInst.setDate(defDate); setTgt(defDate);
};

document.querySelectorAll('.preset-chip').forEach(c => c.onclick = () => {
    const n = new Date(), tgt = c.dataset.ny ? new Date(n.getFullYear() + 1, 0, 1, 0, 0, 0) :
        new Date(n.getTime() + (c.dataset.addHours ? c.dataset.addHours * 36e5 : c.dataset.addDays * 864e5));
    fInst && fInst.setDate(tgt); setTgt(tgt);
});

applyTheme(cT); applyLang(cL); updCd(); setInterval(updCd, 1000);
// Moderní panel vlaků s tmavým režimem, vyhledáváním a obrázky
function showModernTrainPanel(trains) {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('modern-train-panel');
    if (oldModal) oldModal.remove();
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.id = 'modern-train-panel';
    modal.className = 'server-modal';
    modal.style.background = 'rgba(24,26,32,0.98)';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:1200px;min-width:340px;position:relative;background:rgba(44,47,51,0.98);border-radius:24px;box-shadow:0 8px 32px #23272a99;padding:38px 38px 32px 38px;">
            <span class="server-modal-close" id="modern-train-panel-close" style="font-size:2em;top:18px;right:24px;position:absolute;cursor:pointer;color:#ffe066;">&times;</span>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
                <h2 style="font-size:2.2em;font-weight:bold;color:#ffe066;text-shadow:0 2px 12px #23272a;margin:0;">Vlaky</h2>
                <div>
                    <button id="darkmode-toggle" class="profile-btn" style="font-size:1em;padding:8px 18px;border-radius:8px;background:#23272a;color:#ffe066;">Tmavý režim</button>
                </div>
            </div>
            <div style="margin-bottom:18px;">
                <input type="text" id="train-search-modern" class="train-search" placeholder="Vyhledat podle čísla vlaku..." style="width:100%;padding:10px 16px;font-size:1.1em;border-radius:8px;border:1px solid #43b581;background:#23272a;color:#fff;">
            </div>
            <div id="modern-train-list" class="modern-train-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;"></div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); }, 10);
    document.getElementById('modern-train-panel-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    // Tmavý režim toggle
    let darkMode = true;
    document.getElementById('darkmode-toggle').onclick = () => {
        darkMode = !darkMode;
        modal.querySelector('.server-modal-content').style.background = darkMode ? 'rgba(44,47,51,0.98)' : '#fff';
        modal.style.background = darkMode ? 'rgba(24,26,32,0.98)' : '#f5f5f5';
        document.getElementById('darkmode-toggle').textContent = darkMode ? 'Tmavý režim' : 'Světlý režim';
        // Změna barvy inputu
        document.getElementById('train-search-modern').style.background = darkMode ? '#23272a' : '#fff';
        document.getElementById('train-search-modern').style.color = darkMode ? '#fff' : '#23272a';
        renderTrainsModern(document.getElementById('train-search-modern').value);
    };
    // Render vlakových karet
    function renderTrainsModern(filter = '') {
        let filtered = trains;
        if (filter.trim()) {
            const f = filter.trim().toLowerCase();
            filtered = trains.filter(train =>
                (train.trainNoLocal || train.trainNo || '').toString().toLowerCase().includes(f)
            );
        }
        const list = document.getElementById('modern-train-list');
        if (filtered.length === 0) {
            list.innerHTML = '<div style="color:#aaa;text-align:center;padding:18px 0;font-size:1.1em;">Žádné vlaky neodpovídají hledání.</div>';
            return;
        }
        list.innerHTML = '';
        filtered.forEach(train => {
            // Získání obrázku vlaku
            const trainImgSrc = getVehicleImage(train.Vehicles);
            // Ikony (použijeme obrázky z /Pictures)
            let typeIcon = '';
            if (trainImgSrc && trainImgSrc !== '/Pictures/train_default.png') {
                typeIcon = `<img src="${trainImgSrc}" alt="Vlak" style="width:48px;height:48px;border-radius:12px;box-shadow:0 2px 8px #23272a;">`;
            }
            // ...zde můžeš vykreslit kartu vlaku, např.:
            list.innerHTML += `
                <div class="modern-train-card">
                    ${typeIcon}
                    <div style="color:#ffe066;font-weight:bold;">${train.trainNoLocal || train.trainNo || '-'}</div>
                    <div style="color:#fff;">${train.trainName || train.TrainName || ''}</div>
                </div>
            `;
        });
    }
    // Spusť první render a navěs input
    renderTrainsModern();
    document.getElementById('train-search-modern').oninput = (e) => {
        renderTrainsModern(e.target.value);
    };
}
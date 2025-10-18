// run.js
(function () {
    if (sessionStorage.getItem('waPopupShown')) return;
    // Create overlay & popup directly in one go
    const overlay = document.createElement('div');
    overlay.id = 'wa-overlay';
    overlay.innerHTML = `
        <div id="wa-popup">
            <button class="wa-close-btn">×</button>
            <div class="wa-icon">📱</div>
            <div class="wa-content">
                <div class="wa-title">Join Our WhatsApp Channel!</div>
                <p class="wa-subtitle">
                    Get live sports links and exclusive updates first – join our WhatsApp channel today!
                </p>
                <div class="wa-button-group">
                    <a id="wa-join-btn" class="wa-btn wa-btn-primary" target="_blank">🚀 Join Now</a>
                    <button class="wa-btn wa-btn-secondary">Maybe Later</button>
                </div>
            </div>
        </div>
    `;
    // Append styles only once
    const style = document.createElement('style');
    style.textContent = `
        #wa-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease-out;
    font-family: system-ui, sans-serif;
}
#wa-overlay.show {
    opacity: 1;
    visibility: visible;
}
#wa-popup {
    background: linear-gradient(135deg,#25D366,#128C7E);
    color: white;
    padding: 24px 20px;
    border-radius: 16px;
    width: 360px;
    max-width: 90%;
    text-align: center;
    transform: translateY(20px);
    transition: transform 0.25s ease-out;
}
#wa-overlay.show #wa-popup {
    transform: translateY(0);
}
.wa-close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
}
.wa-icon {
    font-size: 40px;
    margin: 0 auto 15px;
}
.wa-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
}
.wa-subtitle {
    font-size: 15px;
    opacity: 0.9;
    margin-bottom: 20px;
}
.wa-button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
.wa-btn {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    cursor: pointer;
    border: none;
}
.wa-btn-primary {
    background: white;
    color: #25D366;
}
.wa-btn-secondary {
    background: rgba(255,255,255,0.15);
    color: white;
}
@media(max-width:480px) {
    #wa-popup {
    width: 320px;
}
.wa-button-group {
    flex-direction: column;
}
}
`;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    // Link
    overlay.querySelector('#wa-join-btn').href = "https://b4xw.blogspot.com/";
    // Events
    function closePopup() {
    overlay.classList.remove('show');
    sessionStorage.setItem('waPopupShown', 'true');
    setTimeout(() => overlay.remove(), 200);
}
overlay.querySelector('.wa-close-btn').onclick = closePopup;
    overlay.querySelector('.wa-btn-secondary').onclick = closePopup;
    overlay.querySelector('#wa-join-btn').onclick = closePopup;
    overlay.onclick = e => {
    if (e.target === overlay) closePopup();
}
;
    document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopup();
}
);
    // Show popup quickly after load
    window.addEventListener('load', () => {
    setTimeout(() => overlay.classList.add('show'), 600);
}
);
}
)();
    

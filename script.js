// Steam table keyed by PSIA (absolute pressure)
const steamTable = {
  14.7: 212.0, 20: 228.0, 30: 250.3, 40: 267.2, 50: 281.0,
  60: 292.7, 70: 302.9, 80: 312.0, 90: 320.3, 100: 327.8,
  120: 341.2, 140: 353.0, 160: 363.5, 180: 373.1, 200: 381.8,
  250: 400.9, 300: 417.3, 350: 431.7, 400: 444.6, 450: 456.3,
  500: 467.0, 600: 486.2, 700: 503.1, 800: 518.2, 900: 531.9, 1000: 544.6
};

// Linear interpolation to find saturation temperature
function getSaturationTemp(psia) {
  const pressures = Object.keys(steamTable).map(Number).sort((a, b) => a - b);
  if (psia <= pressures[0]) return steamTable[pressures[0]];
  if (psia >= pressures[pressures.length - 1]) return steamTable[pressures[pressures.length - 1]];

  for (let i = 0; i < pressures.length - 1; i++) {
    if (psia >= pressures[i] && psia <= pressures[i + 1]) {
      const p1 = pressures[i];
      const p2 = pressures[i + 1];
      const t1 = steamTable[p1];
      const t2 = steamTable[p2];
      return t1 + ((t2 - t1) * (psia - p1)) / (p2 - p1);
    }
  }
  return steamTable[pressures[pressures.length - 1]];
}

// Approximate enthalpy calculations
function calculateEnthalpy(tempF, psia, satTemp) {
  const isSuperheated = tempF > satTemp;

  if (isSuperheated) {
    const hfg = 970.3 - 0.5 * psia; // latent heat correction
    const hf = 180 + 0.3 * satTemp; // sensible heat
    const hg = hf + hfg;
    const superheat = tempF - satTemp;
    const cpSuperheat = 0.48; // BTU/lb-°F
    return hg + cpSuperheat * superheat;
  } else {
    const hf = 180 + 0.3 * tempF;
    return hf;
  }
}

function calculate() {
  const temp = parseFloat(document.getElementById('tempF').value);
  const pressureAbs = parseFloat(document.getElementById('pressurePSIA').value);

  if (isNaN(temp) || isNaN(pressureAbs)) {
    alert('Please enter valid numbers for both fields.');
    return;
  }

  const satTemp = getSaturationTemp(pressureAbs);
  const superheat = temp - satTemp;
  const isSuperheated = superheat > 0;
  const enthalpy = calculateEnthalpy(temp, pressureAbs, satTemp);

  let html = `
    <h2>Results</h2>
    <div class="result-row"><span>Pressure (PSIA):</span><strong>${pressureAbs.toFixed(1)} PSIA</strong></div>
    <div class="result-row"><span>Saturation Temperature:</span><strong>${satTemp.toFixed(1)} °F</strong></div>
    <div class="result-row"><span>Steam Condition:</span>
      <strong style="color:${isSuperheated ? '#dc2626' : '#2563eb'};">
        ${isSuperheated ? 'Superheated' : 'Saturated/Wet'}
      </strong>
    </div>
    <div class="result-row"><span>Degrees of Superheat:</span><strong>${superheat.toFixed(1)} °F</strong></div>
    <div class="result-row"><span>Steam Enthalpy:</span><strong>${enthalpy.toFixed(1)} BTU/lb</strong></div>
  `;

  if (!isSuperheated && superheat < 0) {
    html += `<div class="warning">⚠️ Temperature is below saturation point. This indicates wet steam or subcooled liquid.</div>`;
  }

  const results = document.getElementById('results');
  results.innerHTML = html;
  results.style.display = 'block';
}

function resetForm() {
  document.getElementById('tempF').value = '';
  document.getElementById('pressurePSIA').value = '';
  document.getElementById('results').style.display = 'none';
}

document.getElementById('calculateBtn').addEventListener('click', calculate);
document.getElementById('resetBtn').addEventListener('click', resetForm);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  deferredPrompt = e;
  // Show the install button
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt');
  } else {
    console.log('User dismissed the install prompt');
  }

  // Clear the deferred prompt
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// Hide the install button if running as a standalone PWA
function hideInstallButtonIfStandalone() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true; // iOS Safari check

  if (isStandalone) {
    installBtn.style.display = 'none';
  }
}

// Run on load
hideInstallButtonIfStandalone();

// Also listen for changes in display mode (some browsers fire this dynamically)
window.matchMedia('(display-mode: standalone)').addEventListener('change', hideInstallButtonIfStandalone);

// ================= KIOSK MODE LAUNCHER =================
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  SERVER_URL: process.env.SERVER_URL || 'http://192.168.8.10:3000',
  PC_CODE: process.env.PC_CODE || 'PC-01',
  CHROME_PATHS: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ]
};

function findBrowser() {
  for (const p of CONFIG.CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function launchKiosk() {
  const browser = findBrowser();
  if (!browser) {
    console.error('❌ Chrome/Edge tidak ditemukan!');
    process.exit(1);
  }

  const url = `${CONFIG.SERVER_URL}/user.html?pc=${CONFIG.PC_CODE}`;
  
  console.log('═══════════════════════════════');
  console.log('  🖥️  BILLING KIOSK MODE');
  console.log('═══════════════════════════════');
  console.log(`  Browser: ${browser}`);
  console.log(`  URL: ${url}`);
  console.log(`  PC Code: ${CONFIG.PC_CODE}`);
  console.log('═══════════════════════════════');

   // Profile khusus kiosk (biar tidak konflik dengan Chrome biasa)
  const userDataDir = path.join(process.env.LOCALAPPDATA || 'C:\\Temp', 'BillingKioskProfile');
  
  const flags = [
    '--kiosk',
    '--app=' + url,
    '--user-data-dir="' + userDataDir + '"',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-pinch',
    '--overscroll-history-navigation=0',
    '--disable-features=TranslateUI',
    '--noerrdialogs',
    '--disable-infobars',
    '--disable-session-crashed-bubble',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps'
  ].join(' ');

  console.log('🚀 Menjalankan kiosk...');
  const child = exec(`"${browser}" ${flags}`, (error) => {
    if (error && !error.killed) console.error('❌', error.message);
  });

  child.on('exit', (code) => {
    console.log(`\n⚠️  Browser ditutup. Restart 3 detik...`);
    setTimeout(launchKiosk, 3000);
  });
}

launchKiosk();
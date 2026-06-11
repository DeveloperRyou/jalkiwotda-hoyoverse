(() => {
  const helpers = window.__JALKIWOTDA_CONTENT_HELPERS__;
  if (!helpers) return;

  const HSR_RECORD_PATHS = new Set([
    "/app/community-game-records-sea/index.html",
    "/app/community-game-records-sea/rpg/index.html",
    "/app/community-game-records-sea/rpg/m.html",
  ]);
  const SHEET_PAGE_URL =
    "https://docs.google.com/spreadsheets/d/1kRQjQrHsgIDqPdnyDCVXG59Ge8AaKm0dyJvj6Vp2AY4/edit?gid=0";

  function attachDataset(script) {
    script.dataset.sheetPageUrl = SHEET_PAGE_URL;
    script.dataset.reportImageUrl = chrome.runtime.getURL("src/hsr/assets/report-button.webp");
    script.dataset.statIconUrl = chrome.runtime.getURL("src/hsr/assets/icon-32.png");
    script.dataset.hpIconUrl = chrome.runtime.getURL("src/hsr/assets/hp-icon.webp");
    script.dataset.atkIconUrl = chrome.runtime.getURL("src/hsr/assets/atk-icon.webp");
    script.dataset.defIconUrl = chrome.runtime.getURL("src/hsr/assets/def-icon.webp");
    script.dataset.spdIconUrl = chrome.runtime.getURL("src/hsr/assets/spd-icon.webp");
    script.dataset.critRateIconUrl = chrome.runtime.getURL("src/hsr/assets/crit-rate-icon.webp");
    script.dataset.critDmgIconUrl = chrome.runtime.getURL("src/hsr/assets/crit-dmg-icon.webp");
    script.dataset.breakIconUrl = chrome.runtime.getURL("src/hsr/assets/break-icon.webp");
    script.dataset.ehrIconUrl = chrome.runtime.getURL("src/hsr/assets/ehr-icon.webp");
    script.dataset.errIconUrl = chrome.runtime.getURL("src/hsr/assets/err-icon.webp");
    script.dataset.healIconUrl = chrome.runtime.getURL("src/hsr/assets/heal-icon.webp");
  }

  helpers.installGameContent({
    shouldInstall: () => HSR_RECORD_PATHS.has(window.location.pathname) && window.location.hash.startsWith("#/hsr"),
    injectedFiles: [
      "src/hsr/injected/00-bootstrap.js",
      "src/hsr/injected/01-utils.js",
      "src/hsr/injected/02-sheet.js",
      "src/hsr/injected/03-wiki.js",
      "src/hsr/injected/04-compare.js",
      "src/hsr/injected/05-render.js",
      "src/common/injected/response-capture.js",
      "src/hsr/injected/06-network.js",
      "src/hsr/injected/07-panel.js",
      "src/hsr/injected/08-main.js",
    ],
    attachDataset,
    sheetBridge: {
      requestType: "JALKIWOTDA_HSR_SHEET_REQUEST",
      responseType: "JALKIWOTDA_HSR_SHEET_RESPONSE",
      fetchType: "JALKIWOTDA_HSR_FETCH_SHEET",
    },
  });
})();

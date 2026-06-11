(() => {
  const app = window.JALKIWOTDA_HSR;
  if (!app) return;
  const responseCapture = window.__JALKIWOTDA_RESPONSE_CAPTURE__?.createResponseCapture({
    app,
    eventType: "jalkiwotda-hsr-response",
    logPrefix: "[jalkiwotda-hsr]",
  });
  if (!responseCapture) return;
  const {
    clearResponses,
    installFetchHook,
    installXhrHook,
  } = responseCapture;

  function getLatestDetailData() {
    for (let index = app.state.responses.length - 1; index >= 0; index -= 1) {
      const response = app.state.responses[index];
      if (response.url.includes("/hkrpg/api/avatar/info")) {
        return response.body?.data || null;
      }
    }
    return null;
  }

  Object.assign(app.network, {
    getLatestDetailData,
    clearResponses,
    installFetchHook,
    installXhrHook,
  });
})();

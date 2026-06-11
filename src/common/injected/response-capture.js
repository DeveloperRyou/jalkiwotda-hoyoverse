(() => {
  if (window.__JALKIWOTDA_RESPONSE_CAPTURE__) return;

  function headersToObject(headers) {
    const result = {};
    if (!headers) return result;

    if (typeof Headers === "function" && headers instanceof Headers) {
      headers.forEach((value, key) => { result[key] = value; });
      return result;
    }

    if (Array.isArray(headers)) {
      for (const [key, value] of headers) result[key] = value;
      return result;
    }

    if (typeof headers === "object") {
      for (const [key, value] of Object.entries(headers)) result[key] = value;
    }

    return result;
  }

  function extractFetchRequestHeaders(input, init) {
    return {
      ...headersToObject(input?.headers),
      ...headersToObject(init?.headers),
    };
  }

  function createResponseCapture({ app, eventType, logPrefix }) {
    const { getUrl, isTarget, parseJson } = app.utils;

    function makeResponseKey(url, bodyText) {
      return `${url}:${bodyText.length}:${bodyText.slice(0, 120)}`;
    }

    function trimResponseStore() {
      const overflow = app.state.responses.length - app.config.maxResponses;
      if (overflow <= 0) return;

      const removed = app.state.responses.splice(0, overflow);
      for (const response of removed) {
        if (response.key) app.state.responseKeys.delete(response.key);
      }
    }

    function recordResponse(source, url, status, bodyText, requestHeaders = {}) {
      if (!isTarget(url)) return;

      const key = makeResponseKey(url, bodyText);
      if (app.state.responseKeys.has(key)) return;
      app.state.responseKeys.add(key);

      const payload = {
        key,
        source,
        url,
        status,
        capturedAt: new Date().toISOString(),
        requestHeaders,
        body: parseJson(bodyText),
      };

      app.state.responses.push(payload);
      trimResponseStore();
      app.panel.updatePanel?.();

      window.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
      console.debug(`${logPrefix} captured`, source, url, payload.body);
    }

    function getCaptureDiagnostics() {
      return {
        captured: app.state.responses.length,
        urls: app.state.responses.slice(-8).map((response) => response.url),
        hasJson: app.state.responses.some((response) => Boolean(response.body)),
      };
    }

    function clearResponses() {
      app.state.responses = [];
      app.state.responseKeys.clear();
      app.panel.updatePanel?.();
    }

    function installFetchHook() {
      if (typeof window.fetch !== "function") return;
      if (app.state.originals.fetch) return;

      const originalFetch = window.fetch.bind(window);
      app.state.originals.fetch = originalFetch;

      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = getUrl(args[0]) || response.url || "";

        if (isTarget(url)) {
          const requestHeaders = extractFetchRequestHeaders(args[0], args[1]);
          const contentLength = Number(response.headers?.get?.("content-length") || 0);
          if (!contentLength || contentLength <= app.config.maxCaptureBytes) {
            response.clone().text()
              .then((bodyText) => recordResponse("fetch", url, response.status, bodyText, requestHeaders))
              .catch((error) => console.warn(`${logPrefix} fetch capture failed`, url, error));
          }
        }

        return response;
      };
    }

    function installXhrHook() {
      if (app.state.originals.xhrOpen || app.state.originals.xhrSend) return;

      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;
      const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      app.state.originals.xhrOpen = originalOpen;
      app.state.originals.xhrSend = originalSend;
      app.state.originals.xhrSetRequestHeader = originalSetRequestHeader;

      XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
        this.__jalkiwotdaCaptureUrl = String(url || "");
        return originalOpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader(name, value) {
        this.__jalkiwotdaCaptureHeaders = this.__jalkiwotdaCaptureHeaders || {};
        this.__jalkiwotdaCaptureHeaders[name] = value;
        return originalSetRequestHeader.call(this, name, value);
      };

      XMLHttpRequest.prototype.send = function send(...args) {
        this.addEventListener("loadend", () => {
          const url = this.__jalkiwotdaCaptureUrl || this.responseURL || "";
          if (!isTarget(url)) return;
          if (this.responseType && this.responseType !== "text") return;
          if (typeof this.responseText === "string" && this.responseText.length > app.config.maxCaptureBytes) return;
          recordResponse("xhr", url, this.status, this.responseText || "", this.__jalkiwotdaCaptureHeaders || {});
        });

        return originalSend.apply(this, args);
      };
    }

    return {
      recordResponse,
      getCaptureDiagnostics,
      clearResponses,
      installFetchHook,
      installXhrHook,
    };
  }

  window.__JALKIWOTDA_RESPONSE_CAPTURE__ = {
    createResponseCapture,
  };
})();

(function () {
  function shouldLoadSdk() {
    return location.protocol !== "file:" && !window.YaGames;
  }

  function loadSdk() {
    return new Promise((resolve) => {
      if (!shouldLoadSdk()) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://sdk.games.s3.yandex.net/sdk.js";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  const platform = {
    ysdk: null,
    readySent: false,
    async init() {
      await loadSdk();
      if (!window.YaGames || this.ysdk) return this.ysdk;
      try {
        this.ysdk = await window.YaGames.init();
      } catch (error) {
        console.warn("Yandex Games SDK init failed. Local mode is still available.", error);
      }
      return this.ysdk;
    },
    async ready() {
      const ysdk = await this.init();
      if (!ysdk || this.readySent) return;
      this.readySent = true;
      const loadingApi = ysdk.features && (ysdk.features.LoadingAPI || ysdk.features.loading_api);
      if (loadingApi && typeof loadingApi.ready === "function") {
        loadingApi.ready();
      }
    },
  };

  window.IronClashPlatform = platform;
})();

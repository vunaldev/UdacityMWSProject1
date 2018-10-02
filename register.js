document.addEventListener("DOMContentLoaded", event => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker
        .register("sw.js")
        .then(registration => console.log("registered", registration))
        .catch(e => console.log("failed", e));
    }
  });
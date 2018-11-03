document.addEventListener("DOMContentLoaded", event => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker
        .register("sw.js")
        .then(registration => console.log("registered", registration))
        .catch(e => console.log("failed", e));
    }
  });

  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
  })
  
window.addEventListener('online', e => {
    console.log("online");
    DBHelper.postOfflineReviews();
});

window.addEventListener('offline', e => {
    console.log("offline");
});

document.addEventListener("DOMContentLoaded", () => {
  const timeLimitInput = document.getElementById("timeLimit");
  const notificationsToggle = document.getElementById("notificationsToggle");

  // Fetch saved settings
  chrome.storage.sync.get(["INACTIVITY_LIMIT_MS", "NOTIFICATIONS_ENABLED"], (data) => {
    const defaultMinutes = data.INACTIVITY_LIMIT_MS
      ? data.INACTIVITY_LIMIT_MS / (60 * 1000)
      : 120;
    timeLimitInput.value = defaultMinutes;
    notificationsToggle.checked = data.NOTIFICATIONS_ENABLED !== false;
  });

  // Save settings
  document.getElementById("saveBtn").addEventListener("click", () => {
    const minutes = parseInt(timeLimitInput.value);

    // Validation: minimum 5 minutes
    if (isNaN(minutes) || minutes < 5) {
      alert("Please enter an inactivity time of at least 5 minutes.");
      return;
    }

    const ms = minutes * 60 * 1000;
    const notificationsEnabled = notificationsToggle.checked;

    chrome.storage.sync.set({
      INACTIVITY_LIMIT_MS: ms,
      NOTIFICATIONS_ENABLED: notificationsEnabled
    }, () => {
      alert("Settings saved!");
    });
  });
});

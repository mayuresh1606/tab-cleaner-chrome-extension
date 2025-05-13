chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove('inactiveTabs');
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove('inactiveTabs');
});

// Remove tab from inactive list immediately when activated
function markTabActive(tabId) {
  const timestamp = Date.now();
  chrome.storage.local.set({ [tabId]: timestamp });

  chrome.storage.local.get('inactiveTabs', data => {
    const currentList = data.inactiveTabs || [];
    const updatedList = currentList.filter(tab => tab.id !== tabId);
    if (updatedList.length !== currentList.length) {
      chrome.storage.local.set({ inactiveTabs: updatedList });
    }
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  markTabActive(activeInfo.tabId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    if (tabs[0]) {
      markTabActive(tabs[0].id);
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get('inactiveTabs', data => {
    const updatedList = (data.inactiveTabs || []).filter(tab => tab.id !== tabId);
    chrome.storage.local.set({ inactiveTabs: updatedList });
  });
  chrome.storage.local.remove(tabId.toString());
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    markTabActive(tabId);
  }
});

chrome.alarms.create('checkTabs', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.sync.get(['INACTIVITY_LIMIT_MS', 'NOTIFICATIONS_ENABLED'], (settings) => {
    const threshold = (settings.INACTIVITY_LIMIT_MS || 120 * 60 * 1000); // convert minutes to ms
    const showNotification = settings.NOTIFICATIONS_ENABLED !== false;
    
    chrome.tabs.query({}, tabs => {
      const now = Date.now();
      const inactiveTabs = [];

      tabs.forEach(tab => {
        const lastActive = tab.lastAccessed || 0;
        if ((now - lastActive) > threshold && !tab.active && tab.url.startsWith("http")) {
          inactiveTabs.push({
            id: tab.id,
            title: tab.title || tab.url,
            url: tab.url
          });
        }
      });

      if (inactiveTabs.length > 0) {
        chrome.tabs.query({}, openTabs => {
          const openTabIds = openTabs.map(t => t.id);
          const validInactiveTabs = inactiveTabs.filter(t => openTabIds.includes(t.id));
          
          chrome.storage.local.set({ inactiveTabs: validInactiveTabs });

          if (showNotification && validInactiveTabs.length > 0) {
            chrome.notifications.create('inactiveTabs', {
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Inactive Tabs Detected',
              message: `You have ${validInactiveTabs.length} tab(s) idle for a while. Click to review.`,
              priority: 2
            });
          }
        });
      }
    });
  });
});

chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === 'inactiveTabs') {
    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: 400,
      height: 600
    });
  }
});

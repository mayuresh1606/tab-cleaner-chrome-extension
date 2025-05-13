document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get('inactiveTabs', data => {
    const tabList = document.getElementById('tabList');
    const closeBtn = document.getElementById('closeSelected');
    const noTabsMsg = document.getElementById('noTabsMsg');
    let tabs = data.inactiveTabs || [];

    if (tabs.length === 0) {
      noTabsMsg.style.display = 'block';
      closeBtn.style.display = 'none';
    } else {
      noTabsMsg.style.display = 'none';
      closeBtn.style.display = 'block';

      tabs.forEach(tab => {
        const li = document.createElement('li');
        li.dataset.tabId = tab.id; // Store tab ID for easy removal later
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tab.id;

        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(tab.title || tab.url));
        tabList.appendChild(li);
      });

      closeBtn.addEventListener('click', () => {
        const selected = [...document.querySelectorAll('input[type="checkbox"]:checked')];
        const idsToClose = selected.map(cb => parseInt(cb.value));

        // Close the selected tabs
        chrome.tabs.remove(idsToClose, () => {
          // Remove <li> elements from DOM
          selected.forEach(cb => {
            const li = cb.closest('li');
            if (li) li.remove();
          });

          // Update inactiveTabs in storage
          tabs = tabs.filter(tab => !idsToClose.includes(tab.id));
          chrome.storage.local.set({ inactiveTabs: tabs });

          // If all tabs are closed, update UI
          if (tabs.length === 0) {
            noTabsMsg.style.display = 'block';
            closeBtn.style.display = 'none';
          }
        });
      });
    }
  });
});

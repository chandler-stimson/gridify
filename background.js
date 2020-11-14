const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
});

chrome.browserAction.onClicked.addListener(() => chrome.tabs.executeScript({
  runAt: 'document_start',
  file: 'data/inject/grid.js'
}));

chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'notify') {
    notify(request.message);
  }
});

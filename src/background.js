var DEV_MODE = true;

var consoleLog = function(log) {
    if (DEV_MODE === true) console.log(log);
}

var AppInfo = AppInfo || {
    kanbanTab: {},
    kanbanStatus: false,
    setKanbanTab: function(tab) {
        this.kanbanStatus = true;
        this.kanbanTab = tab;
    },
    removeKanbanTab: function() {
        this.kanbanStatus = false;
        this.kanbanTab = {};
    },
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' &&
    tab.url.search('https://mail.google.com/mail/') === 0) {
        consoleLog('initialize Gmail Kanban');
        bgMessageController.send({cmd: 'initialize'});
    }
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
    if (AppInfo.kanbanStatus === true && AppInfo.kanbanTab.id === tabId) {
        consoleLog('Kanban tab was moved');
        AppInfo.kanbanTab.index = moveInfo.toIndex;
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (AppInfo.kanbanStatus === true && AppInfo.kanbanTab.id === tabId) {
        consoleLog('Kanban tab was removed');
        AppInfo.removeKanbanTab();
    }
});

var BgMessageController = function() {};

BgMessageController.prototype.listen = function(request, sender, sendResponse) {
    consoleLog(request);
    consoleLog(sender);
    if(request.cmd === 'addCardFromGmail') {
        consoleLog('cmd: addCardFromGmail');
        consoleLog(sender.tab.url);
        var addedCardFromGmail = {
            gmailTitle: request.title,
            gmailLink: sender.tab.url
        };
        localStorage.setItem('addedCardFromGmail', JSON.stringify(addedCardFromGmail));
    } else if (request.cmd === 'openBoard') {
        consoleLog('cmd: openBoard');
    }
    openKanbanBoard();
};

BgMessageController.prototype.send = function(message, cb) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
            if(cb instanceof Function) {
                cb(response);
            }
        });  
    });
};

var bgMessageController = new BgMessageController();

var openKanbanBoard = function() {
    if (AppInfo.kanbanStatus === false) {
        chrome.tabs.create({url: 'kanban.html'}, function(tab) {
            consoleLog(tab);
            AppInfo.setKanbanTab(tab);
        });
    } else {
        chrome.tabs.get(AppInfo.kanbanTab.id, function(tab) {
            chrome.tabs.highlight({tabs: tab.index, windowId:tab.windowId}, function(window) {
                consoleLog(window);
            });
        });
    }
};

chrome.runtime.onMessage.addListener(bgMessageController.listen);

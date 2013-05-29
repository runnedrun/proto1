var scriptsToBeInjected = ["jquery191.js", "rangy-core.js","page_preprocessing.js","toolbar_ui.js","ajax_fns.js","smart_grab.js","autoresize.js",
    "jquery_elipsis.js","search_and_highlight.js","inline_save_button_fns.js","ui_fns.js","commenting_fns.js",
    "whereJSisWrittenLocalChrome.js"];

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(tab.id, {code:"showOrHidePathDisplay()"});
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        var callbackURL = chrome.extension.getURL('chrome_ex_oauth.html');
        if (tab.url != callbackURL){
            injectScripts(tabId);
        }
    }
});

oauth = ChromeExOAuth.initBackgroundPage({
        'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
        'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
        'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
        'consumer_key': 'anonymous',
        'consumer_secret': 'anonymous',
        'scope': 'https://docs.google.com/feeds/',
        'app_name': 'Webtrails'
    });

function injectScripts(tabId){
    createContentScript(0,"",tabId);
}

function createContentScript(index_of_script, contentScriptString,tabId){
    if (index_of_script >= scriptsToBeInjected.length){
        chrome.tabs.executeScript(tabId,{code:contentScriptString});
        return false;
    }
    scriptURL = chrome.extension.getURL('chrome_extension_js/'+scriptsToBeInjected[index_of_script]);
    wt_$.ajax({
        url: scriptURL,
        type: "get",
        success: function(data) {
           contentScriptString += "\n;"+  data;
           createContentScript(index_of_script+1, contentScriptString,tabId);
        }
    })
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.greeting == "login")
            console.log("authorizing");
            oauth.authorize(function() {
                console.log("authorized");
            });
            sendResponse({text: "success!"});

    });
console.log('toolbar ui loaded');

function initMyBookmarklet() {
    var displayHeight = "25px";
    trailDisplay = wt_$(document.createElement("div"));
    trailDisplay.addClass("webtrails");
    trailDisplay.css({
        "height":displayHeight,
        "width": "100%",
        "position":"fixed",
        "top":"0px",
        "text-align":"left",
        "z-index": "2147483647",
        "opacity": "1",
        "background": "#F0F0F0",
        "color": "#333",
        "line-height": "18px",
        "display":"none",
        "border-bottom-right-radius": "7px",
        "border-bottom-left-radius": "7px",
        "border-bottom" : "1px solid #aaa",
        "font-family": '"Helvetica Neue", Helvetica, Arial, sans-serif'
    });
    trailDisplay.disableSelection();

    noteDisplayWrapper = wt_$(document.createElement("div"));
    noteDisplayWrapper.css({
        "height":"18px",
        "width": "40%",
        "float":"right",
        "margin-left": "3%",
        "opacity": "1",
        "overflow": "hidden",
        "margin-top": "2px",
        "border-top-left-radius": "5px",
        "border-bottom-left-radius": "5px",
        "background-color": "#d1d1d1",
        "border": "1px solid #aaa",
        "border-right-width": "0px",
        "cursor": "default"
    });
    noteDisplayWrapper.addClass("noteDisplayWrapper").addClass("webtrails");;

    previousNoteDisplay = wt_$(document.createElement("div"));
    previousNoteDisplay.css({
        "margin-left": "5px",
        "font-size": "12px",
        "overflow": "hidden",
        "text-overflow": "ellipsis"
    });
    previousNoteDisplay.addClass("webtrails");
    previousNoteDisplay.html("Select text and press the save button to save notes.  Your last saved note will appear here");


    var linkToTrailWrapper = wt_$(document.createElement("div"));
    linkToTrailWrapper.css({
        "height":"100%",
        "display": "inline-block",
        "float": "left",
        "margin-top": "3px"
    });
    linkToTrailWrapper.addClass("webtrails");

    var linkToTrail = wt_$(document.createElement("a"));
    linkToTrail.css({
        "margin-left": "5px",
        "margin-right": "5px",
        "font-size": "12px",
        "color": "#333",
        "font-weight": "bold",
        "text-shadow": "1px 1px #F0f0f0",
        "text-decoration": "underline"
    });
    linkToTrail.addClass("webtrails");
//    linkToTrail.attr("target", "_blank");

    console.log(currentTrailID);
    wt_$(linkToTrail).html("View Trail");
    wt_$(linkToTrail).click(function(event){
        window.open(webTrailsUrl + "/trails/"+currentTrailID+"?auth_token="+wt_auth_token, "_blank")
    })
    wt_$(linkToTrail).attr('href', "#");

    deleteNoteButton = wt_$(document.createElement("button"));
    deleteNoteButton.css({
        "font-size": "12px",
        "color": "#aaa",
        "background-color": "#f0f0f0",
        "font-weight": "bold",
        "height":"20px",
        "margin-top" : "2px",
        "margin-right": "5px",
        "width": "7%",
        "float": "right",
        "border": "1px solid #aaa",
        "border-top-right-radius": "5px",
        "border-bottom-right-radius": "5px",
        "cursor": "default"
    });

    deleteNoteButton.html("Delete Note");
    deleteNoteButton.addClass("deleteNote").addClass("webtrails");

    settingsButton = wt_$(document.createElement("img"));
    settingsButton.attr('src', webTrailsUrl + "/images/power.png");
    settingsButton.addClass("webtrails");
    settingsButton.css({
        "float": "right",
        "margin-right": "5px",
        "margin-top": "6px"
    });

    settingsButton.click(function(){
        chrome.runtime.sendMessage({login:"login"}, function(response) {
            console.log(response.wt_auth_token);
            wt_auth_token = response.wt_auth_token;
            initSignedInExperience();
        });
    })

    saveSiteToTrailButton = wt_$(document.createElement("button"));
    saveSiteToTrailButton.css({
        "font-size": "12px",
        "color": "#333",
        "background-color": "transparent",
        "font-weight": "bold",
        "height":"20px",
        "width": "7%",
        "float": "right",
        "border-radius": "5px",
        "border": "1px solid #333",
        "margin-top": "2px",
        "line-height": "normal",
        "cursor": "pointer"
    });
    saveSiteToTrailButton.addClass("webtrails");
    saveSiteToTrailButton.html("Save site");

    var shareTrailField = wt_$(document.createElement("input"));
    shareTrailField.css({
        "font-size": "12px",
        "color": "#333",
        "background-color": "transparent",
        "font-weight": "bold",
        "height":"20px",
        "width":"7%",
        "float": "right",
        "margin-left": "2%",
        "line-height": "normal",
        "text-align": "center",
        "padding": "0",
        "margin-top": "2px",
        "outline": "none",
        "border-radius": "5px",
        "border": "1px solid #333",
        "cursor": "pointer"
    });
    shareTrailField.addClass("webtrails");
    shareTrailField.attr("type", "text");
    shareTrailField.attr("id", "shareTrail");
    shareTrailField.attr("value", "Share Trail");

    faviconHolder = wt_$(document.createElement("div"));
    faviconHolder.css({
        "font-size": "12px",
        "color": "#333",
        "background-color": "#f0f0f0",
        "height":"19px",
        "line-height": "25px",
        "text-align": "center",
        "padding": "0",
        "margin-top": "2px",
        "border-radius": "7px",
        "border": "1px solid #ccc",
        "width": "14%",
        "display": "inline-block",
        "overflow":"auto"
    });
    faviconHolder.addClass("webtrails");
    faviconHolder.attr("id", "faviconHolder");

    //adding all the toolbar elements to the DOM.
    wt_$(document.body).prepend(trailDisplay);

    wt_$(trailDisplay).append(settingsButton);

    wt_$(trailDisplay).append(deleteNoteButton);
    deleteNoteButton.click(deletePreviousNote);
    deleteNoteButton.attr("enabled","disabled");

    wt_$(trailDisplay).append(noteDisplayWrapper);

    wt_$(noteDisplayWrapper).append(previousNoteDisplay);

    wt_$(trailDisplay).append(shareTrailField);
    shareTrailField.click(function() {
        shareTrailField.attr("value", webTrailsUrl + '/trails/'+currentTrailID);
        shareTrailField.focus();
        shareTrailField.select();
        shareTrailField.css({"cursor": "text"});
    });

    wt_$(trailDisplay).append(saveSiteToTrailButton);
    saveSiteToTrailButton.click(function(){saveSiteToTrail(setSiteID)});

    wt_$(trailDisplay).append(linkToTrailWrapper);
    wt_$(linkToTrailWrapper).append(linkToTrail);

    wt_$(trailDisplay).append(faviconHolder);
    faviconHolder.mouseenter(growFaviconHolder).mouseleave(shrinkFaviconHolder)

    initializeAutoResize();
    initializeJqueryEllipsis();
    previousNoteDisplay.ellipsis();

    //document bindings

    wt_$(document.body).keydown(verifyKeyPress);

    wt_$(document.body).mousedown(function() {
        mouseDown=1;
    });
    wt_$(document.body).mouseup(function(){
        mouseDown=0;
    });

    if (wt_auth_token){
        //logged in
        initSignedInExperience();
    }else{
        //not logged in
        faviconHolder.html("Hit the gear icon to sign in!");
    }



    try {
        var bodymargin = wt_$('body').css('margin-left')
        if (bodymargin) {
            trailDisplay.css("margin-left", "-" + bodymargin);
        }
    }catch (e) {}
}

function initSignedInExperience(){
    console.log("intitilizing signedin in experience")
    faviconHolder.html("");
    fetchFavicons();
    wt_$(document).mousedown(possibleHighlightStart);
}

//function checkIfSignedIn(){
//    chrome.runtime.sendMessage({isUserSignedIn:"check"}, function(response) {
//        console.log(response.wt_auth_token);
//        wt_auth_token = response.wt_auth_token;
//    });
//}
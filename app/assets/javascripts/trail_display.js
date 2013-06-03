var currentSiteIndex=0;
var currentSite;
var Notes = {};
var currentNoteIndex=-1;
var presentationMode = false;
var siteHash = {};
var currentCommentBox;
console.log("js loaded, more or less")
$(function(){
    console.log("page loaded running the javascript code")
    // We should have the siteIDs set from the server page.
    // If we don't we probably shouldn't run this code on that page.
    if (typeof siteIDs == "undefined") {
        console.log("No SiteIDs, returning");
        return;
    }
    if (window.location.hash) {
        var hash = window.location.hash.substring(1);
        currentSiteIndex = parseInt(hash) || 0;
        if (currentSiteIndex >= siteIDs.length || hash == "end") {
            currentSiteIndex = siteIDs.length - 1;
        } else if (currentSiteIndex < 0) {
            currentSiteIndex = 0;
        }
    }
    var currentSiteID = String(siteIDs[currentSiteIndex]);
    currentSite = $("#"+currentSiteID);
    setTimeout(makeIframes, 1);
    $("#nextSite").click(nextSite);
    $("#previousSite").click(previousSite);
    $("#nextNote").click(nextNote);
    $("#previousNote").click(previousNote);
    if (editAccess) {
        $("#removeSite").click(removeSite);
    } else {
        $("#removeSite").remove();
    }
    $("#showNoteList").click(expandOrCloseNoteList);
    $(".noteWrapper").click(clickJumpToNote);
    $(".faviconImage").click(clickJumpToSite);
    switchToSite(currentSiteID);
});

function loadIframes(siteID){
    $('iframe#' + siteID).load(function() {
        console.log("removing loading from site:", siteID);
        $('#loading-' + siteID).remove();
        $('iframe#' + siteID).css('background', '');
    });
    $('iframe#' + siteID).attr("src", requestUrl + "/sites/" + siteID);
    $.ajax({
        url: "/async_site_load",
        type: "get",
        data: {
            "site_id" : siteID
        },
        success: readySite
    });
}

function makeIframes(){
    console.log("making iframes")
    var currentSiteID = siteIDs[currentSiteIndex];
    loadIframes(currentSiteID);
    //site IDS defined in the html
    $.each(siteIDs,function (i,siteID){
        if (siteID != currentSiteID) {
            loadIframes(siteID);
        }
    });
}

function wrapHTMLInIframe(html,iframe){
    var siteDoc = iframe[0].contentWindow.document;
    var siteBody = $('body', siteDoc);
    siteBody.wrapInner(html);
}

function insertHTMLInIframe(html,$iframe){
    var siteDoc = $iframe[0].contentWindow.document;
    var siteBody = $('body', siteDoc);
    siteBody.append(html);
}

function readySite(data){
    console.log("readying site:", data.site_id);
    var noteIDs=[];
    $.each(data.notes, function(i,note){
        noteIDs.push(String(note.note_id));
        Notes[note.note_id] = note;
    })
    var siteAttributes = {"noteIDs": noteIDs, "title" : data.title, "url" : data.url};
    siteHash[data.site_id]=siteAttributes;
}

function nextSite(){
    if (currentSiteIndex < siteIDs.length-1){
        var switchingToSiteID = siteIDs[currentSiteIndex+1];
        switchToSite(switchingToSiteID);
        currentNoteIndex = -1;
        return true;
    }
    return false;
}

function previousSite(){
    if (currentSiteIndex > 0){
        var switchingToSiteID = siteIDs[currentSiteIndex-1];
        switchToSite(switchingToSiteID);
        currentNoteIndex = -1;
    }
}

function showAllSites(){
    $(".siteFavicon").css("whitespace","");
}

// scrolls the favicon carousel to the appropriate place for the active favicon
function scroll_favicon_carousel(activeFaviconIndex){
    var scrollLeft = 150 - 14 + activeFaviconIndex*(-19);
    $(".siteFavicons").animate({"left": scrollLeft},100);
    //todo add actual scroll behavior here
}

function clickJumpToSite(e){
    var switchingToSiteWithExtraName = $(e.currentTarget).attr("id");
    var switchingToSiteID = switchingToSiteWithExtraName.replace(/\D+/,"");
    switchToSite(switchingToSiteID);
}

function switchToSite(siteID){
    closeNoteList();
    currentSite.addClass("notCurrent").removeClass("currentSite");
    console.log("switching to siteID", siteID);
    currentSite = $("#"+String(siteID));
    console.log(currentSite);
    currentSite.removeClass("notCurrent").addClass("currentSite");
    higlightCurrentSiteFavicon(siteID);

    currentSiteIndex = siteIDs.indexOf(siteID);
    currentNoteIndex = -1;
    scroll_favicon_carousel(currentSiteIndex);
    $('#goToSite').attr("href", $('.activeFavicon').attr("data-site-url"));
    window.location.hash = "#" + currentSiteIndex;
}

function getNoteIDsForCurrentSite(){
    return siteHash[getCurrentSiteID()]["noteIDs"];
}

function getCurrentNoteID(){
    return getNoteIDsForCurrentSite()[currentNoteIndex];
}

function getNumberOfNotesForCurrentSite(){
    return getNoteIDsForCurrentSite().length;
}

function nextNote(){
    if (currentNoteIndex < (getNumberOfNotesForCurrentSite()-1)){
        currentNoteIndex+=1;
        scrollToAndHighlightNote(getCurrentNoteID());
    } else {
        if(nextSite()){
            if (getNumberOfNotesForCurrentSite() > 0) {
                nextNote();
            }
        }
    }
}

function previousNote(){
    if (currentNoteIndex > 0){
        currentNoteIndex-=1;
        scrollToAndHighlightNote(getCurrentNoteID());
    } else {
        if (currentSiteIndex > 0) {
            previousSite();
            gotoLastNoteforCurrentSite();
        } else {
            switchToSite(siteIDs[0]);
        }
    }
}

function gotoLastNoteforCurrentSite(){
    var final_note_index = getNumberOfNotesForCurrentSite()-1;
    scrollToAndHighlightNote(getNoteIDsForCurrentSite()[final_note_index]);
    currentNoteIndex = final_note_index;
}

function scrollToAndHighlightNote(noteID){
    console.log('scrolling to note', noteID);
    var contWindow = iframeContentWindow();
    currentNote = Notes[noteID];
    console.log(currentNote);
    removeHighlight($(contWindow.document.body));
    removeCurrentComment();
    if(currentNote){
        var highlights = $(contWindow.document.body).find("."+currentNote.client_side_id);
        highlights.css("background-color","yellow");

        //go through all the highlighted elements and find the first one above the scroll position, then put the comment box there.
        offsets = $(highlights[0]).offset();
        highlights.each(function(i,highlight){
            if ($(highlight).offset().top > currentNote.comment_location_y){
                offsets = $(highlight).offset();
                return false;
            }
        });

        var windowHeight = $(window).height();
        var scrollPosition = offsets.top - windowHeight/2;
        $(contWindow).scrollTop(scrollPosition);

        var commentDisplay = createCommentOverlay(currentNote.comment,offsets.left,offsets.top);
        currentCommentBox = commentDisplay;
        currentNoteIndex = siteHash[getCurrentSiteID()]["noteIDs"].indexOf(String(noteID));
    }
}

function removeHighlight(node){
    node.find("wthighlight").css({"background-color":"transparent", "font-size": "1em","z-index":"0"});
}

function iframeContentWindow(){
    return $(".currentSite")[0].contentWindow;
}

function higlightCurrentSiteFavicon(currentSiteID){
    $(".activeFavicon").removeClass("activeFavicon");
    var currentSiteFavicon = $("#favicon"+String(currentSiteID));
    currentSiteFavicon.addClass("activeFavicon");
}

function expandOrCloseNoteList(){
    var currentSiteID = siteIDs[currentSiteIndex];
    var currentNoteList = $(".noteList#site"+currentSiteID);
    if (currentNoteList.hasClass("open")){
        closeNoteList();
    }else{
        openNoteList(currentNoteList);
    }
}

function closeNoteList(){
    var allNoteLists = $(".noteList");
    allNoteLists.slideUp(200);
    allNoteLists.removeClass("open");
}

function openNoteList(noteList){
    noteList.slideDown(200);
    noteList.addClass("open");
}

function clickJumpToNote(e){
    var noteWrapper = e.target;
    var noteID = noteWrapper.id.slice(4);
    scrollToAndHighlightNote(noteID);
}

function createCommentOverlay(commentText,xPos,yPos){
    var spacing = 25;
    var overlayMaxWidth = 400;

    var commentContainer = $("<div>");
    commentContainer.css({
        "background": "white",
        "color":"black",
        "position":"absolute",
        "z-index": "2147483647",
        "border": "2px solid black",
        "padding":"3px 3px 3px 3px",
        "-webkit-border-top-left-radius": "5px",
        "-webkit-border-bottom-left-radius": "5px",
        "-moz-border-radius-topleft": "5px",
        "-moz-border-radius-bottomleft": "5px",
        "border-top-left-radius": "5px",
        "border-bottom-left-radius": "5px",
        "line-height": "normal",
        "-webkit-border-top-right-radius": "5px",
        "-webkit-border-bottom-right-radius": "5px",
        "-moz-border-radius-topright": "5px",
        "-moz-border-radius-bottomright": "5px",
        "border-top-right-radius": "5px",
        "border-bottom-right-radius": "5px",
    });
    commentContainer.addClass("commentOverlay");

    var commentOverlay = $("<div>");
    commentOverlay.html(commentText);
    commentOverlay.css({
        "font-family": '"Helvetica Neue", Helvetica, Arial, sans-serif',
        "background": "white",
        "max-width": overlayMaxWidth,
        "display":"inline",
        "padding":"0px 2px 0px 2px",
        "font-size":"13px",
    });
    
    var closeCommentX = $("<div>");
    closeCommentX.css({
        "font-family": '"Helvetica Neue", Helvetica, Arial, sans-serif',
        "display":"inline",
        "border-right": "none",
        "padding":"3px 2px 3px 2px",
        "background-color": "#f0f0f0",
        "font-size": "16px",
        "margin": "0",
        "vertical-align":"baseline",
        "line-height": "normal",
        "cursor": "pointer"
    });
    closeCommentX.html("&times;");
    closeCommentX.click(closeCurrentNoteAndRemoveHighlight);

    if (commentText && (typeof commentText == "string") && commentText != "") {
        commentContainer.append(commentOverlay);
        closeCommentX.css({"border-left": "1px solid black"});
    }
    commentContainer.append(closeCommentX);

    if (editAccess) {
        var deleteCommentContainer = $("<div>");
        deleteCommentContainer.css({
            "font-family": '"Helvetica Neue", Helvetica, Arial, sans-serif',
            display:"inline",
    //        border: "2px solid black",
            "border-left": "1px solid black",
            padding:"3px 2px 3px 2px",
            "background-color": "#f0f0f0",
            "margin": "0",
            "vertical-align":"baseline",
            "line-height": "normal",
            "font-size": "16px",
            "cursor": "pointer"
        });

        var deleteComment = $("<img>");
        deleteComment.css({
            height: "16px",
            "line-height": "normal",
            border: "0",
            margin: "0",
            padding: "0",
            "vertical-align": "bottom",
            "font-size": "16px",
        })
        deleteComment.attr("src","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAQCAQAAABnqj2yAAAACXBIWXMAAAsTAAALEwEAmpwYAAADGGlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjaY2BgnuDo4uTKJMDAUFBUUuQe5BgZERmlwH6egY2BmYGBgYGBITG5uMAxIMCHgYGBIS8/L5UBFTAyMHy7xsDIwMDAcFnX0cXJlYE0wJpcUFTCwMBwgIGBwSgltTiZgYHhCwMDQ3p5SUEJAwNjDAMDg0hSdkEJAwNjAQMDg0h2SJAzAwNjCwMDE09JakUJAwMDg3N+QWVRZnpGiYKhpaWlgmNKflKqQnBlcUlqbrGCZ15yflFBflFiSWoKAwMD1A4GBgYGXpf8EgX3xMw8BSMDVQYqg4jIKAUICxE+CDEESC4tKoMHJQODAIMCgwGDA0MAQyJDPcMChqMMbxjFGV0YSxlXMN5jEmMKYprAdIFZmDmSeSHzGxZLlg6WW6x6rK2s99gs2aaxfWMPZ9/NocTRxfGFM5HzApcj1xZuTe4FPFI8U3mFeCfxCfNN45fhXyygI7BD0FXwilCq0A/hXhEVkb2i4aJfxCaJG4lfkaiQlJM8JpUvLS19QqZMVl32llyfvIv8H4WtioVKekpvldeqFKiaqP5UO6jepRGqqaT5QeuA9iSdVF0rPUG9V/pHDBYY1hrFGNuayJsym740u2C+02KJ5QSrOutcmzjbQDtXe2sHY0cdJzVnJRcFV3k3BXdlD3VPXS8Tbxsfd99gvwT//ID6wIlBS4N3hVwMfRnOFCEXaRUVEV0RMzN2T9yDBLZE3aSw5IaUNak30zkyLDIzs+ZmX8xlz7PPryjYVPiuWLskq3RV2ZsK/cqSql01jLVedVPrHzbqNdU0n22VaytsP9op3VXUfbpXta+x/+5Em0mzJ/+dGj/t8AyNmf2zvs9JmHt6vvmCpYtEFrcu+bYsc/m9lSGrTq9xWbtvveWGbZtMNm/ZarJt+w6rnft3u+45uy9s/4ODOYd+Hmk/Jn58xUnrU+fOJJ/9dX7SRe1LR68kXv13fc5Nm1t379TfU75/4mHeY7En+59lvhB5efB1/lv5dxc+NH0y/fzq64Lv4T8Ffp360/rP8f9/AA0ADzT6lvFdAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAACDSURBVHjavI4xCsJQEETfBltlO8Nv9AqpPICl5/CwniJo8dFCCNo7Fn8DxnxbB4aBfczumvilRYlk9GwAOOdtMCHEwTrJ5fJOipmJJGhoyaUfmc0EXj01mIA0+yUbNGXJ/jg1BILLfeoPVNM/kQnYXYf1kiej/XZqA7H6ar94jKiq9wBVaTFDLLMAdgAAAABJRU5ErkJggg==");
        deleteCommentContainer.append(deleteComment);
        deleteCommentContainer.click(deleteCurrentNoteFromTrail);

        commentContainer.append(deleteCommentContainer);
    }

    insertHTMLInIframe(commentContainer,currentSite);

//    var overlayWidth = getComputedStyleOfElementInIframe(commentOverlay,"width");
    var overlayHeightString = getComputedStyleOfElementInIframe(commentContainer[0],"height");
    var overlayHeightFloat = parseFloat(overlayHeightString.slice(0,overlayHeightString.length -2));
    var topPosition  =  yPos - spacing - overlayHeightFloat;
    var leftPosition = xPos;

    commentContainer.css("top", topPosition+"px");
    commentContainer.css("left", leftPosition+"px");
    return commentContainer;
}

function removeCurrentComment(){
    if (currentCommentBox){
        currentCommentBox.remove();
    }
}

// Not used, removed from the UI on the view toolbar
function showOrHideCurrentComment(){
    if($("#turnOffCommentsCheckbox").is(":checked")){
        $(iframeContentWindow().document).find(".commentOverlay").hide();
    }else{
        $(iframeContentWindow().document).find(".commentOverlay").show();
    }
}

// will return null if error
function getComputedStyleOfElementInIframe(element,stylename){
    var style = $(".currentSite")[0].contentWindow.document.defaultView.getComputedStyle(element,null);
    if (style) {
        return style[stylename];
    } else {
        return null;
    }
}

function switchToPresentationMode(){
//    $(currentSite[0].contentWindow.documenon-wrapping div full screennt.body).css({"height": "100%","width": "100%","z-index":"0"});
    insertHTMLInIframe("<div class=overlay style='background-color: #666666;z-index:99998; height: 100%; width: 100%;position: fixed; top:0; right: 0; opacity: .6;'>", currentSite);
    presentationMode = true;
}

function getCurrentSiteID(){
    return siteIDs[currentSiteIndex];
}

function deleteCurrentNoteFromTrail(){
    var currentNoteID = getCurrentNoteID();
//    console.log(currentNote);
    deleteNoteFromTrail(currentNoteID);
}

function deleteNoteFromTrail(noteID){
    if (!editAccess) { // in case called from console or something
        console.log("No access to editing this trail! No deleting notes!");
        return;
    }
    $.ajax({
        url: "/notes/delete",
        type: "post",
        data: {
            "id" : noteID
        },
        success: function(){deleteCurrentNoteLocally(); closeCurrentNoteAndRemoveHighlight()}
    })
}

function deleteSiteFromTrail(siteIndex){
    if (!editAccess) { // in case called from console or something
        console.log("No access to editing this trail! No deleting sites!");
        return;
    }
    $.ajax({
        url: "/sites/delete",
        type: "post",
        data: {
            "id" : siteIDs[siteIndex]
        },
        success: function() {deleteSiteLocally(siteIndex);}
    });
}

function removeSite() {
    console.log("remove site pressed");
    deleteSiteFromTrail(currentSiteIndex);
}

function deleteSiteLocally(siteIndex) {
    var siteID = siteIDs[siteIndex];
    var iframe = $('#' + siteID);
    if (iframe.hasClass("currentSite")) {
        if (siteIndex < siteIDs.length - 1) {
            nextSite();
            currentSiteIndex--;
        } else {
            previousSite();
        }
    }
    siteIDs.splice(siteIndex,1);
    iframe.remove();
    $('#favicon' + siteID).remove();
}

function closeCurrentNoteAndRemoveHighlight(){
    removeCurrentComment();
    removeHighlight($(iframeContentWindow().document.body));
}

function deleteCurrentNoteLocally(){
    getNoteIDsForCurrentSite().splice(currentNoteIndex,1);
}
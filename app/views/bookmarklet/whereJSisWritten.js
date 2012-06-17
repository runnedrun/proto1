var v = "1.4.1";
var trailDisplay;
var trailID = 3;
var mouseDown = 0;
var script = document.createElement("script");
var c;

var nextId = 0;

var rangeIntersectsNode = (typeof window.Range != "undefined"
        && Range.prototype.intersectsNode) ?

    function(range, node) {
        return range.intersectsNode(node);
    } :

    function(range, node) {
        var nodeRange = node.ownerDocument.createRange();
        try {
            nodeRange.selectNode(node);
        } catch (e) {
            nodeRange.selectNodeContents(node);
        }

        return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) == -1 &&
            range.compareBoundaryPoints(Range.START_TO_END, nodeRange) == 1;
    };


script.src = "http://ajax.googleapis.com/ajax/libs/jquery/" + v + "/jquery.min.js";
script.onload = script.onreadystatechange = initMyBookmarklet;
document.getElementsByTagName("head")[0].appendChild(script);


function initMyBookmarklet() {
    trailDisplay = $(document.createElement("div"));
    trailDisplay.css({
        height:"6%",
        width: "100%",
        position:"fixed",
        top:"0px",
        "text-align":"left",
        float:"left",
        "z-index": "1000",
        opacity: ".8",
        background: "#2E2E1F",
        color: "#CCCCA3"
    });
    var noteDisplay = $(document.createElement("div"));
    noteDisplay.css({
        height:"100%",
        width: "40%",
        top:"0px",
        "text-align":"left",
        "float":"right",
        "z-index": "0",
        opacity: ".8",
        background: "#2E2E1F",
        color: "#CCCCA3"
    });
    var cssStyle = $(document.createElement("style"));
    $(document.getElementsByTagName("head")[0]).append(cssStyle);
    cssStyle.html(".highlight { background-color: #ba9f65}");

    $(document.body).prepend(trailDisplay);
    trailDisplay.append(noteDisplay);
    noteDisplay.html("Select text and hold down mouse to save notes");
    noteDisplay.addClass("noteDisplay");
    $(document.body).keypress(verifyKeyPress);
    document.onmousemove = mouseStopDetect();

    document.body.onmousedown = function() {
     mouseDown=1;
    };
    document.body.onmouseup = function() {
      mouseDown=0;
    };


    addSiteToTrail();
}

function verifyKeyPress(e){
var code = (e.keyCode ? e.keyCode : e.which);
if (code == 27){
    showOrHidePathDisplay();
}
}

function showOrHidePathDisplay(){
    if (trailDisplay.is(":hidden")){
        trailDisplay.show();
     }
    else {
        trailDisplay.hide();
    }

}

function addSiteToTrail(){
    currentSite = window.location.href;
    $.ajax({
        url: "http://192.168.1.3:3000/sites",
        type: "post",
        crossDomain: true,
        data: {
           "site[url]":currentSite,
           "site[trail_id]":trailID,
            notes: "none"
                },
        success: addFaviconsToDisplay
    })
}
function addFaviconsToDisplay(data){
    $.each(data, function(i,site){
        addSiteFaviconToDisplay(site.slice(7,site.length-1).split("/")[0],site);
        }
    )
}


function addSiteFaviconToDisplay(domain,url) {
    trailDisplay.prepend("<a href="+ url+ "\" class=\"siteFavicon\"><img src=\"http://www.google.com/s2/favicons?domain=" + domain + "\"/></a>")
}

function includeTrailSubString(arr,subString) {
    for(var i=0; i<arr.length; i++) {
        var key = arr[i].split("=")[0];
        if (key.trim() == subString.trim()){
            return arr[i].split("=")[1];
        } ;
    }
    return ""
}


function smartGrabHighlightedText(){
   textObject = window.getSelection().getRangeAt(0);
   var text = String(textObject);
   if (text[0] == " "){
       text = ltrim(text);
   }else{

       var startIndex = textObject.startOffset;
       var spaceIndices = [];
       var startContainerText = textObject.startContainer.textContent;
       $.each(startContainerText, function(i,character){
            if (character==" ") {
                spaceIndices.push(i);
                if (i >= startIndex){
                    return false
                }
            }
       });
       nextSpaceIndex= spaceIndices.pop();
       previousSpaceIndex = spaceIndices.pop();

        if ((previousSpaceIndex + 1) !== startIndex){
            var wholeWord = startContainerText.slice(previousSpaceIndex+1,nextSpaceIndex);
            text = wholeWord.concat(text.substr(nextSpaceIndex-startIndex, text.length -1));
        }
   }
    if (text[text.length-1] == " "){
       text = rtrim(text);
   }else{
       var endIndex = textObject.endOffset;
       spaceIndices = [];
       var endContainerText = textObject.endContainer.textContent;
       $.each(endContainerText, function(i,character){
            if (character==" ") {
                spaceIndices.push(i);
                if (i>=endIndex){
                    return false
                }
            }
       });

       nextSpaceIndex= spaceIndices.pop();
       previousSpaceIndex = spaceIndices.pop();

        if ((nextSpaceIndex - 1) !== endIndex){
            var wholeWord = endContainerText.slice(previousSpaceIndex+1,nextSpaceIndex);
            text = text.substr(0, text.length - (endIndex-previousSpaceIndex)).concat(" " + wholeWord);
        }

   }
   return text
}

function mouseStopDetect (){
    var onmousestop = function() {
    console.log("mouse stopped");
    if (mouseDown && String(window.getSelection())){
        window.getSelection().removeAllRanges();
        $(".noteDisplay").fadeIn(100).fadeOut(100).fadeIn(100);

    }
    }, thread;

    return function() {
        if (mouseDown && String(window.getSelection())){
            var text = smartGrabHighlightedText();
            console.log(text);
            $(".noteDisplay").html(text);
        }
        clearTimeout(thread);
        thread = setTimeout(onmousestop, 1000);
    };
}

function ltrim(stringToTrim) {
	return stringToTrim.replace(/^\s+/,"");
}
function rtrim(stringToTrim) {
	return stringToTrim.replace(/\s+$/,"");
}


function applyClassToSelection(cssClass) {
    var uniqueCssClass = "selection_" + (++nextId);
    var sel = window.getSelection();
    if (sel.rangeCount < 1) {
        return;
    }
    var range = sel.getRangeAt(0);
    var startNode = range.startContainer, endNode = range.endContainer;

    if (endNode.nodeType == 3) {
        endNode.splitText(range.endOffset);
        range.setEnd(endNode, endNode.length);
    }

    if (startNode.nodeType == 3) {
        startNode = startNode.splitText(range.startOffset);
        range.setStart(startNode, 0);
    }

    var containerElement = range.commonAncestorContainer;
    if (containerElement.nodeType != 1) {
        containerElement = containerElement.parentNode;
    }

    var treeWalker = document.createTreeWalker(
        containerElement,
        NodeFilter.SHOW_TEXT,
        function(node) {
            return rangeIntersectsNode(range, node) ?
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
        false
    );

    var selectedTextNodes = [];
    while (treeWalker.nextNode()) {
        selectedTextNodes.push(treeWalker.currentNode);
    }

    var textNode, span;

    for (var i = 0, len = selectedTextNodes.length; i < len; ++i) {
        textNode = selectedTextNodes[i];
        span = document.createElement("span");
        span.className = cssClass + " " + uniqueCssClass;
        textNode.parentNode.insertBefore(span, textNode);
        span.appendChild(textNode);
    }

    return uniqueCssClass;
}

function removeSpansWithClass(cssClass) {
    var spans = document.body.getElementsByClassName(cssClass),
        span, parentNode;

    spans = Array.prototype.slice.call(spans, 0);

    for (var i = 0, len = spans.length; i < len; ++i) {
        span = spans[i];
        parentNode = span.parentNode;
        parentNode.insertBefore(span.firstChild, span);
        parentNode.removeChild(span);

        parentNode.normalize();
    }
}


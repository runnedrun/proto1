var CommentCreator = function(xPos, yPos, spacing, highlightedRange, currentNote, siteDocument) {

    function saveNoteAndRefreshAWS(comment){
        var noteOffsets = $siteDocument.find("wtHighlight.highlightMe").first().offset();
        var newNote = {
            site_id: currentNote.site.id,
            content: noteContent,
            comment: comment,
            comment_location_x: leftPosition,
            comment_location_y: topPosition,
            client_side_id: "deprecated",
            scroll_x: noteOffsets.left,
            scroll_y: noteOffsets.top,
            site_revision_number: currentNote.site.getNextRevisionNumber()
        };
        Request.addNote(newNote, currentNote, cleanHtmlForSaving(), addNewNoteToClientSideStorage)
    }

    function closeOverlay(){
        $siteDocument.unbind("mousedown", clickAway);
        commentOverlay.remove();
    }

    function clickAway(e){
        var clickedNode = $(e.target);
        if (clickedNode != commentOverlay && ($.inArray(e.target,commentOverlay.children())==-1)){
            closeOverlay(commentOverlay);
            saveNoteAndRefreshAWS(commentOverlay.find("textarea").val());
        }
    }

    function markNodeForHighlight(node, start_offset, end_offset){
        if (isTextNode(node)){
            var contents = node.nodeValue;
            var highlighted_contents = contents.slice(start_offset,end_offset);
            var whiteSpaceRegex = /^\s*$/;
            if(!highlighted_contents || whiteSpaceRegex.test(highlighted_contents)){
                console.log("nothing inside this node, not replacing");
                return false;
            }
            var unhighlighted_prepend = contents.slice(0,start_offset);
            var unhighlighted_append = contents.slice(end_offset,contents.length);

            var new_marker = siteDocument.createElement("wtHighlight")
            $(new_marker).addClass("highlightMe current-highlight").attr("data-trail-id", currentNote.site.trail.id);

            new_marker.innerHTML = highlighted_contents;
            var node_to_replace = node;
            node_to_replace.parentNode.replaceChild(new_marker,node_to_replace);

            if (unhighlighted_prepend.length !== 0 ){
                var text_before_marker = $(siteDocument.createTextNode(unhighlighted_prepend));
                text_before_marker.insertBefore(new_marker);
            }
            if (unhighlighted_append.length !== 0){
                var text_after_marker = $(siteDocument.createTextNode(unhighlighted_append));
                text_after_marker.insertAfter(new_marker);
            }
            return true;
        } else {
            return false;
        }
    }

    function highlight_wtHighlights(){
        $siteDocument.find("wtHighlight.highlightMe").css("background","yellow");
    }

    // this is the functionality for saving to server and updating client side storage
    function addNewNoteToClientSideStorage(resp){
        console.log("adding new note client side");
        var trailUpdateHash = resp.trail_update_hash;
        Trail.updateSites(resp.trail_update_hash)
    //        addNoteToNoteList(resp.site_id, resp.new_note_row);
    }

    function addNoteToNoteList(siteID, noteHtml){
        console.log("note html",noteHtml);
        var noteDisplays = $(".noteInfo[data-site-id="+String(siteID)+"]");
        //insert the new note after the last note with the same siteID
        var newNoteDisplay = noteDisplays.last().after(noteHtml);

        newNoteDisplay.click(clickJumpToNote);
        newNoteDisplay.find(".noteComment").click(makeNoteCommentEditable);
    }

    function cleanHtmlForSaving() {
        var htmlClone = $(document.getElementsByTagName('html')[0]).clone();
        removeInsertedHtml(htmlClone); // edits in-place
        return htmlClone[0].outerHTML;
    }

    function removeInsertedHtml($htmlClone) {
        $htmlClone.find('.webtrails').remove();
    }

    function postNoteAndComment(e){
        console.log("posting note");
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13 && !e.shiftKey){
            comment = commentOverlay.find("textarea").val();
            closeOverlay();
            saveNoteAndRefreshAWS(comment);
        } else if(code == 27){
            closeOverlay();
        }
    }

    var CSS = {
        commentOverlay: {
            "background": "#f0f0f0",
            "color":"#333",
            "position":"absolute",
            "border": "1px solid #ccc",
            "border-radius": "5px",
            "font-family": "'Helvetica Neue', Helvetica, Arial, sans-serif",
            "z-index": "2147483647"
        },
       commentDescription: {
            "padding": "2px",
            "text-align": "center",
            "margin-top": "3px",
            "display": "block"
       },
       commentBox: {
           "font-size":"12px",
           "overflow": "hidden",
           "resize": "none",
           "border-radius": "4px",
           "color": "#333",
           "z-index": "2147483647",
           "margin": "5px",
           "outline": "none",
           "padding": "5px",
           "border": "1px solid #666",
           "background-color": "white"
       }
    };
    var HTML = {
     commentOverlay: function(top, left) {
         return applyDefaultCSS($("<div></div>"))
         .css(CSS.commentOverlay)
         .css({"top": top + "px", "left": left + "px"})
         .addClass("commentOverlay")
         .addClass("webtrails");
     },
     commentDescription: function() {
         return $("<div></div>")
         .html("Hit enter, click away or type a comment here")
         .css(CSS.commentDescription);
     },
     commentBox: function(height, width) {
         return applyDefaultCSS($("<textarea></textarea>"))
         .css(CSS.commentBox)
         .css({"height": String(height)+"px", "width": String(width)+"px"});
     }
    };

    var overlayHeight = 20;
    //make this dynamic so the size of the comment box changes based on page size
    var overlayWidth = 400;
    var $siteDocument = $(siteDocument);
    var $siteBody = $(siteDocument.body);

    var topPosition  =  yPos + spacing;
    var leftPosition = xPos > overlayWidth ? (xPos - overlayWidth) : xPos;

    var commentOverlay = HTML.commentOverlay(topPosition, leftPosition);
    var commentDescription = HTML.commentDescription();
    var commentBox = HTML.commentBox(overlayHeight, overlayWidth);

    var comment;

    $siteBody.append(commentOverlay);
    $(commentOverlay).append(commentDescription);
    $(commentOverlay).append(commentBox);
    var noteContent = String(highlightedRange);

    commentBox.keydown(postNoteAndComment);
    $siteDocument.mousedown(clickAway);

    commentBox.autosize();
    commentBox.focus();
    var nodes = highlightedRange.getNodes();

    // the start offset indicates the offset from the beginning of the first text node,
    // if the range does not begin with a text node we have to walk the range until we find one.
    var reachedFirstTextNode = false;
    $("wtHighlight").removeClass("current-highlight");
    $.each(nodes,function(i,node){
        if (i == 0 || !reachedFirstTextNode){
            reachedFirstTextNode = markNodeForHighlight(node, highlightedRange.startOffset, node.length);
        }
        else if (i == (nodes.length-1)){
            markNodeForHighlight(node, 0, highlightedRange.endOffset);
        }
        else {
            markNodeForHighlight(node, 0, node.length);
        }
    });
    highlight_wtHighlights();
}
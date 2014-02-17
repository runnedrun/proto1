console.log("trail preview injected");

function TPreview(previewContainer, height) {
    var currentTrail = false;
    var currentNote = false;
    var currentSiteFrame = false;
    var shown = false;
    var thisTrailPreview = this;
    var commentBoxToggled = false
    height = 200;

    var nextNoteButton = $(".nextNoteButton");
    var previousNoteButton = $(".previousNoteButton");
    var showCommentButton = $(".showCommentButton");
    var deleteNoteButton = $(".deleteNoteButton");

    function getSiteIDoc(site) {
       return thisTrailPreview.getIDoc($("[data-site-id='" + site.id + "']"));
    }

    function addEmptyIframeToPreview(site, hideIframe) {
        var siteHtmlIframe = $("<iframe data-trail-id='" + site.trail.id + "' data-site-id='"+site.id+"' seamless='seamless' class='wt-site-preview webtrails'>");
        siteHtmlIframe.attr('src',"about:blank");
        siteHtmlIframe.css({
//            visibility: hideIframe ? "hidden" :"visible",
            visibility: false ? "hidden" :"visible",
            width:"100%",
            "border-top": "2px gray solid",
//            position: "fixed",
            height: height + "px",
//            top: "25px",
            "border-bottom": "2px solid grey",
//            "z-index": "2147483645"
        });
        previewContainer.append(siteHtmlIframe);
        return siteHtmlIframe
    }

    this.initWithTrail = function(trailToPreview) {
        currentTrail = trailToPreview
        currentNote = currentTrail.getLastNote();
        if (currentNote) {
            this.displayNote(currentNote, !toolbarShown);
        } else if (currentSiteFrame){
            currentSiteFrame.remove();
        }
    }

    this.show = function() {
        if (currentSiteFrame){
            var pageOffset = height + 25
            currentSiteFrame.css({visibility: "visible"});
            $(document.body).css({
                top: pageOffset + "px",
                position: "relative"
            });
            $(document.body).scrollTop($(document.body).scrollTop() + pageOffset);
            shown = true
        }
    }

    this.hide = function() {
        if (currentSiteFrame){
            var pageOffset = height + 25
            currentSiteFrame.css({visibility: "hidden"});
            shown = false;
            $(document.body).css({
                top:"0px"
            });
            $(document.body).scrollTop($(document.body).scrollTop() - pageOffset);
        }
    }

    this.switchToNoteRevision = function(note, hidePreview) {
        currentSiteFrame && currentSiteFrame.remove();
        var siteHtmlIframe = addEmptyIframeToPreview(note.site, hidePreview);
        var iframeDocument = thisTrailPreview.setIframeContent(siteHtmlIframe, note.getSiteRevisionHtml() || "Uh oh");
        currentSiteFrame = siteHtmlIframe;
        return $(iframeDocument);
    }

    this.displayNote = function(note, hidePreview) {
        var $iDoc = thisTrailPreview.switchToNoteRevision(note, hidePreview);
        $iDoc.scrollTop(note.scrollY-100).scrollLeft(note.scrollX);
        currentNote = note;
        if (commentBoxToggled) {
            displayComment();
        }
        thisTrailPreview.runWhenLoaded(function() {
            var noteElements = thisTrailPreview.highlightNote(note);
            var noteLocation = noteElements.first().offset();
            var scrollTop = noteLocation.top-100;
            var scrollLeft = noteLocation.left;
            if ((Math.abs(noteLocation.top - note.scrollY) > 10) || (Math.abs(noteLocation.left - note.scrollX) > 10)){
                console.log("correcting scroll", noteLocation.top, note.scrollY);
                console.log(noteLocation.left, note.scrollX);
                $iDoc.scrollTop(scrollTop).scrollLeft(scrollLeft);
            }
        },$iDoc[0]);
    }

    this.highlightNote = function(note) {
        return thisTrailPreview.highlightElements(thisTrailPreview.getNoteElements(note));
    };

    this.getNoteElements = function(note) {
        var siteIDoc = getSiteIDoc(note.site);
        return $("wtHighlight[data-trail-id="+Trails.getCurrentTrailId()+"].current-highlight", siteIDoc)
    }

    this.showNextNote = function() {
        var nextNote = currentNote.nextNote();
        if (nextNote) {
            thisTrailPreview.displayNote(nextNote);
            thisTrailPreview.enableOrDisablePrevAndNextButtons(currentNote);
            return true
        } else {
            return false
        }
    }

    this.showPreviousNote = function() {
        var previousNote = currentNote.previousNote();
        if (previousNote) {
            thisTrailPreview.displayNote(previousNote);
            thisTrailPreview.enableOrDisablePrevAndNextButtons(currentNote);
            return true
        } else {
            return false
        }
    }

    this.enableOrDisablePrevAndNextButtons = function(currentNote) {
        if(currentNote && currentNote.nextNote()) {
            nextNoteButton.enable();
        } else {
            nextNoteButton.disable();
        }
        if(currentNote && currentNote.previousNote()) {
            console.log("enabling previous note");
            previousNoteButton.enable();
        } else {
            previousNoteButton.disable();
        }
    }

    this.highlightElements = function($elements) {
        return $elements.css({
            "background": "yellow"
        })
    }

    function displayComment() {
        removeComment()
        var commentBox = $("<div></div>")
        applyDefaultCSS(commentBox).css({
            position: "fixed",
            height: height,
            top: "25px",
            right: "0px",
            width: "150px",
            background: "#F0F0F0",
            "z-index": "2147483647",
            "font-size": "12px",
            "padding": "0 5px 0 5px"
        }).addClass("wt-note-comment");
        var commentHeader = $("<div>Comment:</div>")
        applyDefaultCSS(commentHeader).css({
            "border-bottom": "2px black solid",
            "font-size": "14px",
            "width": "100%",
            "display": "block",
            "margin-bottom": "5px",
            "margin-top": "5px"
        });
        commentBox.append(commentHeader).append("<div>"+ (currentNote.comment || "no comment") + "</div>");
        $(document.body).append(commentBox);
    }

    function removeComment() {
        $(".wt-note-comment").remove();
    }

    function toggleCommentBox() {
        displayComment();
        commentBoxToggled = true;
        showCommentButton.css({
            "background": "grey"
        });
    }

    function unToggleCommentBox() {
        removeComment();
        commentBoxToggled = false;
        showCommentButton.css({
            "background": "none"
        });
    }

    function toggleOrUntoggleCommentBox() {
        commentBoxToggled ? unToggleCommentBox() : toggleCommentBox();
    }

    function deleteCurrentNote(){
        var noteToBeDeleted = currentNote;
        deleteNote(noteToBeDeleted, function() {
            if (!thisTrailPreview.showPreviousNote()){
                if (!thisTrailPreview.showNextNote()){
                    thisTrailPreview.hide();
                }
            };
            if (noteToBeDeleted.site.isCurrentSite()) {
                Trails.decrementNoteCount();
            }
            noteToBeDeleted.delete();
            thisTrailPreview.enableOrDisablePrevAndNextButtons(currentNote);
        })
    }

    this.updateWithNewNote = function(newNote) {
        if (!currentNote || (parseInt(currentNote.site.id) <= parseInt(newNote.site.id))){
            currentNote = newNote;
            this.displayNote(currentNote, !toolbarShown);
        }
        this.enableOrDisablePrevAndNextButtons();
    }

    nextNoteButton.disable = previousNoteButton.disable = function() {
        this.prop('disabled', true);
        this.css({
            color: "grey"
        })
        this.enabled = false;
    }

    nextNoteButton.enable = previousNoteButton.enable = function() {
        this.prop('disabled', false);
        this.css({
            color: "black"
        })
        this.enabled = true;
    }

    showCommentButton.click(toggleOrUntoggleCommentBox);
    nextNoteButton.click(this.showNextNote);
    previousNoteButton.click(this.showPreviousNote);
    deleteNoteButton.click(deleteCurrentNote);

    this.enableOrDisablePrevAndNextButtons(currentNote);
}
TPreview.prototype = IframeManager
console.log("trail preview injected");

TPreview = function(){
    var currentTrail = false;
    var currentNote = false;
    var currentSiteFrame = false;
    var shown = false;
    var thisTrailPreview = this;
    var commentBoxToggled = false;
    this.height = 200;

    this.getCurrentNote = function() { return currentNote }
    this.hide = function() {
        currentSiteFrame && currentSiteFrame.hide();
    }
    this.show = function() {
        currentSiteFrame && currentSiteFrame.show();
    }

    this.setIframeContent = function($iframe,html) {
        var iDoc = getIDoc($iframe)[0];
        iDoc.open();
        iDoc.writeln(html);
        iDoc.close();
        var headTag  = iDoc.getElementsByTagName("head")[0];
        headTag.className = headTag.className + " wt-site-preview";
        return $iframe[0].contentWindow.document;
    }

    function addEmptyIframeToPreview(site, hideIframe) {
        var siteHtmlIframe = $("<iframe data-trail-id='" + site.trail.id + "' data-site-id='"+site.id+"' seamless='seamless' class='wt-site-preview webtrails'>");
        console.log("iframe", siteHtmlIframe);
        siteHtmlIframe.attr('src',"about:blank");
        siteHtmlIframe.css({
            width:"100%",
            height: "100%",
            "z-index": "2147483645"
        });
        $(document.body).find(".siteDisplayDiv").append(siteHtmlIframe);
        return siteHtmlIframe
    }

    this.initWithTrail = function(trailToPreview) {
        currentTrail = trailToPreview;
        if (trailToPreview.getFirstSite()) {
            currentNote = new BaseRevisionNote(trailToPreview.getFirstSite());
            this.displayNote(currentNote);
        } else if (currentSiteFrame){
            // for multitrail display, whenever I get around to making it
            currentSiteFrame.remove();
        }
    }

    this.switchToNoteRevision = function(note) {
        currentSiteFrame && currentSiteFrame.remove();
        var siteHtmlIframe = addEmptyIframeToPreview(note.site);
        var iframeDocument = thisTrailPreview.setIframeContent(siteHtmlIframe, note.getSiteRevisionHtml() || "Uh oh");
        currentSiteFrame = siteHtmlIframe;
        return $(iframeDocument);
    }

    this.displayNote = function(note) {
        var $iDoc = thisTrailPreview.switchToNoteRevision(note);
        currentNote = note;
        if (!note.isBase) {
            $iDoc.scrollTop(note.scrollY-300).scrollLeft(note.scrollX);
            var comment = displayComment(note.scrollY, note.scrollX);
            runWhenLoaded(function() {
                var noteElements = thisTrailPreview.highlightNote(note);
                var noteLocation = noteElements.first().offset();
                var scrollTop = noteLocation.top-300;
                var scrollLeft = noteLocation.left;
                if ((Math.abs(noteLocation.top - note.scrollY) > 10) || (Math.abs(noteLocation.left - note.scrollX) > 10)){
                    console.log("correcting scroll", noteLocation.top, note.scrollY);
                    console.log(noteLocation.left, note.scrollX);
                    $iDoc.scrollTop(scrollTop).scrollLeft(scrollLeft);
                    comment.remove();
                    displayComment(scrollLeft, scrollTop);
                }
            },$iDoc[0]);
        }
        Toolbar.update(currentNote)
    }

    this.highlightNote = function(note) {
        var siteIDoc = getSiteIDoc(note.site);
        var noteElements = $("wtHighlight[data-trail-id="+Trails.getCurrentTrailId()+"]", siteIDoc);
        thisTrailPreview.highlightElements(noteElements);
        return noteElements
    }

    this.showNextNote = function() {
        var nextNote = currentNote.nextNote();
        if (nextNote) {
            thisTrailPreview.displayNote(nextNote);
            return true
        } else {
            return false
        }
    }

    this.showPreviousNote = function() {
        var previousNote = currentNote.previousNote();
        if (previousNote) {
            thisTrailPreview.displayNote(previousNote);
            return true
        } else {
            var baseRevisionNote = new BaseRevisionNote(currentNote.site);
            thisTrailPreview.displayNote(baseRevisionNote);
        }
    }

    this.showNextSite = function() {
        var nextSite = currentNote.site.nextSite();
        if (nextSite) {
            thisTrailPreview.showSite(nextSite);
            return true
        } else {
            return false
        }
    }

    this.showPreviousSite = function() {
        var previousSite = currentNote.site.previousSite();
        if (previousSite) {
            thisTrailPreview.showSite(previousSite);
            return true
        } else {
            return false
        }
    }

    this.showSite = function(site) {
        thisTrailPreview.displayNote(new BaseRevisionNote(site))
    }

    this.highlightElements = function($elements) {
        $elements.css({
            "background": "yellow"
        })
    }

    this.updateWithNewNote = function(newNote) {
        if (!currentNote || (parseInt(currentNote.site.id) <= parseInt(newNote.site.id))){
            currentNote = newNote;
            this.displayNote(currentNote, !toolbarShown);
        }
        Toolbar.update(currentNote);
    }

    this.toggleOrUntoggleCommentBox = function() {
        commentBoxToggled ? unToggleCommentBox() : toggleCommentBox();
    }

    this.deleteCurrentSite = function() {
        if (canEdit() && currentNote) {
            var currentSite = currentNote.site;
            Request.deleteSite(currentSite, function() {
                if (currentSite.previousSite()) {
                    thisTrailPreview.showPreviousSite();
                } else if(currentSite.nextSite()) {
                    thisTrailPreview.showNextSite();
                } else {
                    currentSiteFrame.remove();
                    currentNote = false;
                    Toolbar.update(currentNote);
                }
                currentSite.delete();
            });
        }
    };

    this.deleteNote = function(note) {
        if (canEdit()) {
            var noteToBeDeleted = note;
            Request.deleteNote(noteToBeDeleted, function() {
                this.showSite(note.site);
                noteToBeDeleted.delete();
                Toolbar.update(currentNote);
            })
        }
    };

    function displayComment(scrollY, scrollX) {
        var comment = new Comment(currentNote, scrollY, scrollX, thisTrailPreview);
        getSiteIDoc(currentNote.site).find("body").append(comment.commentContainer);
        return comment;
    }

    function getSiteIDoc(site) {
        return getIDoc($(".wt-site-preview[data-site-id='" + site.id + "']"));
    }

    function getIWindow($iframe) {
        return $($iframe[0].contentWindow);
    }
}

// the note like class which is used for displaying base revisiosn
BaseRevisionNote = function(site){
    this.site = site;
    this.nextNote = function() {
        return site.nextNoteFromBase();
    };
    this.previousNote = function() {
        return site.previousNoteFromBase() || "base";
    };
    this.getSiteRevisionHtml = function() {
        return site.getBaseRevisionHtml();
    };
    this.getPositionInSite = function() {
        return 0;
    }
    this.isBase = true;
}

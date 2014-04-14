
// the intitialization code for the trail display page
// the rest of the functionality is split up in the various trail_display_<functionality>.js files
var extensionId = "licjjfdkiaomppkgbnodndielanmemej";
var currentSiteIndex=0;
var currentSite;
var Notes = {};
var currentNoteIndex=-1;
var presentationMode = false;
var siteHash = {};
var currentCommentBox;
var nextNoteActivated = true;
var previousNoteActivated = true;
var noteViewActive = false;
// var siteIDs
// var requestUrl
// var editAccess
// var trailID
// are all declared in the html, using erb

$(function(){
    // We should have the siteIDs set from the server page.
    // If we don't we probably shouldn't run this code on that page.
    if (typeof siteIDs == "undefined") {
        console.log("No SiteIDs, returning");
        return;
    }

    //    check for hash to set correct site
    var startingSiteId = false
    if (window.location.hash) {
        var hash = window.location.hash.substring(1).split("-");
        var siteIdString = hash[0];
        var noteIdString = hash[1];
        var startingSiteId = siteIdString && parseInt(siteIdString);
        var startingNoteId = noteIdString && parseInt(noteIdString);
    }

    fetchSiteHtml(startingSiteId, startingNoteId);

    rangy.init();
    initializeAutoResize();

    makeFaviconsDragable();
    makeNotesDragable();
});

function removeLoadingFromSite(siteID) {
    console.log("removing loading from site:", siteID);
    $('#loading-' + siteID).remove();
    $('iframe#' + siteID).css('background-image', 'none');
}

function fetchSiteHtml(startingSiteId, startingNoteId) {
    var deferreds = $.map(trailDisplayHash.sites.siteObjects, function(site,id){
        return $.map(site.revisionUrls, function(url, revisionNumber) {
            var deferred = $.Deferred();
            var callCount = 0;
            console.log("making ajax request for " + url);
            function retrieveHtml() {
                $.ajax({
                    url: url,
                    type: "get",
                    dataType: "html",
//                    crossDomain: true,
                    success: function(resp){
                        console.log("succceded in fetch");
                        trailDisplayHash.sites.siteObjects[id]["html"][revisionNumber] =  resp;
                        deferred.resolve()
                    },
                    error: function(resp){
                        callCount += 1;
                        console.log("failed to fetch");
                        if (callCount > 2) {
                            console.log("more than two retries for each html, failing");
                            trailDisplayHash.sites.siteObjects[id]["html"][revisionNumber] =
                                "<div class='row'>" +
                                    " <h1 class='please-reload' style='text-align: center; margin-top: 200px;'>" +
                                        "Sometimes sites don't load the first time, refresh the page to view this trail!" +
                                    "</h1> " +
                                "</div>";
                            deferred.resolve();
                        } else {
                            retrieveHtml();
                        }
                    }
                })
            }

            retrieveHtml();
            return deferred.promise()
        })
    });

    $.when.apply($, deferreds).always(function(){
        console.log("html retrieval complete");
        var trailsHash = {};
        trailsHash[trailDisplayHash.id] = trailDisplayHash;

        Trails = new TrailsObject(trailsHash, trailDisplayHash.id);
        Trails.initTrails();
        Trail = Trails.getCurrentTrail();
        TrailPreview = new TPreview();
        PanelView = new PanelView(TrailPreview);
        NoteViewer = TrailPreview.noteViewer;
        Toolbar = new TToolBar(TrailPreview, PanelView, NoteViewer);
        Trails.switchToTrail(Trail.id, startingSiteId, startingNoteId);
        $(".siteDisplayDiv").removeClass("loading");
    })
}

function getIDoc($iframe) {
    return $($iframe[0].contentWindow.document);
}

function runWhenLoaded(fn, doc){
    var doc = doc || document;
    var loadedCheck = setInterval(function(){
        if (doc.readyState === "complete"){
            clearInterval(loadedCheck);
            fn();
        }
    },100);
}

function canEdit() {
    if (!editAccess) { // in case called from console or something
        console.log("No access to editing this trail!");
        return false;
    } else { return true}
}
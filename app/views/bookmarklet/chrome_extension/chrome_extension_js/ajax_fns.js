console.log("ajax_fns loaded");

function signRequestWithWtAuthToken(xhr,ajaxRequest){
    xhr.setRequestHeader("WT_AUTH_TOKEN", wt_auth_token);
    xhr.setRequestHeader("Accept","application/json");
}

function saveSiteToTrail(note){
    var currentSite = window.location.href;
    if (Trails.siteSavedDeeply() && !Trails.getCurrentSiteId()) {
        console.log("saved already, but not returned yet");
        setTimeout(function(){saveSiteToTrail(note)}, 100);
        return
    }

    var currentRevisionNumber = Trails.getAndIncrementRevision();
    if (note) {
        note = $.extend(note, {site_revision_number: currentRevisionNumber});
    }

    console.log("note is ", note);
    if (!Trails.getCurrentSiteId()){
        $.ajax({
            url: webTrailsUrl + "/sites/get_new_site_id",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "site[url]":currentSite,
                "site[trail_id]":Trails.getCurrentTrailId(),
                "site[title]": document.title,
                "site[domain]": document.domain,
                "site[html_encoding]": document.characterSet,
                "note":  note || {}
            },
            success: function(resp){
//                Trails.switchToTrail(resp.current_trail_id);
                Trails.getTrail(resp.current_trail_id).setCurrentSiteId(resp.current_site_id);
                parsePageBeforeSavingSite($.extend(resp, {
                    isBaseRevision: true,
                    revision_number: currentRevisionNumber
                }));
            }
        })
    }  else {
        $.ajax({
            url: webTrailsUrl + "/notes",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "note": $.extend(note, {site_id: Trails.getCurrentSiteId()})
            },
            success: function(resp){
                parsePageBeforeSavingSite($.extend(resp,{
                    current_site_id: Trails.getCurrentSiteId(),
                    current_trail_id: Trails.getCurrentTrailId(),
                    shallow_save: true,
                    revision_number: currentRevisionNumber,
                    update_on_finish: true
                }));
                updateTrailDataWhenNoteReady(resp.note_id);
            }
        })
    }
}

function fetchFavicons(){
    //also gets the users latest trail id, if none is saved in localstorage
    var currentSite = window.location.href;
    $.ajax({
        url: webTrailsUrl + "/trail/site_list",
        type: "get",
        crossDomain: true,
        data: {
            "trail_id": Trails.getCurrentTrailId(),
            "current_url": currentSite
        },
        beforeSend: signRequestWithWtAuthToken,
        success: function(resp){
            addFaviconsToDisplay(resp);
            setTrailSelect(resp.trails);
        }
    });
}

function deleteNote(note, callback){
    $.ajax({
        url: webTrailsUrl + "/notes/delete",
        type: "post",
        crossDomain: true,
        beforeSend: signRequestWithWtAuthToken,
        data: {
            "id": note.id
        },
        success: function(resp) { updateTrailDataInLocalStorage(); callback(resp); },
        error: function(){ butterBarNotification("Failed to delete note, please try again") }
    });
}

function updateTrailDataWhenNoteReady(noteId){
    var existsRequest = setInterval(function(){
        $.ajax({
            url: webTrailsUrl + "/note/ready",
            type: "get",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "id": noteId
            },
            success: function(resp){
                if (resp.ready){
                    console.log("note ready, updating");
                    clearInterval(existsRequest);
                    updateTrailDataInLocalStorage();
                }
            }
        })
    }, 1000)
}


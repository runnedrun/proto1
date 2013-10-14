console.log("ajax_fns loaded");


function signRequestWithWtAuthToken(xhr,ajaxRequest){
    xhr.setRequestHeader("WT_AUTH_TOKEN",wt_auth_token);
    xhr.setRequestHeader("Accept","application/json");
}

function saveSiteToTrail(note){
    console.log("saving site to trail:", currentSiteID);
    var currentSite = window.location.href;
    if (siteSavedDeeply && !currentSiteID) {
        console.log("saved already, but not returned yet");
        setTimeout(function(){saveSiteToTrail(successFunction, note)}, 100);
        return;
    }

    var currentRevisionNumber = Trails.getAndIncrementRevision();
//    if (note) {
//        note = wt_$.extend(note, {site_revision_number: currentRevisionNumber});
//    }

    console.log("note is ", note);
    if (!siteSavedDeeply){
        wt_$.ajax({
            url: webTrailsUrl + "/sites/get_new_site_id",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "site[url]":currentSite,
                "site[trail_id]":Trails.getCurrentTrailId(),
                "site[title]": document.title,
                "site[domain]": document.domain,
                "note":  note || {}
            },
            success: function(resp){
                Trails.switchToTrail(resp.current_trail_id);
                setSiteID(resp.current_site_id);
                parsePageBeforeSavingSite(wt_$.extend(resp, {
                    isBaseRevision: true,
                    revision_number: currentRevisionNumber
                }));
            }
        })
    }  else {
        // get and increment so that the next note does not have the same revision number
        wt_$.ajax({
            url: webTrailsUrl + "/notes",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "note": wt_$.extend(note, {site_id: currentSiteID})
            },
            success: function(resp){
                parsePageBeforeSavingSite(wt_$.extend(resp,{
                    current_site_id: currentSiteID,
                    current_trail_id: Trails.getCurrentTrailId(),
                    shallow_save: true,
                    revision_number: currentRevisionNumber,
                    update_on_finish: true
                }));
                updateTrailDataWhenNoteReady(resp.note_id);
            }
        })
    }

    if (!siteSavedDeeply){
        siteSavedDeeply = true;
        saveSiteToTrailButton.text("Site saving");
        saveSiteToTrailButton.unbind();
        saveSiteToTrailButton.css({"cursor": "default"});

        // now check to see if site is actually saved, and update the UI accordingly
        var updateSiteSavedButton = function() {
            if (currentSiteID) {
                wt_$.ajax({
                    url: webTrailsUrl + '/site/exists',
                    type: "get",
                    crossDomain: true,
                    beforeSend: signRequestWithWtAuthToken,
                    data: {
                        "id": currentSiteID
                    },
                    success: function(data) {
                            if (data.exists) {
                                // Our page exists, and we should correct the save site button
                                saveSiteToTrailButton.text("Site saved!").stop().css({opacity: 0}).animate({opacity: 1}, 700 );
                                saveSiteToTrailButton.unbind().click(function(){window.open(webTrailsUrl + '/trails/' + Trails.getCurrentTrailId() + "#"+String(data.id), '_blank');});
                                saveSiteToTrailButton.css({"cursor": "pointer"});
                                console.log("updating local storage");
                                updateTrailDataInLocalStorage();
                            } else {
                                setTimeout(updateSiteSavedButton, 1000); // check again
                            }
                        }
                });
            } else {
                setTimeout(updateSiteSavedButton, 1000); // check again
            }
        }
        setTimeout(updateSiteSavedButton, 1000);
    }
}

function fetchFavicons(){
    //also gets the users latest trail id, if none is saved in localstorage
    var currentSite = window.location.href;
    wt_$.ajax({
        url: webTrailsUrl + "/trail/site_list",
        type: "get",
        crossDomain: true,
        data: {
            "trail_id": Trails.getCurrentTrailId(),
            "current_url": currentSite
        },
        beforeSend: signRequestWithWtAuthToken,
        success: function(resp){
            Trails.switchToTrail(resp.trail_id);
            addFaviconsToDisplay(resp);
            setTrailSelect(resp.trails);
        }
    });
}

function deletePreviousNote(){
    noteCount--;
    wt_$.ajax({
        url: webTrailsUrl + "/notes/delete",
        type: "post",
        crossDomain: true,
        beforeSend: signRequestWithWtAuthToken,
        data: {
            "id": previousNoteID
        },
        success: updateNoteDisplay
    })
}

function updateTrailDataWhenNoteReady(noteId){
    var existsRequest = setInterval(function(){
        wt_$.ajax({
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


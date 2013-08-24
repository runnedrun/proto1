console.log("ajax_fns loaded");


function signRequestWithWtAuthToken(xhr,ajaxRequest){
    xhr.setRequestHeader("WT_AUTH_TOKEN",wt_auth_token);
    xhr.setRequestHeader("Accept","application/json");
}

function retrieveSiteData(){
    console.log("fethcing site data now!");

    wt_$.ajax({
        url: webTrailsUrl + "/users/get_all_sites",
        type: "get",
        beforeSend: signRequestWithWtAuthToken,
        success: updateStoredSites
    })
}

function saveSiteToTrail(note){
    console.log("saving site to trail:", currentSiteID);
    var currentSite = window.location.href;
    if (siteSavedDeeply && !currentSiteID) {
        console.log("saved already, but not returned yet");
        setTimeout(function(){saveSiteToTrail(successFunction, note)}, 100);
        return;
    }

    if (!siteSavedDeeply){
        wt_$.ajax({
            url: webTrailsUrl + "/sites/get_new_site_id",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "site[url]":currentSite,
                "site[trail_id]":currentTrailID,
                "site[title]": document.title,
                "site[domain]": document.domain,
                "note": note || {}
            },
            success: function(resp){
                setTrailID(resp.current_trail_id);
                setSiteID(resp.current_site_id);
                parsePageBeforeSavingSite(resp)
            }
        })
    }  else {
        wt_$.ajax({
            url: webTrailsUrl + "/notes",
            type: "post",
            crossDomain: true,
            beforeSend: signRequestWithWtAuthToken,
            data: {
                "note": wt_$.extend(note,{site_id:currentSiteID})
            },
            success: function(resp){
                parsePageBeforeSavingSite(wt_$.extend(resp,{
                    current_site_id:currentSiteID,
                    current_trail_id:currentTrailID,
                    shallow_save: true
                }))
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
                              saveSiteToTrailButton.unbind().click(function(){window.open(webTrailsUrl + '/trails/' + currentTrailID + "#"+String(data.id), '_blank');});
                              saveSiteToTrailButton.css({"cursor": "pointer"});
                            } else {
                                setTimeout(updateSiteSavedButton, 2000); // check again
                            }
                        }
                });
            } else {
                setTimeout(updateSiteSavedButton, 2000); // check again
            }
        }
        setTimeout(updateSiteSavedButton, 2000);
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
            "trail_id": currentTrailID,
            "current_url": currentSite
        },
        beforeSend: signRequestWithWtAuthToken,
        success: function(resp){
            setTrailID(resp.trail_id);
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


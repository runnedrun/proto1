TrailsObject = function(trailsObject, currentTrailId){
    var baseTrailObject = trailsObject
    var currentTrailId = currentTrailId;
    var trails = {}
    var thisTrailsObject = this;

    this.switchToTrail = function(newTrailId){
        currentTrailId = newTrailId;
        console.log("switching to trail:", newTrailId);
        TrailPreview.initWithTrail(this.getCurrentTrail());
    }

    this.getTrail = function(trailId) {
        return trails[trailId];
    }

    this.getCurrentSiteId = function() {
       return this.getCurrentTrail().getCurrentSiteId();
    }

    this.getCurrentTrail = function(){
        if (this.getCurrentTrailId()){
            return trails[this.getCurrentTrailId()];
        } else { return false }
    }
    this.getCurrentTrailId = function(){
        return currentTrailId || false;
    }
    this.getCurrentRevision = function(){
        this.getCurrentTrail().getCurrentRevision();
    }
    this.incrementRevision = function(){
        this.getCurrentTrail().incrementRevision();
    }

    // returns current revision and increments the revision
    this.getAndIncrementRevision = function(){
        return this.getCurrentTrail().getAndIncrementRevision();
    }

    this.updateTrails = function(localStorageTrailsObject){
        $.each(localStorageTrailsObject,function(trailId,trailObject){
            if (trails[trailId]){
                trails[trailId].updateSites(trailObject);
            } else {
                trails[trailId] = new Trail(trailObject);
            }

        })
    };

    // these methods manipulate the note count for the current site, for the current trail
    this.incrementNoteCount = function() {
        return this.getCurrentTrail().currentSiteNoteCount ++
    }

    $.each(baseTrailObject,function(trailId,trailObject){
        trails[trailId] = new Trail(trailObject)
    });
}

Trail = function(trailObject){
    var baseTrailObject = trailObject;
    var sites = {};
    var siteOrder = trailObject.sites.order;
    var currentSiteRevision = 0;
    var currentSiteId = false
    var notes = {};

    this.id = trailObject.id;
    this.currentSiteSavedDeeply = false;
    this.currentSiteNoteCount = 0;

    this.getSites = function(){
        var sitesInOrder = [];
        $.each(siteOrder,function(i,siteId){
            sitesInOrder.push(sites[siteId]);
        })
        return sitesInOrder;
    };

    this.getSite = function(siteId) {
        return sites[siteId];
    };

    this.getNote = function(noteId) {
        return notes[noteId];
    };

    this.getCurrentSiteId = function() {
       return currentSiteId
    };

    this.setCurrentSiteId = function(id) {
        console.log("setting site id");
        currentSiteId = id
    };

    this.getFirstSite = function(){
        var firstSite = this.getSites()[0];
        if (firstSite){
            return firstSite
        } else {
            return false
        }
    };

    this.getLastSite = function() {
        var sitesInOrder = this.getSites();
        if (sitesInOrder.length){
            return sitesInOrder[sitesInOrder.length-1]
        } else {
            return false;
        }
    }

    this.getLastNote = function() {
        var lastSite = this.getLastSite();
        var lastNote = false;
        while (lastSite && !(lastNote = lastSite.getLastNote())){
            lastSite = lastSite.previousSite()
        }
        return lastNote
    }

    this.deleteSite = function(site) {
        if (sites[site.id] && delete sites[site.id]){
            siteOrder.splice(siteOrder.indexOf(String(site.id)),1);
        }
    };

    this.updateSites = function(newTrailObject){
        $.each(newTrailObject.sites.order, function(i,siteId){
            var siteToUpdate;
            var newSiteBaseObject = newTrailObject.sites.siteObjects[siteId];
            if (!(siteToUpdate  = sites[siteId])){
                console.log("creating new site");
                sites[siteId] = new Site(newSiteBaseObject, thisTrailObject)
            } else {
                console.log("updating existing site");
                siteToUpdate.updateSite(newSiteBaseObject);
            }
        });
        siteOrder = newTrailObject.sites.order;
    }

    this.isCurrentTrail = function(){
        return Trails.getCurrentTrail() == this && TrailPreview;
    };

    this.updateSiteOrder = function(newSiteOrder) {
        siteOrder = newSiteOrder;
    };

    this.registerNote = function(note) {
        notes[note.id] = note;
    };

    var thisTrailObject = this;
    $.each(trailObject.sites.siteObjects,function(siteId,siteObject){
        sites[siteId] = new Site(siteObject, thisTrailObject);
    })
}

Site = function(siteObject, parentTrail){
    var siteObject = siteObject;
    var notes = {};
    var noteOrder = [];
    var baseRevisionNumber = siteObject.baseRevisionNumber;
    this.revisions = siteObject.html;
    this.id = siteObject.id;
    this.trail = parentTrail;
    this.url = siteObject.url;

    var thisSiteObject = this;

    this.addNote = function(baseNoteObject){
        var newNote = notes[baseNoteObject.id] = new Note(baseNoteObject, thisSiteObject);
        noteOrder.push(baseNoteObject.id);
        return newNote
    };

    this.addRevision = function(revisionNumber, html) {
        this.revisions[revisionNumber] = html;
    };

    this.removeNote = function(note) {
        delete notes[note.id];
        noteOrder.splice(noteOrder.indexOf(note.id),1);
    };

    this.updateNoteOrder = function(newNoteOrder) {
        console.log("updating Note order");
        noteOrder = newNoteOrder;
    }

    this.isCurrentSite = function() {
        return this.id == Trail.getCurrentSiteId();
    }

    this.nextSite = function(){
        var sitesInOrder = this.trail.getSites();
        var currentIndex = sitesInOrder.indexOf(this);
        if (currentIndex < (sitesInOrder.length - 1)){
            return this.trail.getSite(sitesInOrder[currentIndex+1].id);
        } else {
            return false;
        }
    };

    this.previousSite = function(){
        var sitesInOrder = this.trail.getSites();
        var currentIndex = sitesInOrder.indexOf(this);
        if (currentIndex > 0){
            return this.trail.getSite(sitesInOrder[currentIndex-1].id);
        } else {
            return false;
        }
    };

    this.getFirstNote = function(){
        var firstNote = this.getNotes()[0];
        if (firstNote){
            return firstNote;
        } else {
            return false;
        }
    };

    this.getNotes = function(){
        var notesInOrder = [];
        $.each(noteOrder,function(i,noteId){
            notesInOrder.push(notes[noteId]);
        })
        return notesInOrder;
    };

    this.getNote = function(noteId){
        return notes[noteId];
    };

    this.getLastNote = function(){
        var notesInOrder = this.getNotes();
        if (notesInOrder.length){
            return notesInOrder[notesInOrder.length - 1];
        } else {
            return false;
        }
    };

    this.nextNoteFromBase = function() {
        if(this.getFirstNote()) return this.getFirstNote();
        var nextSite = this.nextSite()
        while (nextSite) {
            if (nextSite.getFirstNote()) return nextSite.getFirstNote();
            nextSite = nextSite.nextSite();
        }
        return false
    }

    this.previousNoteFromBase = function() {
        var previousSite = this.previousSite()
        while (previousSite) {
            if (previousSite.getLastNote()) return previousSite.getLastNote();
            previousSite = previousSite.previousSite();
        }
        return false
    }

    this.updateSite = function(newSiteBaseObject){
        this.revisions = newSiteBaseObject.html;
        siteObject = newSiteBaseObject;
        $.each(newSiteBaseObject.notes.order, function(i, noteId){
            var existingNoteObject = notes[noteId];
            var newBaseNoteObject = newSiteBaseObject.notes.noteObjects[noteId];
            if (!(existingNoteObject)){
                thisSiteObject.addNote(newBaseNoteObject);
                console.log("adding new note");
            } else {
                notes[noteId].update(newBaseNoteObject);
            }
        });
        noteOrder = newSiteBaseObject.notes.order;
    };

    this.getNoteCount = function() {
        return noteOrder.length;
    };

    this.getNotePosition = function(note) {
        return noteOrder.indexOf(note.id) + 1;
    };

    this.getRevisionHtml = function(revisionNumber){
        return this.revisions[revisionNumber]
    };

    this.getFirstRevisionHtml = function(){
        if (this.getFirstNote()) {
            return this.getFirstNote().getSiteRevisionHtml();
        } else {
            return false
        }
    };

    this.getBaseRevisionHtml = function() {
        return this.getRevisionHtml(baseRevisionNumber);
    };

    this.delete = function() {
        thisSiteObject.trail.deleteSite(this);
    }

    this.getNextRevisionNumber = function() {
        var revisionNumbers = $.map(Object.keys(thisSiteObject.revisions), function (revisionNumber, i) {
          var revInt = parseInt(revisionNumber);
          return isNaN(revInt) ? -1 : revInt;
        });
        return Math.max.apply(null, revisionNumbers) + 1;
    };

    $.each(siteObject.notes.order, function(i,noteId) {
        thisSiteObject.addNote(siteObject.notes.noteObjects[noteId]);
    });
}

Note = function(baseNoteObject, parentSite){
    var siteRevisionNumber = baseNoteObject.siteRevisionNumber;
    var thisNoteObject = this;
    this.site = parentSite;

    this.getSiteRevisionHtml = function() {
        return thisNoteObject.site.getRevisionHtml(siteRevisionNumber)
    }

    this.nextNote = function(){
        var notesInOrder = thisNoteObject.site.getNotes();
        var currentIndex = notesInOrder.indexOf(this);
        if (currentIndex < (notesInOrder.length - 1)){
            return thisNoteObject.site.getNote(notesInOrder[currentIndex+1].id);
        } else {
            var newSite = thisNoteObject.site.nextSite();

            if (!newSite){
                return false
            }

            while (newSite.nextSite() && !newSite.getFirstNote()){
                newSite = newSite.nextSite();
            }

            if (newSite.getFirstNote()){
                return newSite.getFirstNote();
            } else {
                return false;
            }
        }
    };

    this.previousNote = function(){
        var notesInOrder = thisNoteObject.site.getNotes();
        var currentIndex = notesInOrder.indexOf(thisNoteObject);
        if (currentIndex > 0){
            return thisNoteObject.site.getNote(notesInOrder[currentIndex-1].id);
        } else {
            var newSite = thisNoteObject.site.previousSite();

            if (!newSite){
                return false;
            }

            while (newSite.previousSite() && !newSite.getLastNote()){
                newSite = newSite.previousSite();
            }

            return newSite.getLastNote();
        }
    };

    this.getPositionInSite = function() {
        return this.site.getNotePosition(thisNoteObject)
    };

    this.update = function(baseNoteObject){
        this.id = baseNoteObject.id;
        this.comment = baseNoteObject.comment;
        this.clientSideId = baseNoteObject.clientSideId
        this.scrollX = baseNoteObject.scrollX;
        this.scrollY = baseNoteObject.scrollY;
    };

    this.updateComment = function(newComment) {
        this.comment = newComment;
    }

    this.delete = function() {
        this.site.removeNote(this);
    };

    this.update(baseNoteObject);

    parentSite.trail.registerNote(thisNoteObject);
}
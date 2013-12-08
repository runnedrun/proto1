Request = new function(){
    this.deleteSite = function(site, callback){
        $.ajax({
            url: "/sites/delete",
            type: "post",
            data: {
                "id" : site.id
            },
            success: callback
        });
    };

    this.updateSiteOrder = function(trail, siteOrder) {
        $.ajax({
            url:"/trails/update_site_list",
            method:"post",
            data:{
                "site_array": siteOrder,
                "id" : trail.id
            },
            success:function(){
                console.log("updated positions server side");
            }
        });
    };

    this.updateNoteComment = function(note, newComment, callback) {
        $.ajax({
            url: "/notes/update",
            type: "post",
            data: {
                "id" : note.id,
                "comment": newComment
            },
            success: function(e) { console.log("note saved"); callback(e) }
        });
    };

    this.deleteNote = function(note, callback) {
        $.ajax({
            url: "/notes/delete",
            type: "post",
            data: {
                "id" : note.id
            },
            success: function(e){ console.log("note deleted"), callback(e)}
        })
    };

    this.addNote = function(newNote, currentNote, currentHtml, callback) {
        $.ajax({
            url: "/sites/new_note_from_view_page",
            type: "post",
            data: {
                "site[id]": currentNote.site.id, //this is probably unnecesary
                "site[trail_id]": currentNote.site.trail.id,
                "note": newNote,
                "html": currentHtml
            },
            success: callback
        });
    };

    this.updateNoteOrder = function(newNoteOrder, siteId){
        $.ajax({
            url:"/sites/update_note_list",
            method:"post",
            data:{
                "note_array": newNoteOrder,
                "id" : siteId
            },
            success:function(){
                console.log("updated positions server side");
            }
        })
    };
}();
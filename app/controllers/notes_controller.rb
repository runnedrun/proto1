class NotesController < ApplicationController
  skip_before_filter :verify_authenticity_token, :only => [:create,:options]
  after_filter :cors_set_access_control_headers

  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Max-Age'] = "1728000"
  end

  def cors_preflight_check
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version'
    headers['Access-Control-Max-Age'] = '1728000'
  end

  def options
    cors_preflight_check
    render :text => '', :content_type => 'text/plain'
  end

  def create
    @note = Note.create!(params[:note])
    render :json => {"content" => @note.content, "id" => @note.id}, :status => 200
  end

  def delete
    site = Site.find(params[:siteID].to_i)
    site_notes = site.notes
    note_number = params[:noteNumber].to_i
    note = site_notes[note_number]
    if note
      note.delete
      previous_note = site.reload.notes.find(:first, :order => "created_at DESC")
      previous_note_id = previous_note ? previous_note.id : "none"
      previous_note_content = previous_note ? previous_note.content : "none"
      render :json => {"id" => previous_note_id, "content" => previous_note_content}
    else
      render :json => "note probably doesn't exist yet"
    end
  end

end
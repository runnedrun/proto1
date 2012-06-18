require "spec_helper"

describe NotesController do
  describe "the create action" do
    before do
      @site = Site.create(:url => "www.google.com")
      @note_count = Note.count
    end

    it "should create a new note" do
      post :create, :note => {:content => Faker::Lorem.paragraph, :site_id => @site.id}
      Note.count.should == @note_count + 1
      @site.notes.length.should == 1
      Note.last.site.should == @site
    end

    it "should respond with the note content of the note created" do
      note_content = Faker::Lorem.paragraph
      post :create, :note => {:content => note_content, :site_id => @site.id}
      response.body.should == note_content

    end

  end
end
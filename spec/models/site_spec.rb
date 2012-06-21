require 'spec_helper'

describe Site do
  before do
    @notes = (1..4).inject([]) {|result,new| result << Note.create(:content => Faker::Lorem.paragraph) }
    @site = Site.create(:url => "http://www.google.com", :title => "google, you know what it is")
  end
  it "should have a url attribute" do
    @site.url.should == "http://www.google.com"
  end
  it "should be able to have multiple notes" do
    @site.notes = @notes
    @site.save
    @site.reload
    @site.notes.should == @notes
  end

  it "should be able to have a title" do
    @site.title.should == "google, you know what it is"
  end
end

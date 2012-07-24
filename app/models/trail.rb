class Trail < ActiveRecord::Base
  has_many :sites, :dependent => :delete_all
  has_and_belongs_to_many :users

  def owner=(user)
    if (user.class != User)
      self.owner_id = user
      self.users << User.find(user)
      self.save
    else
      self.owner_id = user.id
      self.users << user
      self.save
    end
  end

  def owner
    if self.owner_id
      User.find(self.owner_id)
    end
  end

  def build_site_with_notes(attrs)
    note_attrs = attrs.delete(:notes) or attrs.delete("notes")
    site_attrs = attrs
    if note_attrs.class != String


      note_array = note_attrs.values.inject([]) do |note_array, note|
        note_array << Note.create!(note)
       end

      site_attrs.merge!({:notes => note_array})

    end
    site_attrs.merge!({:trail_id => self.id})
    site = Site.create!(site_attrs)
  end

end
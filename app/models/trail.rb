class Trail < ActiveRecord::Base
  has_many :sites
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
    note_attrs = attrs.delete(:notes)
    site_attrs = attrs

    note_array = note_attrs.inject([]) do |note_array, note|
      note_array << Note.create!(note)
    end

    site_attrs.merge({:notes => note_array, :trail_id => self.id})

    site = Site.create!(site_attrs)
  end

end
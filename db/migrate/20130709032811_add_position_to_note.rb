class AddPositionToNote < ActiveRecord::Migration
  def change
    add_column :notes, :position, :integer
  end
end

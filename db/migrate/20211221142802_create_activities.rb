class CreateActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :activities do |t|
      t.belongs_to :user, foreign_key: true
      t.belongs_to :work_order, foreign_key: true
      t.string :action
      t.timestamps
    end
  end
end

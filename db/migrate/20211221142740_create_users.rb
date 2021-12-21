class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.belongs_to :company, foreign_key: true
      t.string :name, null: false
      t.boolean :active, null: false
      t.timestamps
    end
  end
end

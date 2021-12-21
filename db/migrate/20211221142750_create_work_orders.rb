class CreateWorkOrders < ActiveRecord::Migration[7.0]
  def change
    create_table :work_orders do |t|
      t.belongs_to :user, foreign_key: true
      t.string :title, null: false
      t.string :description, null: false
      t.string :status, null: false
      t.timestamps
    end
  end
end

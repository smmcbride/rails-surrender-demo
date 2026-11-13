# frozen_string_literal: true

class Activity < ApplicationRecord
  belongs_to :creator, class_name: 'User', foreign_key: :user_id
  belongs_to :work_order

  validates :action, presence: true

  surrenders :id, :action, :creator, available: %i[user_id created_at updated_at]
end

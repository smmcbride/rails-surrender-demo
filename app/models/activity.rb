# frozen_string_literal: true

class Activity < ApplicationRecord
  belongs_to :creator, class_name: 'User', foreign_key: :user_id
  belongs_to :work_order

  validates :action, presence: true

  surrenders attributes: %i[id action],
             available_attributes: %i[user_id created_at updated_at],
             expands: [:creator]
end

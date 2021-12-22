# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users

  validates :name, presence: true

  surrenders attributes: %i[id name],
             available_attributes: %i[created_at updated_at],
             available_expands: [:users]
end

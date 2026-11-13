# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users

  validates :name, presence: true

  surrenders :id, :name, available: %i[created_at updated_at users]
end

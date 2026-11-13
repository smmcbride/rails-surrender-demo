# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :company
  has_many :work_orders
  has_many :activities

  validates :company, presence: true
  validates :name, presence: true
  validates :active, inclusion: { in: [true, false] }

  surrenders :id, :name, :active, available: %i[created_at updated_at work_orders]
end

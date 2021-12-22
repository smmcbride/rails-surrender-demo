# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :company
  has_many :work_orders
  has_many :activities

  validates :company, presence: true
  validates :name, presence: true
  validates :active, inclusion: { in: [true, false] }

  surrenders attributes: %i[id name active],
             available_attributes: %i[created_at updated_at],
             available_expands: [:work_orders]
end

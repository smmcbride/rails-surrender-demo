# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :company
  has_many :work_orders

  validates :company, presence: true
  validates :name, presence: true
  validates :active, inclusion: { in: [true, false] }
end

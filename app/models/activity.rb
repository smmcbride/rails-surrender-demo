# frozen_string_literal: true

class Activity < ApplicationRecord
  belongs_to :user
  belongs_to :work_order

  validates :action, presence: true
end

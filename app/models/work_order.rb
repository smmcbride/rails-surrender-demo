# frozen_string_literal: true

class WorkOrder < ApplicationRecord
  VALID_STATUSES = %w[open pending closed].freeze
  belongs_to :user
  has_many :activities

  validates :user, presence: true
  validates :title, presence: true
  validates :description, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  surrenders attributes: %i[id title description status],
             available_attributes: %i[created_at updated_at],
             expands: [:activities],
             available_expands: [:user]
end

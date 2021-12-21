class WorkOrder < ApplicationRecord
  VALID_STATUSES = %w[open pending closed]
  belongs_to :user
  has_many :activities

  validates :user, presence: true
  validates :title, presence: true
  validates :description, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
end

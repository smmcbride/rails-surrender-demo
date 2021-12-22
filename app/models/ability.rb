# frozen_string_literal: true

class Ability
  include CanCan::Ability

  attr_reader :user_ids_query

  def initialize(user)
    return unless user.present?

    can :read, Company, id: user.company_id

    # selects user_ids of everyone in the user's company
    @user_ids_query = User.select(:id).joins(:company).where(company: { id: user.company_id })

    # every user in the company
    user_abilities

    # every work_order by a user in the company
    work_order_abilities

    # every activity by a user in the company
    activity_abilities
  end

  private

  def user_abilities
    can :read, User, ["id IN (#{user_ids_query.to_sql})"] do |user_model|
      user_model.id.in? user_ids
    end
  end

  def work_order_abilities
    can :read, WorkOrder, ["user_id IN (#{user_ids_query.to_sql})"] do |work_order|
      work_order.user_id.in? user_ids
    end
  end

  def activity_abilities
    can :read, Activity, ["user_id IN (#{user_ids_query.to_sql})"] do |activity|
      activity.user_id.in? user_ids
    end
  end

  def user_ids
    @user_ids ||= user_ids_query.pluck(:id)
  end
end

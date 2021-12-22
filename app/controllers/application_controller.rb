# frozen_string_literal: true

class ApplicationController < ActionController::API
  before_action :require_current_user

  NotAuthenticated = Class.new(StandardError)

  rescue_from NotAuthenticated do
    render status: 401, json: { error: 'User is not authenticated' }
  end

  rescue_from CanCan::AccessDenied do
    render status: 403, json: { error: 'User is not authorized' }
  end

  rescue_from Rails::Surrender::Error do |error|
    render status: 400, json: { error: error.message }
  end

  rescue_from ActiveRecord::RecordNotFound do |error|
    render status: 404, json: { error: error.message }
  end

  private

  def current_user
    @current_user ||= User.find_by_id(request.headers['Authorization'])
  end

  def require_current_user
    raise NotAuthenticated unless current_user
  end
end

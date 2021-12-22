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

  private

  def current_user
    @current_user ||= User.find_by_id(request.headers['Authorization'])
  end

  def require_current_user
    raise NotAuthenticated unless current_user
  end
end

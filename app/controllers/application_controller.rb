class ApplicationController < ActionController::API
  private

  def current_user
    @current_user ||= User.find(request.headers['Authorization'])
  end
end

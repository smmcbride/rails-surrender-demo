# frozen_string_literal: true

class UsersController < ApplicationController
  load_and_authorize_resource

  def index
    # @users loaded and authorized by cancancan
    surrender @users
  end

  def show
    # @user loaded and authorized by cancancan
    surrender @user
  end
end

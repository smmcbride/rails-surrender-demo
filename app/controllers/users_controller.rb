# frozen_string_literal: true

class UsersController < ApplicationController
  load_and_authorize_resource

  def index
    # @users loaded and authorized by cancancan=
  end

  def show
    # @user loaded and authorized by cancancan=
  end
end

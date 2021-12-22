# frozen_string_literal: true

class WorkOrdersController < ApplicationController
  load_and_authorize_resource

  def index
    # @work_orders loaded and authorized by cancancan
    surrender @work_orders
  end

  def show
    # @work_order loaded and authorized by cancancan
    surrender @work_order
  end
end

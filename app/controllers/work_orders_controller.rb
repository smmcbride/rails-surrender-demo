# frozen_string_literal: true

class WorkOrdersController < ApplicationController
  load_and_authorize_resource

  def index
    # @work_orders loaded and authorized by cancancan

    # include activities to prevent N+1 queries.
    @work_orders = @work_orders.includes(:activities)
  end

  def show
    # @work_order loaded and authorized by cancancan=
  end
end

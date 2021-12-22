class WorkOrdersController < ApplicationController
  load_and_authorize_resource

  def index
    # @work_orders loaded and authorized by cancancan
  end

  def show
    # @work_order loaded and authorized by cancancan=
  end
end

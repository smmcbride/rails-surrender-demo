class WorkOrdersController < ApplicationController
  def index
    @work_orders = WorkOrder.all
  end

  def show
    @work_order = WorkOrder.find(params[:id])
  end
end

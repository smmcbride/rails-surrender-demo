# frozen_string_literal: true

require 'test_helper'

module Explorer
  class FieldTest < ActiveSupport::TestCase
    test 'marks the fields a model renders by default' do
      fields = Field.tree_for(WorkOrder).index_by(&:name)

      assert_predicate fields['title'], :default?
      assert_predicate fields['activities'], :default?
      assert_not fields['created_at'].default?
      assert_not fields['user'].default?
    end

    test 'nests the fields of associations' do
      activities = Field.tree_for(WorkOrder).find { |field| field.name == 'activities' }

      assert_predicate activities, :association?
      assert_equal %w[id action user_id created_at updated_at creator], activities.children.map(&:name)
    end

    test 'leaves out associations back to a model above, which surrender would not render' do
      work_orders = Field.tree_for(User).find { |field| field.name == 'work_orders' }
      activities = work_orders.children.find { |field| field.name == 'activities' }

      assert_not_includes activities.children.map(&:name), 'creator'
    end
  end
end

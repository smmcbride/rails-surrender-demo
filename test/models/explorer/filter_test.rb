# frozen_string_literal: true

require 'test_helper'

module Explorer
  class FilterTest < ActiveSupport::TestCase
    test 'offers an equality filter per column and the time filters for timestamps' do
      names = Filter.all_for(User).map(&:name)

      assert_equal %w[id company_id name active created_at created_before created_after
                      updated_at updated_before updated_after], names
    end

    test 'starts time filters at the beginning of the year, as an ISO 8601 time in UTC' do
      created_after = filter(WorkOrder, 'created_after')

      assert_equal 'datetime', created_after.input
      assert_equal "#{Time.current.utc.year}-01-01T00:00:00Z", created_after.default
    end

    test 'offers the values a column is validated to include' do
      status = filter(WorkOrder, 'status')

      assert_equal 'choice', status.input
      assert_equal WorkOrder::VALID_STATUSES, status.choices
      assert_equal 'open', status.default
    end

    test 'quotes times and free text, which surrender reads as YAML' do
      assert_predicate filter(WorkOrder, 'created_after'), :quoted?
      assert_predicate filter(User, 'name'), :quoted?
      assert_not filter(User, 'active').quoted?
      assert_not filter(User, 'company_id').quoted?
    end

    private

    def filter(model, name)
      Filter.all_for(model).find { |candidate| candidate.name == name }
    end
  end
end

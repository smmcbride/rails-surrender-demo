# frozen_string_literal: true

require 'test_helper'

module Explorer
  class EndpointTest < ActiveSupport::TestCase
    test 'collections offer filters, sorts and pagination' do
      json = Endpoint.collection('/work_orders', WorkOrder).as_json

      assert_includes json[:sorts], 'title'
      assert_includes json[:sorts], 'user.name'
      assert_equal({ page: 1, per: 50, max_per: 100 }, json[:pagination])
      assert_not_empty json[:filters]
    end

    test 'sorts on belongs_to associations only, since a has_many join repeats records' do
      sorts = Endpoint.collection('/users', User).as_json[:sorts]

      assert_includes sorts, 'company.name'
      assert_empty sorts.grep(/\Awork_orders\./)
    end

    test 'single records offer only fields' do
      json = Endpoint.member('/users/{id}', User).as_json

      assert json[:member]
      assert_empty json[:filters]
      assert_empty json[:sorts]
      assert_nil json[:pagination]
    end
  end
end

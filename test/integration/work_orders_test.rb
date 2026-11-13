# frozen_string_literal: true

require 'test_helper'

class WorkOrdersTest < ActionDispatch::IntegrationTest
  test 'renders default expands, hiding activities by users outside the company' do
    get_as users(:ann), "/work_orders/#{work_orders(:leaky_roof).id}"

    assert_equal ['Inspected the roof'], json['activities'].pluck('action')
    assert_equal 'Ann Archer', json['activities'].first.dig('creator', 'name')
  end

  test 'filters by date' do
    get_as users(:ann), '/work_orders', params: { filter: "created_after:'2026-02-01'" }

    assert_equal ['Broken door'], json.pluck('title')
  end

  test 'paginates' do
    get_as users(:ann), '/work_orders', params: { per: 1, page: 2, sort: 'title' }

    assert_equal ['Leaky roof'], json.pluck('title')
    assert_equal({ 'total' => 2, 'page' => 2, 'per_page' => 1 },
                 JSON.parse(response.headers['X-Pagination']).slice('total', 'page', 'per_page'))
  end

  test 'rejects unknown sorts' do
    get_as users(:ann), '/work_orders', params: { sort: 'priority' }

    assert_response :bad_request
    assert_equal 'priority is not a valid sort parameter.', json['error']
  end
end

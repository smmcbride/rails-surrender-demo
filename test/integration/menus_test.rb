# frozen_string_literal: true

require 'test_helper'

# The explorer builds its controls from the app menu, so it must say what each endpoint accepts.
class MenusTest < ActionDispatch::IntegrationTest
  def endpoint(path)
    json['endpoints'].find { |endpoint| endpoint['path'] == path }
  end

  test 'lists every API endpoint, in the order the routes draw them' do
    get '/surrender_menu'

    assert_equal ['/company', '/users', '/users/{id}', '/work_orders', '/work_orders/{id}'],
                 json['endpoints'].pluck('path')
  end

  test 'a collection lists its fields, filters, sorts and the demo page size' do
    get '/surrender_menu'

    work_orders = endpoint('/work_orders')
    assert_includes work_orders['fields'].pluck('name'), 'title'
    assert_equal({ 'type' => 'string' }, work_orders.dig('selection', 'filters', 'status'))
    assert_equal({ 'type' => 'datetime' }, work_orders.dig('selection', 'filters', 'created_after'))
    assert_includes work_orders.dig('selection', 'sorts'), 'title'
    assert_equal({ 'default' => 30, 'max' => 60 }, work_orders.dig('selection', 'page'))
  end

  test 'a single record lists its fields and no selection' do
    get '/surrender_menu'

    work_order = endpoint('/work_orders/{id}')
    assert_nil work_order['selection']
    activities = work_order['fields'].find { |field| field['name'] == 'activities' }
    assert_equal 'array', activities['type']
    assert activities.key?('fields')
  end

  # Surrender serves the menu from its own controller, so the demo's authentication doesn't apply. The menu shows the
  # API's shape, not its records, which stay behind authentication.
  test 'is served without a user' do
    get '/surrender_menu'

    assert_response :success
  end
end

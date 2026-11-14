# frozen_string_literal: true

require 'test_helper'

# The explorer builds its controls from these menus, so they must say what each endpoint accepts.
class MenusTest < ActionDispatch::IntegrationTest
  test 'a collection lists its fields, filters, sorts and the demo page size' do
    get_as users(:ann), '/work_orders', params: { menu: '' }

    assert_response :success
    assert_includes json['fields'].pluck('name'), 'title'
    assert_equal({ 'type' => 'string' }, json.dig('selection', 'filters', 'status'))
    assert_equal({ 'type' => 'datetime' }, json.dig('selection', 'filters', 'created_after'))
    assert_includes json.dig('selection', 'sorts'), 'title'
    assert_equal({ 'default' => 30, 'max' => 60 }, json.dig('selection', 'page'))
  end

  test 'a single record lists its fields and no selection' do
    get_as users(:ann), "/work_orders/#{work_orders(:leaky_roof).id}", params: { menu: '' }

    assert_response :success
    assert_nil json['selection']
    activities = json['fields'].find { |field| field['name'] == 'activities' }
    assert_equal 'expand', activities['kind']
  end

  test 'a menu is only as visible as its endpoint' do
    get '/work_orders', params: { menu: '' }

    assert_response :unauthorized
  end
end

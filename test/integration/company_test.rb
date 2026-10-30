# frozen_string_literal: true

require 'test_helper'

class CompanyTest < ActionDispatch::IntegrationTest
  test 'renders the current user company' do
    get_as users(:ann), '/company'

    assert_response :success
    assert_equal({ 'id' => companies(:alpha).id, 'name' => 'Alpha Solutions' }, json)
  end

  test 'includes nested users and their work orders, minus excluded activities' do
    get_as users(:ann), '/company',
           params: { include: 'users:[work_orders]', exclude: 'users:[work_orders:[activities]]' }

    ann = json['users'].find { |user| user['name'] == 'Ann Archer' }
    assert_equal ['Leaky roof'], ann['work_orders'].pluck('title')
    assert_not ann['work_orders'].first.key?('activities')
  end
end

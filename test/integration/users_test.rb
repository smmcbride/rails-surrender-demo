# frozen_string_literal: true

require 'test_helper'

class UsersTest < ActionDispatch::IntegrationTest
  test 'lists only users in the current user company' do
    get_as users(:ann), '/users'

    assert_equal ['Ann Archer', 'Bob Baker'], json.pluck('name').sort
  end

  test 'filters and sorts' do
    get_as users(:ann), '/users', params: { filter: 'active:true', sort: '-name' }

    assert_equal ['Ann Archer'], json.pluck('name')
    assert_equal '-name', response.headers['X-Sort']
  end

  test 'includes available attributes' do
    get_as users(:ann), "/users/#{users(:bob).id}", params: { include: 'created_at' }

    assert_equal %w[active created_at id name], json.keys.sort
  end

  test 'counts and lists ids' do
    get_as users(:ann), '/users', params: { count: '' }
    assert_equal({ 'count' => 2 }, json)

    get_as users(:ann), '/users', params: { ids: '' }
    assert_equal [users(:ann).id, users(:bob).id].sort, json['ids'].sort
  end

  test 'rejects includes the model does not make available' do
    get_as users(:ann), '/users', params: { include: 'company' }

    assert_response :bad_request
    assert_equal '[:company] is not a valid include parameter.', json['error']
  end
end

# frozen_string_literal: true

require 'test_helper'

class AccessTest < ActionDispatch::IntegrationTest
  test 'rejects requests without a user' do
    get '/users'

    assert_response :unauthorized
    assert_equal 'User is not authenticated', json['error']
  end

  test 'rejects users outside the requested resource company' do
    get_as users(:ann), "/users/#{users(:olga).id}"

    assert_response :forbidden
  end
end

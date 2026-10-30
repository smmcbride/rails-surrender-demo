# frozen_string_literal: true

ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all
  end
end

module ActionDispatch
  class IntegrationTest
    # The demo authenticates by passing the user's id in the Authorization header.
    def get_as(user, path, params: {})
      get path, params: params, headers: { 'Authorization' => user.id.to_s }
    end

    def json
      response.parsed_body
    end
  end
end

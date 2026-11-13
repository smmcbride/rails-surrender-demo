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

    # The API's routes as the explorer names them: /users/:id(.:format) becomes /users/{id}. The health check and
    # the explorer page are left out, because they are not part of the API.
    def api_routes
      Rails.application.routes.routes
           .map { |route| route.path.spec.to_s.delete_suffix('(.:format)') }
           .reject { |path| path.in?(['/', '/up']) || path.start_with?('/rails') }
           .map { |path| path.gsub(/:(\w+)/, '{\1}') }
           .uniq
    end
  end
end

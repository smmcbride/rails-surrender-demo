# frozen_string_literal: true

require 'test_helper'

class DocsTest < ActionDispatch::IntegrationTest
  SPEC_PATH = Rails.root.join('public/docs/openapi.yaml')

  test 'serves the Swagger UI and the spec it loads' do
    get '/docs/'
    assert_response :success
    assert_includes response.body, '/docs/openapi.yaml'

    get '/docs/openapi.yaml'
    assert_response :success
  end

  test 'documents every API route' do
    spec = YAML.safe_load_file(SPEC_PATH)

    assert_equal api_routes.sort, spec['paths'].keys.sort
  end

  private

  # The API routes in OpenAPI form: /users/:id(.:format) becomes /users/{id}.
  def api_routes
    Rails.application.routes.routes
         .map { |route| route.path.spec.to_s.delete_suffix('(.:format)') }
         .reject { |path| path == '/up' || path.start_with?('/rails') }
         .map { |path| path.gsub(/:(\w+)/, '{\1}') }
         .uniq
  end
end

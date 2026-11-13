# frozen_string_literal: true

require 'test_helper'

class ExplorerTest < ActionDispatch::IntegrationTest
  test 'serves the explorer page without a user, with its catalog and assets' do
    get '/'

    assert_response :success
    catalog = JSON.parse(css_select('#explorer').first['data-catalog'])
    assert_includes catalog['users'], { 'id' => users(:ann).id, 'name' => 'Ann Archer', 'company' => 'Alpha Solutions' }

    get '/explorer/explorer.js'
    assert_response :success
  end

  test 'offers every API route' do
    assert_equal api_routes.sort, Explorer::Catalog.new.endpoints.map(&:path).sort
  end
end

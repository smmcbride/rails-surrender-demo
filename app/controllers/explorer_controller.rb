# frozen_string_literal: true

# Serves the explorer page, where a request is built with checkboxes and sent to the API. The page is HTML for a
# browser, so it skips the API's JSON-only base controller and its authentication: the page itself picks the user.
class ExplorerController < ActionController::Base
  def show
    @catalog = Explorer::Catalog.new
  end
end

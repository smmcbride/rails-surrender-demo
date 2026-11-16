# frozen_string_literal: true

# Serves the explorer page, where a request is built with checkboxes and sent to the API. The page is HTML for a
# browser, so it skips the API's JSON-only base controller and its authentication: the page itself picks the user.
class ExplorerController < ActionController::Base
  helper_method :explorer_asset

  def show
    @catalog = Explorer::Catalog.new
  end

  private

  # The page's files are served from public/ without a digest or Cache-Control, so a browser may keep running an old
  # copy after an edit. Each URL carries the file's modified time instead, so an edited file gets a new URL.
  def explorer_asset(name)
    "/explorer/#{name}?v=#{Rails.public_path.join('explorer', name).mtime.to_i}"
  end
end

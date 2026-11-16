# frozen_string_literal: true

module Explorer
  # What the explorer page needs from the server before it can ask the API anything: where surrender serves the app
  # menu, which lists every endpoint and what it accepts, and the users to act as.
  class Catalog
    def as_json(*)
      { menu_path: menu_path, users: users }
    end

    def menu_path
      Rails.application.config.surrender.menu_path
    end

    private

    def users
      User.includes(:company).order(:id).map do |user|
        { id: user.id, name: user.name, company: user.company.name }
      end
    end
  end
end

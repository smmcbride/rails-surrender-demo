# frozen_string_literal: true

module Explorer
  # Everything the explorer page offers: the API's GET routes, and the users to act as. Each route describes what it
  # accepts when the page asks for its menu, so the catalog only needs the paths.
  class Catalog
    def as_json(*)
      { endpoints: endpoints, users: users }
    end

    # As the explorer names them: /users/:id(.:format) becomes /users/{id}.
    def endpoints
      Rails.application.routes.routes
           .select { |route| route.verb == 'GET' }
           .map { |route| route.path.spec.to_s.delete_suffix('(.:format)') }
           .select { |path| api?(path) }
           .map { |path| path.gsub(/:(\w+)/, '{\1}') }
           .uniq
    end

    private

    # The health check, Rails' own routes and the explorer page itself are not part of the API.
    def api?(path)
      !path.in?(['/', '/up']) && !path.start_with?('/rails')
    end

    def users
      User.includes(:company).order(:id).map do |user|
        { id: user.id, name: user.name, company: user.company.name }
      end
    end
  end
end

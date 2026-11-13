# frozen_string_literal: true

module Explorer
  # Everything the explorer page offers: the endpoints to call and the users to act as.
  class Catalog
    def endpoints
      [
        Endpoint.singular('/company', Company),
        Endpoint.collection('/users', User),
        Endpoint.member('/users/{id}', User),
        Endpoint.collection('/work_orders', WorkOrder),
        Endpoint.member('/work_orders/{id}', WorkOrder)
      ]
    end

    def as_json(*)
      { endpoints: endpoints.map(&:as_json), users: users }
    end

    private

    def users
      User.includes(:company).order(:id).map do |user|
        { id: user.id, name: user.name, company: user.company.name }
      end
    end
  end
end

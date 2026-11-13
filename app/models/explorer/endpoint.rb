# frozen_string_literal: true

module Explorer
  # One API route and the query options it accepts. Only collections can be filtered, sorted, paginated or
  # counted; every endpoint can shape its response with include and exclude.
  class Endpoint
    attr_reader :path, :model

    def self.singular(path, model)
      new(path, model, :singular)
    end

    def self.collection(path, model)
      new(path, model, :collection)
    end

    def self.member(path, model)
      new(path, model, :member)
    end

    def initialize(path, model, kind)
      @path = path
      @model = model
      @kind = kind
    end

    def collection?
      @kind == :collection
    end

    def member?
      @kind == :member
    end

    def as_json(*)
      {
        path: path,
        member: member?,
        collection: collection?,
        fields: Field.tree_for(model).map(&:as_json),
        filters: collection? ? Filter.all_for(model).map(&:as_json) : [],
        sorts: collection? ? sorts : [],
        pagination: collection? ? pagination : nil
      }
    end

    private

    def sorts
      model.surrender_menu.sorts
    end

    # The page size limit is nil when the app removes it.
    def pagination
      page_size = model.surrender_menu.page_size
      { page: Rails::Surrender::Selection::PAGE_DEFAULT, per: page_size.default, max_per: page_size.max }
    end
  end
end

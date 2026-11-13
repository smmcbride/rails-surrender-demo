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

    # Surrender sorts on the model's columns, or on a column of an association as association.column. Only
    # belongs_to associations are offered, because joining a has_many would repeat each record per child.
    def sorts
      own = model.attribute_names
      associated = model.reflect_on_all_associations(:belongs_to).flat_map do |association|
        association.klass.attribute_names.map { |column| "#{association.name}.#{column}" }
      end
      own + associated
    end

    def pagination
      { page: Rails::Surrender::Selection::PAGE_DEFAULT, per: Rails::Surrender::Selection::PER_PAGE_DEFAULT }
    end
  end
end

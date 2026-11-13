# frozen_string_literal: true

module Explorer
  # An attribute or association a model can render, and whether it renders by default. Associations carry the
  # fields of the model they lead to, so nested resources can be shaped too.
  class Field
    attr_reader :name, :children

    # Surrender never renders a model inside itself, so an association back to a model already above it in the
    # tree is left out: offering it would only produce a checkbox that does nothing.
    def self.tree_for(model, above: [model.base_class])
      attributes_of(model) + associations_of(model, above)
    end

    def self.attributes_of(model)
      model.surrender_callable_attributes.map do |name|
        new(name, default: model.surrender_attributes.include?(name))
      end
    end

    def self.associations_of(model, above)
      model.surrender_callable_expands.filter_map do |name|
        target = model.reflect_on_association(name).klass.base_class
        next if target.in?(above)

        new(name, default: model.surrender_expands.include?(name), children: tree_for(target, above: above + [target]))
      end
    end

    private_class_method :attributes_of, :associations_of

    def initialize(name, default:, children: nil)
      @name = name.to_s
      @default = default
      @children = children
    end

    def default?
      @default
    end

    def association?
      !children.nil?
    end

    def as_json(*)
      json = { name: name, default: default? }
      json[:children] = children.map(&:as_json) if association?
      json
    end
  end
end

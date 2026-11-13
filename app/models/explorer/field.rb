# frozen_string_literal: true

module Explorer
  # An attribute or association a model can render, and whether it renders by default. Associations carry the
  # fields of the model they lead to, so nested resources can be shaped too. Surrender's menu leaves out
  # associations back to a model above, which it never renders, so no checkbox here does nothing.
  class Field
    attr_reader :name, :children

    def self.tree_for(model)
      from_menu(model.surrender_menu)
    end

    def self.from_menu(menu)
      menu.fields.map do |field|
        new(field.name, default: field.default?, children: field.menu && from_menu(field.menu))
      end
    end

    private_class_method :from_menu

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

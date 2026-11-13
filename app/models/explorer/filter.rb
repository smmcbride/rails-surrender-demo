# frozen_string_literal: true

module Explorer
  # A filter surrender generates for a column, with the input that suits its values and a value to start from.
  class Filter
    # Surrender's time filters, named after the column without its _at suffix: created_before, created_after.
    TIME_SUFFIXES = %w[before after].freeze

    attr_reader :name, :input, :choices, :default

    def self.all_for(model)
      model.columns.flat_map { |column| for_column(model, column) }
    end

    def self.for_column(model, column)
      input = input_for(model, column)
      equality = new(column.name, **input)
      return [equality] unless column.type.in?(%i[date datetime])

      stem = column.name.delete_suffix('_at')
      [equality] + TIME_SUFFIXES.map { |suffix| new("#{stem}_#{suffix}", **input) }
    end

    def self.input_for(model, column)
      return { input: 'choice', choices: [true, false] } if column.type == :boolean
      return { input: 'date', default: Date.current.beginning_of_year.iso8601 } if column.type == :date
      return datetime_input if column.type == :datetime
      return { input: 'number', default: 1 } if column.type == :integer

      choices = inclusion_choices(model, column)
      choices ? { input: 'choice', choices: choices } : { input: 'text', default: '' }
    end

    def self.inclusion_choices(model, column)
      model.validators_on(column.name)
           .grep(ActiveModel::Validations::InclusionValidator)
           .first&.options&.dig(:in)
    end

    # Surrender takes times in ISO 8601 only. This one is in UTC, said with a Z rather than left to the app's zone.
    def self.datetime_input
      { input: 'datetime', default: Time.current.utc.beginning_of_year.iso8601 }
    end

    private_class_method :for_column, :input_for, :inclusion_choices, :datetime_input

    def initialize(name, input:, choices: nil, default: choices&.first)
      @name = name
      @input = input
      @choices = choices
      @default = default
    end

    # Surrender reads filters as YAML, which needs dates and times quoted, and free text quoted so commas and colons
    # in it stay part of the value.
    def quoted?
      input.in?(%w[date datetime text])
    end

    def as_json(*)
      { name: name, input: input, choices: choices, default: default, quoted: quoted? }.compact
    end
  end
end

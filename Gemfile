source "https://rubygems.org"

gem "rails", "~> 8.1.4", ">= 8.1.4.1"
# Use sqlite3 as the database for Active Record
gem "sqlite3", ">= 2.1"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Authorization rules that surrender applies to nested resources
gem "cancancan", "~> 3.6"
# JSON rendering controlled by query parameters
# Tracks main until rails-surrender 0.2.0 is released
gem "rails-surrender", github: "smmcbride/rails-surrender", branch: "main"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Generates the seed data
  gem "faker"

  # Audits gems for known security defects (use config/bundler-audit.yml to ignore issues)
  gem "bundler-audit", require: false

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  gem "rubocop", require: false
end

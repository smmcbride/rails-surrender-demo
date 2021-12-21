# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)

company_names = ['Alpha Solutions', 'Omega Cargo']

def user_params(company)
  {
    company: company,
    name: Faker::Name.name,
    active: [true, false].sample
  }
end

def work_order_params(user)
  {
    user: user,
    title: Faker::Lorem.sentence,
    description: Faker::Lorem.paragraph,
    status: WorkOrder::VALID_STATUSES.sample
  }
end

def activity_params(work_order, user)
  {
    work_order: work_order,
    user: user,
    action: Faker::Company.bs
  }
end

company_names.each do |company_name|
  Company.find_or_create_by(name:company_name) do |company|
    10.times do
      User.create!(user_params(company)) do |user|
        50.times do
          WorkOrder.create!(work_order_params(user))
        end
      end
    end
  end
end

WorkOrder.find_each do |work_order|
  rand(5).times do
    user = work_order.user.company.users.order(Arel.sql('RANDOM()')).first
    Activity.create!(activity_params(work_order, user))
  end
end


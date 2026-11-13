# Two companies of five users each, with work orders and activities.
#
# Faker and the other random choices are seeded, so every install gets the same names, text and ids, and the README's
# example output matches. The mix is fixed so each README example has something to show: users alternate between
# active and inactive, each raises two to four work orders, and the work orders cycle through every status.

USERS_PER_COMPANY = 5

random = Random.new(42)
Faker::Config.random = Random.new(42)
statuses = WorkOrder::VALID_STATUSES.cycle

['Alpha Solutions', 'Omega Cargo'].each do |company_name|
  Company.find_or_create_by!(name: company_name) do |company|
    USERS_PER_COMPANY.times do |index|
      user = company.users.build(name: Faker::Name.name, active: index.even?)
      random.rand(2..4).times do
        user.work_orders.build(title: Faker::Lorem.sentence, description: Faker::Lorem.paragraph, status: statuses.next)
      end
    end
  end
end

# Activities are recorded by people in the same company as the work order.
WorkOrder.includes(user: { company: :users }).find_each do |work_order|
  colleagues = work_order.user.company.users.to_a
  random.rand(0..3).times do
    work_order.activities.create!(creator: colleagues.sample(random: random), action: Faker::Company.bs)
  end
end

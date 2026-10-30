Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  defaults format: :json do
    resource :company, only: :show
    resources :users, only: [:show, :index]
    resources :work_orders, only: [:show, :index]
  end
end

Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  defaults format: :json do
    resource :company, only: :show
    resources :users, only: [:show, :index]
    resources :work_orders, only: [:show, :index]
  end
end

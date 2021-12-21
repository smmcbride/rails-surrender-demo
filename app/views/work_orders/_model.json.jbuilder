json.(model, :id, :title, :description, :status,  :created_at)

json.activities model.activities, partial: 'activities/model', as: :model

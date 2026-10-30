# Surrender Demo

[![CI](https://github.com/smmcbride/rails-surrender-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/smmcbride/rails-surrender-demo/actions/workflows/ci.yml)

A small Rails API that shows [rails-surrender](https://github.com/smmcbride/rails-surrender) in use. API clients shape
each response with query parameters: they pick the attributes and nested associations they want, and filter, sort,
paginate or count the results. The controllers stay one line long.

```ruby
class WorkOrdersController < ApplicationController
  load_and_authorize_resource

  def index
    surrender @work_orders
  end
end
```

## The domain

A **company** has **users**. Users raise **work orders**, and each work order records **activities**.

| Model       | Rendered by default                    | Available on request                 |
|-------------|----------------------------------------|--------------------------------------|
| `Company`   | `id`, `name`                           | `created_at`, `updated_at`, `users`  |
| `User`      | `id`, `name`, `active`                 | `created_at`, `updated_at`, `work_orders` |
| `WorkOrder` | `id`, `title`, `description`, `status`, `activities` | `created_at`, `updated_at`, `user` |
| `Activity`  | `id`, `action`, `creator`              | `user_id`, `created_at`, `updated_at` |

Each model declares this with `surrenders` (see [`app/models`](app/models)).

Authorization uses [CanCanCan](https://github.com/CanCanCommunity/cancancan). A user can read only their own company,
its users, and the work orders and activities those users created. Surrender applies the same rules to nested
resources, so an activity recorded by someone outside the company is left out of a work order's `activities`.

## Requirements

- Ruby 4.0 (the exact version is in [`.ruby-version`](.ruby-version))
- SQLite 3

## Getting started

```sh
git clone https://github.com/smmcbride/rails-surrender-demo.git
cd rails-surrender-demo
bin/setup
```

`bin/setup` installs the gems, creates and seeds the database with two companies of generated users, work orders and
activities, and starts the server on http://localhost:3000.

## Using the API

| Endpoint                | Returns                        |
|-------------------------|--------------------------------|
| `GET /company`          | The current user's company     |
| `GET /users`            | Users in the current company   |
| `GET /users/:id`        | One user                       |
| `GET /work_orders`      | Work orders in the company     |
| `GET /work_orders/:id`  | One work order                 |

The demo has no login. Pass the id of the user to act as in the `Authorization` header. This keeps the demo simple and
is not a pattern to copy.

```sh
curl -g -H 'Authorization: 1' 'localhost:3000/users?filter=active:true&sort=-name&include=work_orders'
```

Some requests to try:

| Query                                                         | Effect                                                  |
|---------------------------------------------------------------|---------------------------------------------------------|
| `/users?include=created_at,work_orders:[created_at]`          | Add attributes, and a nested association with its own   |
| `/company?include=users:[work_orders]&exclude=users:[work_orders:[activities]]` | Nest two levels, then trim one back |
| `/users?filter=active:false`                                  | Filter on a column                                      |
| `/work_orders?filter=created_after:'2026-01-01'`              | Filter a timestamp (`_before`, `_after`, `_to`, `_from`) |
| `/users?sort=-name`                                           | Sort descending; the sort is echoed in `X-Sort`         |
| `/work_orders?page=2&per=10`                                  | Paginate; details are in the `X-Pagination` header      |
| `/work_orders?filter=status:open&count`                       | Count the matching records                              |
| `/users?ids`                                                  | List the matching ids                                   |

Invalid parameters return `400 Bad Request` with an explanation, for example
`{"error":"nope is not a valid sort parameter."}`. The
[rails-surrender README](https://github.com/smmcbride/rails-surrender#features) covers every parameter.

A [Postman](https://www.postman.com/) collection and environment with these requests are in [`postman/`](postman).

## Tests

```sh
bin/rails test   # integration tests for each endpoint
bin/ci           # RuboCop, bundler-audit, Brakeman, the tests, and a seed check
```

## License

[GPL-3.0](LICENSE)

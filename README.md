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
- [mise](https://mise.jdx.dev), to install [HTTPie](https://httpie.io/cli) for `bin/http`. Any other HTTPie install works
  too.

## Getting started

```sh
git clone https://github.com/smmcbride/rails-surrender-demo.git
cd rails-surrender-demo
mise install
bin/setup
```

`mise install` installs HTTPie. `bin/setup` installs the gems, creates and seeds the database with two companies of
five users each, with their work orders and activities, and starts the server on http://localhost:3000.

## Using the API

| Endpoint                | Returns                        |
|-------------------------|--------------------------------|
| `GET /company`          | The current user's company     |
| `GET /users`            | Users in the current company   |
| `GET /users/:id`        | One user                       |
| `GET /work_orders`      | Work orders in the company     |
| `GET /work_orders/:id`  | One work order                 |

### In the browser

Open http://localhost:3000 for the explorer. Pick an endpoint and the user to act as, tick the options you want, and
press **Send** (or ⌘/Ctrl + Enter) to see the response with its status, `X-Sort` and `X-Pagination` headers.

- **Fields** lists every attribute and association the endpoint can render. Defaults start ticked: untick one to
  `exclude` it, tick another to `include` it. An association's own fields shape the nested resources.
- **Filter** has every filter surrender generates: equality on each column, and `_before` and `_after` on timestamps,
  to the second, sent as ISO 8601 times in UTC. Each starts with a value that suits its type, so ticking it is enough.
- **Sort** offers each column, and each column of a `belongs_to` association, ascending or descending.
- **Pages and totals** sets `page` and `per`, or asks for the `count` instead of the records. `per` starts at the
  demo's default page size of 30 and stops at its limit of 60.

The request line shows the URL as you build it, with each parameter coloured like its section, and the matching
`bin/http` command to copy.

The explorer lists the app's `GET` routes (see [`Explorer::Catalog`](app/models/explorer/catalog.rb)), so a new route
shows up without touching the explorer. When you pick one, it asks the route for its
[menu](https://github.com/smmcbride/rails-surrender#menus) with `?menu`, as the user you're acting as, and builds the
options from it. They always match what that endpoint accepts, including what its controller includes, excludes or
leaves unpaginated. `config.surrender.menus = true` in `config/application.rb` turns menus on. A member route asks for
its menu with the id you enter, so an id that doesn't exist, or a user who can't see it, shows the error instead.

### From the terminal

`bin/http` calls the running server and pretty-prints the JSON it returns:

```sh
bin/http userId=1 GET '/users?filter=active:false&sort=-name&per=2'
```

This acts as user 1 and lists the inactive users in their company, sorted by name in reverse, two per page:

```json
[
    {
        "id": 4,
        "name": "Marisha Ruecker",
        "active": false
    },
    {
        "id": 2,
        "name": "Malcom Reynolds",
        "active": false
    }
]
```

- **`userId=`** chooses the user to act as. The demo has no login. It sends the id as the `Authorization` header, which
  keeps the demo simple but is not a pattern to copy.
- **The method** is optional and defaults to `GET`.
- **Quote the path**, so your shell leaves `?`, `&`, `[` and `]` alone.
- **Extra arguments** go to HTTPie. Use `--headers` to see the response headers, or `--print=hb` for headers and body.

Error responses are printed too, and `bin/http` exits non-zero for them. Set `API_URL` to call a server other than
http://localhost:3000.

### Requests to try

The seed data is generated by [Faker](https://github.com/faker-ruby/faker) from a fixed seed, so you'll see the same
names, text and ids as these. Only the timestamps differ. To reseed later, use `bin/rails db:reset`: it starts the ids
at 1 again, which `db:seed:replant` doesn't.

**Add attributes and associations.** `include` adds a work order's `created_at` and its `user`, on top of what
`WorkOrder` renders by default. Each activity's `creator` is a default expand of `Activity`. A resource renders its
`id` first, then its other attributes, then its associations, each in the order the model declares them and then the
order the request includes them.

```sh
bin/http userId=1 '/work_orders/3?include=created_at,user'
```

```json
{
    "id": 3,
    "title": "Debitis ut nobis saepe.",
    "description": "Facere quo inventore. Omnis voluptas cumque. Omnis sed iusto.",
    "status": "closed",
    "created_at": "2026-11-13T18:02:15.596Z",
    "activities": [
        {
            "id": 6,
            "action": "productize visionary supply-chains",
            "creator": {
                "id": 4,
                "name": "Marisha Ruecker",
                "active": false
            }
        },
        {
            "id": 7,
            "action": "engineer impactful experiences",
            "creator": {
                "id": 2,
                "name": "Malcom Reynolds",
                "active": false
            }
        },
        {
            "id": 8,
            "action": "evolve one-to-one web services",
            "creator": {
                "id": 4,
                "name": "Marisha Ruecker",
                "active": false
            }
        }
    ],
    "user": {
        "id": 1,
        "name": "Brittany Klocko",
        "active": true
    }
}
```

**Shape nested resources.** Brackets apply `include` and `exclude` one level down. This adds the user's work orders,
adds `created_at` to each, and drops the activities work orders render by default.

```sh
bin/http userId=1 '/users/3?include=work_orders:[created_at]&exclude=work_orders:[activities]'
```

```json
{
    "id": 3,
    "name": "Rodrick Marquardt JD",
    "active": true,
    "work_orders": [
        {
            "id": 7,
            "title": "Inventore aut fugiat officiis.",
            "description": "Repellat omnis nesciunt. At fugiat a. Voluptas ducimus non.",
            "status": "open",
            "created_at": "2026-11-13T18:02:15.600Z"
        },
        {
            "id": 8,
            "title": "Explicabo dolorum debitis omnis.",
            "description": "Dolores tenetur neque. Et inventore sit. Quaerat ea quis.",
            "status": "pending",
            "created_at": "2026-11-13T18:02:15.601Z"
        },
        {
            "id": 9,
            "title": "Aperiam ex cupiditate a.",
            "description": "Perspiciatis accusamus magnam. Iste reiciendis quia. Perspiciatis expedita distinctio.",
            "status": "closed",
            "created_at": "2026-11-13T18:02:15.602Z"
        },
        {
            "id": 10,
            "title": "Magni dolores sit hic.",
            "description": "Molestiae neque aut. Ut consequatur quis. Quae et dolores.",
            "status": "open",
            "created_at": "2026-11-13T18:02:15.603Z"
        }
    ]
}
```

**Filter on columns and timestamps.** Every column can be filtered for equality. Timestamps also get `_before` and
`_after` filters, which take an ISO 8601 date or time such as `'2026-01-01'` or `'2026-01-01T13:30:00Z'`, in quotes.
Any other value is rejected with `400 Bad Request`. Here the path is in double quotes, so it can contain the
single-quoted date.

```sh
bin/http userId=1 "/work_orders?filter=status:open,created_after:'2026-01-01'&per=1"
```

```json
[
    {
        "id": 1,
        "title": "Ullam illum ex voluptatum.",
        "description": "In quam et. Cupiditate id non. Consequatur ex tenetur.",
        "status": "open",
        "activities": [
            {
                "id": 1,
                "action": "embrace 24/7 e-tailers",
                "creator": {
                    "id": 3,
                    "name": "Rodrick Marquardt JD",
                    "active": true
                }
            },
            {
                "id": 2,
                "action": "reinvent one-to-one e-commerce",
                "creator": {
                    "id": 5,
                    "name": "Chauncey Kreiger",
                    "active": true
                }
            }
        ]
    }
]
```

**Sort and paginate.** A leading `-` sorts in reverse. The response headers echo the sort in `X-Sort` and describe the
page in `X-Pagination`.

```sh
bin/http userId=1 '/users?sort=-name&per=2' --headers
```

```http
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
x-pagination: {"total":5,"page_total":2,"page":1,"previous_page":null,"next_page":2,"last_page":3,"per_page":2,"offset":0}
x-sort: -name
```

(The other headers are left out here.)

**Ask for a bigger page than allowed.** Surrender pages 50 resources at a time and never more than 100, whatever `per`
asks for. The demo changes both in [`config/application.rb`](config/application.rb), to 30 and 60:

```ruby
config.surrender.default_per_page = 30
config.surrender.max_per_page = 60
```

So asking for 100 gets a page of at most 60, and `X-Pagination` reports the size used:

```sh
bin/http userId=1 '/work_orders?per=100' --headers
```

```http
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
x-pagination: {"total":16,"page_total":16,"page":1,"previous_page":null,"next_page":null,"last_page":1,"per_page":60,"offset":0}
```

**Count the matches.** `count` returns how many records match the filters, across every page.

```sh
bin/http userId=1 '/work_orders?filter=status:open&count'
```

```json
{
    "count": 6
}
```

**List the matching ids.** Exclude every other field a resource renders by default, and only its `id` is left.

```sh
bin/http userId=1 '/users?filter=active:true&exclude=name,active'
```

```json
[
    {
        "id": 1
    },
    {
        "id": 3
    },
    {
        "id": 5
    }
]
```

**Ask for something unavailable.** `User` doesn't make `company` available, so the request is rejected with
`400 Bad Request`:

```sh
bin/http userId=1 '/users?include=company'
```

```json
{
    "error": "[:company] is not a valid include parameter."
}
```

**Reach outside the company.** User 6 works for the other company, so user 1 gets `403 Forbidden`:

```sh
bin/http userId=1 '/users/6'
```

```json
{
    "error": "User is not authorized"
}
```

The [rails-surrender README](https://github.com/smmcbride/rails-surrender#features) covers every query parameter.

## Tests

```sh
bin/rails test   # integration tests for each endpoint
bin/ci           # RuboCop, bundler-audit, Brakeman, the tests, and a seed check
```

## License

[GPL-3.0](LICENSE)

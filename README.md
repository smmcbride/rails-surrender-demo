# Surrender Demo
This is a fully functional Ruby on Rails project demonstrating the usage of 
[rails-surrender](https://github.com/smmcbride/rails-surrender).


## Installing
This project is not _yet_ docker-ized, so requires that Ruby on Rails can be installed on your local machine. These 
instruction assume you have [RVM](https://rvm.io/) installed and working.

Checkout this project
```shell
git clone https://github.com/smmcbride/rails-surrender-demo.git
cd rails-surrender-demo
```

Install the required Ruby version if required. After installing, leave and re-ender the project directory to have RVM 
generate the wrapper files
```shell
rvm install "ruby-3.0.0"
cd ..
cd rails-surrender-demo


> ruby-3.0.1 - #gemset created /Users/username/.rvm/gems/ruby-3.0.1@rails-surrender-demo
> ruby-3.0.1 - #generating rails-surrender-demo wrappers..............
```

Install gems, create and seed DB, and start the Rails server
```shell
bundle install
rails db:create
rails db:migrate
rails db:seed
rails server
```

Import the Postman collection and environment files from the `postman` directory into Postman and begin exploring the 
various endpoints provided in the collection. The collection provides several examples of the query parameters that 
`rails-surrender` makes available.

### ToDo
* Docker-ize this project
* Add Postman examples for passing and failing requests

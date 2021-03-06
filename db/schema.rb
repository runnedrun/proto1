# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20140616041339) do

  create_table "delayed_jobs", :force => true do |t|
    t.integer  "priority",   :default => 0
    t.integer  "attempts",   :default => 0
    t.text     "handler"
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.string   "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "delayed_jobs", ["priority", "run_at"], :name => "delayed_jobs_priority"

  create_table "notes", :force => true do |t|
    t.text     "content"
    t.integer  "site_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "scroll_x"
    t.integer  "scroll_y"
    t.text     "comment"
    t.integer  "comment_location_x"
    t.integer  "comment_location_y"
    t.string   "client_side_id"
    t.integer  "position"
    t.integer  "site_revision_number"
    t.integer  "node_index"
  end

  create_table "sites", :force => true do |t|
    t.text     "url"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "trail_id"
    t.text     "title"
    t.string   "domain"
    t.text     "archive_location"
    t.string   "html_encoding"
    t.integer  "position"
    t.integer  "user_id"
    t.text     "saved_resources",      :default => ""
    t.text     "saved_stylesheets",    :default => ""
    t.text     "revision_numbers",     :default => ""
    t.integer  "base_revision_number"
  end

  create_table "trails", :force => true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "owner_id"
  end

  create_table "trails_users", :force => true do |t|
    t.integer "trail_id"
    t.integer "user_id"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                   :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",           :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "provider"
    t.string   "uid"
    t.string   "name"
    t.string   "auth_token"
    t.datetime "expires_on"
    t.string   "wt_authentication_token"
    t.boolean  "whitelisted"
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end

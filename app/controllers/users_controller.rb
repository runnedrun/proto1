class UsersController < ApplicationController

  before_filter :require_no_user

  def create
    begin
      @user = User.create!(params[:user])
      redirect_to("/new_trail")
    rescue
      redirect_back_or_default("/new_user")
    end
  end

  def new
    @user = User.new()
  end

end
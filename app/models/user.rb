class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  #devise :database_authenticatable, :registerable,
  #       :recoverable, :rememberable, :trackable, :validatable,
  #       :omniauthable, :omniauth_providers => [:google_oauth2]

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me, :uid, :name, :provider, :auth_token, :expires_on, :whitelisted?
  has_and_belongs_to_many :trails
  def owned_trails
    self.trails.where(:owner_id=>self.id)
  end

  def sign_out
    self.update_attributes!(:wt_authentication_token => nil, :auth_token => nil, :expires_on => nil)
  end

  def self.find_by_wt_auth_token(auth_token)
    user = User.where(:wt_authentication_token => auth_token).first
    if user
      return user
    else
      return false
    end
  end

  def self.find_or_create_from_omniauth_hash(omniauth_hash, whitelisted="boothedog")
    user = nil
    if omniauth_hash
      user = User.where(:uid => omniauth_hash["uid"]).first
      if !user
        user = User.create!(name: omniauth_hash["info"]["first_name"],
                            email: omniauth_hash["info"]["email"],
                            uid: omniauth_hash["uid"],
                            provider: "google",
                            auth_token: omniauth_hash["credentials"]["token"],
                            expires_on: Time.at(omniauth_hash["credentials"]["expires_at"]),
        )
      end
      if !user.wt_authentication_token
        wt_auth_token = generate_wt_auth_token
        user.wt_authentication_token = wt_auth_token
      end
      user.whitelisted = true if whitelisted == "boothedog"
      user.save!
    else
      return false
    end
    user
  end

  def self.find_for_google_oauth2(access_token, expires_on)
    data = get_user_info_from_google(access_token)
    if data
      user = User.where(:uid => data["id"]).first
      unless user
        puts "creating new user"
        user = User.create!(name: data["given_name"],
                           email: data["email"],
                           uid: data["id"],
                           provider: "google",
                           auth_token: access_token,
                           expires_on: expires_on,
        )
      end
      if !user.wt_authentication_token
        wt_auth_token = generate_wt_auth_token
        user.wt_authentication_token = wt_auth_token
      end
      user.save!
    else
      return false
    end
    user
  end

  def self.get_user_info_from_google(access_token)
    $stderr.puts "making request now!"
    url =  "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + URI::encode(access_token)
    begin
      data = open(url)
      return JSON.parse(data.read)
    rescue
      puts "rescuing"
      return false
    end
  end

  def self.generate_wt_auth_token
    return SecureRandom.uuid
  end

  def get_update_hash
    update_hash = {}
    trails.each do |trail|
      update_hash[trail.id] = trail.get_update_hash()
    end
    update_hash
  end

end

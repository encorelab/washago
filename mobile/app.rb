require 'cuba'
require 'cuba/contrib'
require 'tilt'
require 'cuba/render'
# require 'mote'
require 'json'
require 'rack'
require 'rack/protection'
require 'rest-client'
require_relative 'helpers'


Cuba.plugin Cuba::Render
Cuba.plugin Cuba::Mote
Cuba.plugin Helpers
Cuba.use Rack::Session::Cookie, secret: "a_secret_key"
Cuba.use Rack::Protection
Cuba.use Rack::Static, root: "public", urls: ["/js", "/css", "/img", "/shared", "/node_modules"]
# Cuba.use Rack::Static, root: "shared", urls: ["/js", "/js/libs"]

Cuba.define do
  on get do
    on root do
      email = session[:email]
      # res.write render('mobile.html', '')
      res.write view('mobile', email: email)
    end
  end

  on post do
    on 'login', param(:assertion) do |assertion|
      @server = 'https://verifier.login.persona.org/verify'
      @req = RestClient::Resource
      res = nil
      assertion_params = {
        assertion: assertion,
        audience: "http://localhost:9292"
      }
      res = JSON.parse(@req.new(@server, :verify_ssl=> true).post(assertion_params))

      if res['status'] == 'okay'
        session[:email] = res['email']
        res.to_json
      else
        {status: 'error'}.to_json
      end
    end

    on 'logout' do
      session[:email] = nil
      res.redirect '/'
    end
  end
end

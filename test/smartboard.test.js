var should = chai ? chai.should() : require('chai').should();

var TEST_DROWSY_URL = "http://drowsy.badger.encorelab.org/";
var TEST_WAKEFUL_URL = "http://wakeful.badger.encorelab.org:7777/faye";
var TEST_DB = "washago-mocha-tests";

describe('Washago.Smartboard', function() {
  before(function (done) {
    Washago.Smartboard.on('ready', function () { 
      done();
    });
  });

  after(function (done) {
    var results = _.collect(Washago.Model.awake, function (coll, collName) {
      return Washago.Model.db.dropCollection(collName);
    });

    jQuery.when.apply(this, results).done(function () { done(); });
  });

  it('should be able to create tags using the Add Tag button', function (done) {
    var tagName = "t"+Math.round(Math.random()*1e9).toString(35);
    Washago.Smartboard.createNewTag(tagName);
    Washago.Model.awake.tags.on('all', function () {
      console.log("tags ev", arguments);
      //done();
    });
  });
});

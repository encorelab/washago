var should = chai ? chai.should : require('chai').should;

var TEST_DROWSY_URL = "http://drowsy.badger.encorelab.org/";
var TEST_WAKEFUL_URL = "http://wakeful.badger.encorelab.org:7777/faye";
var TEST_DB = "washago-mocha-tests";

describe('Washago.Model', function() {
  before(function (done) {
    Washago.Model.init(TEST_DROWSY_URL, TEST_DB)
    .then(function () {
      foo = Washago.Model.wake(TEST_WAKEFUL_URL);
      return foo
    }).done(function () { 
      done(); 
    });
  });

  describe('Note', function () {
    it('should create a new Note when .saved()', function (done) {
      var note = new Washago.Model.Note();
      note.save().then(function () { done() });
    });
  });
});

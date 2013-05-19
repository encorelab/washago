(function () {
  "use strict";

  this.Washago = {};

  Washago = this.Washago;

  Washago.getState = function(forEntity) {
    var state;
    state = Washago.Model.awake.states.findWhere({
      entity: forEntity
    });
    if (!state) {
      console.warn("There is no state data for entity '" + forEntity + "'!");
    }
    return state;
  };

  Washago.setState = function(forEntity, values) {
    var state;
    state = Washago.getState(forEntity);
    if (!state) {
      state = new Washago.Model.State();
      state.set('entity', forEntity);
      Washago.Model.awake.states.add(state);
    }
    state.set(values);
    state.set('modified_at', new Date());
    state.save();
    return state;
  };

}).call(this);
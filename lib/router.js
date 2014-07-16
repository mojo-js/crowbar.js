var protoclass = require("protoclass"),
bindable       = require("bindable"),
Location        = require("./location"),
Routes         = require("./routes"),
async          = require("async"),
_              = require("underscore");

function Router (options) {

  bindable.Object.call(this, this);

  this.routes = new Routes(this);

  this.middleware = _.bind(this.middleware, this);
  var self = this;

  this.use(require("./plugins/param"));
}

bindable.Object.extend(Router, {

  /**
   */

  use: function () {
    for (var i = arguments.length; i--;) {
      arguments[i](this);
    }
    return this;
  },

  /**
   */

  middleware: function (req, res, next) {
    this.request(req.url).enter(function (err, location) {
      if (err) return next(err);
      req.location = location;
      next();
    });
  },


  /**
   */

  init: function () {
    this.emit("init");
  },

  /**
   */

  redirect: function (path, options, next) {

    if (!options) options = {};

    if (typeof options === "function") {
      next = options;
      options = {};
    }

    if (!next) next = function () {};
    var self = this;

    try {
      var request = this.request(path, options);
    } catch (e) {
      this.emit("error", e);
      return next(e, this.location);
    }

    if (this.location) {
      if (this.location.equals(request)) {
        this.location.merge(request);
        return process.nextTick(function () {
          next(null, self.location);
        });
      }
      request.mergeQuery(this.location.query.context());
    }


    // new path? re-renter
    request.enter(function (err, request) {
      if (err) return next();
      if (request.get("response.redirect")) {
        return self.redirect(request.get("response.redirect"), next);
      }
      self.set("location", request);
      next(null, request);
    });

    return this;
  },

  /**
   */

  route: function (route) {
    this.routes.add(route);
    return this;
  },

  /**
   * DEPRECATED
   */

  add: function (route) {
    return this.route(route);
  },

  /**
   */

  request: function (path, options) {
    return new Location(this, this.routes.parsePath(path, options));
  }
});


module.exports = Router;
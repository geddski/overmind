/**
 * Overmind
 * Copyright 2014 Dave Geddes @geddski
 * Version 2.0.2
 */

var overmind = angular.module('overmind', ['ngRoute']);
overmind.shared = {};

overmind.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider){
  $routeProvider.otherwise({});

  // share the routeProvider with all the other apps
  overmind.shared.$routeProvider = $routeProvider;
}])
.run(["$rootScope", "$location", "$route", "$templateCache", "$routeParams", "$browser", "$rootElement", "$q", 
  function($rootScope, $location, $route, $templateCache, $routeParams, $browser, $rootElement, $q){
  decorate($location, 'url');
  decorate($location, 'replace');
  decorate($location, 'path');
  decorate($location, 'search');
  decorate($location, 'hash');

  // patch a service to update overmind's scope when called
  function decorate(service, method){
    var original = service[method];
    service[method] = function(){
      // apply scope for setters
      if (arguments.length > 0){
        setTimeout(function(){
          $rootScope.$apply();    
        });
      }
      return original.apply(service, arguments);
    }
  }

  // make routing components available to other apps
  var shared = overmind.shared;
  shared.$location = $location;
  shared.$route = $route;
  shared.$routeParams = $routeParams;
  shared.$templateCache = $templateCache;
  shared.$routeParams = $routeParams;
  shared.$browser = $browser;
  shared.overmindScope = $rootScope;

  // listen for clicks on the root like $location does, but do it for the body so it will apply to all apps
  angular.element(document.body).on('click', function(event) {
    if (event.ctrlKey || event.metaKey || event.which == 2) return;

    var elm = angular.element(event.target);

    // traverse the DOM up to find first A tag
    while ((elm[0].nodeName).toLowerCase() !== 'a') {
      // ignore rewriting if no A tag (reached root element, or no parent - removed from document)
      if (elm[0] === $rootElement[0] || !(elm = elm.parent())[0]) return;
    }

    var absHref = elm.prop('href');
    
    // get the actual href attribute - see
    // http://msdn.microsoft.com/en-us/library/ie/dd347148(v=vs.85).aspx
    var relHref = elm.attr('href') || elm.attr('xlink:href');
    
    // Ignore when url is started with javascript: or mailto:
    var IGNORE_URI_REGEXP = /^\s*(javascript|mailto):/i;
    if (IGNORE_URI_REGEXP.test(absHref)) return;
    
    if (absHref && !elm.attr('target') && !event.isDefaultPrevented()) {
      if ($location.$$parseLinkUrl(absHref, relHref)) {
        // We do a preventDefault for all urls that are part of the angular application,
        // in html5mode and also without, so that we are able to abort navigation without
        // getting double entries in the location history.
        event.preventDefault();
        // update location manually
        if ($location.absUrl() != $browser.url()) {
          $rootScope.$apply();
          // hack to work around FF6 bug 684208 when scenario runner clicks on links
          window.angular['ff-684208-preventDefault'] = true;
        }
      }
    }
  });
}]);

// allow shared resources.
// these will be provided to apps controlled by the overmind
angular.module('overmind').share = function(shared){
  angular.forEach(shared, function(val, key){
    overmind.shared[key] = val;
  });
};

// Surrender your will to the overmind.
// Configures other applications to use routeProvider etc from overmind 
angular.module('overmind').control = function(){

  return ["$provide", function($provide){
    var shared = overmind.shared;
    if (!shared) return;
    angular.forEach(overmind.shared, function(val, key){
      $provide.constant(key, val);
    });
  }];
};


// overmind directive, replaces ng-view
angular.module('overmind').directive('overmind', ["$location", "$route", function($location, $route){
  return {
    restrict: 'E',
    link: function(scope){
      var currentlyBootstrapped;
      var currentViewScope;

      scope.$on('$routeChangeSuccess', function(){
        // determine the app (if any) to bootstrap or use default
        var overmind = angular.module('overmind');
        var match = $location.path().match(/\/\w+/) || [];
        var app = overmind.apps[match[0]] || overmind.default;

        // if the app is registered and is different from the current app, bootstrap it
        if (app && app !== currentlyBootstrapped){
          cleanupApp();
          bootstrap(app);
        }
        else{
          cleanupView();
          setView();
        }
      });

      function bootstrap(app){
        require([app.file], function(){
          var newApp = getCurrentApp();
          angular.bootstrap(newApp, [app.ngModule]);
          currentlyBootstrapped = app;
          // check for new matching routes
          $route.reload();
        });
      }

      // delete scopes and reset app html
      function cleanupApp(){
        var previousApp = getCurrentApp();
        var previousScope = previousApp.scope();
        var template = '<div id="current-app"><div id="current-view"></div></div>';
        if (previousScope){
          previousScope.$destroy();
        }
        previousApp.replaceWith(template);
      }

      function cleanupView(){
        var previousView = getCurrentView();
        if (currentViewScope){
          currentViewScope.$destroy();
        }
        previousView.replaceWith('<div id="current-view"></div>');
      }

      function setView(){
        var currentRoute = $route.current;
        var locals = currentRoute && currentRoute.locals
        var template = locals && locals.$template;

        var currentApp = getCurrentApp();
        var currentView = getCurrentView();
        var currentAppScope = currentApp.scope();
        var currentAppInjector = currentApp.injector();
        var $compile = currentAppInjector.get('$compile');

        currentView.html(template);

        var link = $compile(currentView.parent().contents());

        currentViewScope = currentAppScope.$new();
        overmind.shared.currentViewScope = currentViewScope;
        if (currentRoute.controller) {
          locals.$scope = currentViewScope;
          var $controller = currentAppInjector.get('$controller');
          var controller = $controller(currentRoute.controller, locals);
          if (currentRoute.controllerAs) {
            currentViewScope[currentRoute.controllerAs] = controller;
          }
          currentView.data('$ngControllerController', controller);
          currentView.children().data('$ngControllerController', controller);
        }
        link(currentViewScope);
        currentAppScope.$apply();
      }

      function getCurrentApp(){
        return angular.element(document.getElementById('current-app'));
      }

      function getCurrentView(){
        return angular.element(document.getElementById('current-view'));
      }
    }
  }
}]);

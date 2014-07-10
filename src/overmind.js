angular.module('overmind', ['ngRoute'])
  .config(function($routeProvider, $locationProvider){
    $routeProvider.otherwise({});

    // share the routeProvider with all the other apps
    window.overmind = {};
    window.overmind.$routeProvider = $routeProvider;
  })
  .run(function($rootScope, $location, $route, $templateCache, $routeParams, $browser, $rootElement){
    decorate($location, 'url');
    decorate($location, 'replace');
    decorate($location, 'path');
    decorate($location, 'search');
    decorate($location, 'hash');

    // patch a service to update overmind's scope when called
    function decorate(service, method){
      var original = service[method];
      service[method] = function(){
        setTimeout(function(){
          $rootScope.$apply();    
        });
        return original.apply(service, arguments);
      }
    }

    // make routing components available to other apps
    window.overmind.$location = $location;
    window.overmind.$route = $route;
    window.overmind.$routeParams = $routeParams;
    window.overmind.$templateCache = $templateCache;
    window.overmind.$routeParams = $routeParams;
    window.overmind.$browser = $browser;
    window.overmind.overmindScope = $rootScope;

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

      var rewrittenUrl = $location.$$rewrite(absHref);

      if (absHref && !elm.attr('target') && rewrittenUrl && !event.isDefaultPrevented()) {
        event.preventDefault();
        if (rewrittenUrl != $browser.url()) {
          // update location manually
          $location.$$parse(rewrittenUrl);
          $rootScope.$apply();
          // hack to work around FF6 bug 684208 when scenario runner clicks on links
          window.angular['ff-684208-preventDefault'] = true;
        }
      }
    });
  });

// Surrender your will to the overmind.
// Configures other applications to use routeProvider etc from overmind 
angular.module('overmind').control = function(){
  return function($provide){
    $provide.constant('$routeProvider', window.overmind.$routeProvider);
    $provide.constant('$location', window.overmind.$location);
    $provide.constant('$route', window.overmind.$route);
    $provide.constant('$templateCache', window.overmind.$templateCache);
    $provide.constant('$routeParams', window.overmind.$routeParams);
    $provide.constant('$browser', window.overmind.$browser);
    $provide.constant('overmindScope', window.overmind.overmindScope);
  }
};


/**
 * overmind directive
 * this is the overmind's version of ngView
 */ 
angular.module('overmind').directive('overmind', overmindFactory);
angular.module('overmind').directive('overmind', overmindFillContentFactory);


/**
 * @ngdoc event
 * @name overmind#$viewContentLoaded
 * @eventType emit on the current app scope
 * @description
 * Emitted every time the overmind content is reloaded.
 */
overmindFactory.$inject = ['$route', '$anchorScroll', '$animate', '$location'];
function overmindFactory(   $route,   $anchorScroll,   $animate,  $location) {
  return {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentScope,
            currentElement,
            previousElement,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '',
            currentApp;

        scope.$on('$routeChangeSuccess', function(){
          // determine the app (if any) to bootstrap or use default
          var overmind = angular.module('overmind');
          var match = $location.path().match(/\/\w+/) || [];
          var app = overmind.apps[match[0]] || overmind.default;

          // if the app is registered and is different from the current app, bootstrap it
          if (app && app !== currentApp){
            bootstrap(app);
          }
          else{
            update();
          }
        });

        function cleanupLastView() {
          if(currentElement) {
            previousElement = currentElement;
            currentElement = null;
          }
          if(currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if(previousElement) {
            previousElement.replaceWith('<div id="current-view"></div>');
            previousElement = null;
          }
        }

        function bootstrap(app){
          require([app.file], function(res){
              var previousScope = angular.element(document.getElementById('current-app')).scope();
              if (previousScope){
                previousScope.$destroy();
              }
              angular.element(document.getElementById('current-app')).replaceWith('<div id="current-app"><div id="current-view"></div></div>');
              angular.bootstrap(document.getElementById('current-app'), [app.ngModule]);
              currentApp = app;
              // check again for matching routes
              $route.reload();
          });
        }

        function update() {
          var locals = $route.current && $route.current.locals,
              template = locals && locals.$template;

          if (angular.isDefined(template)) {
            // gets the scope of the current app
            var currentApp = angular.element(document.getElementById('current-app'));
            var currentView = angular.element(document.getElementById('current-view'));
            var currentAppScope = currentApp.scope();

            var newScope = currentAppScope.$new();
            var current = $route.current;

            // Note: This will also link all children of ng-view that were contained in the original
            // html. If that content contains controllers, ... they could pollute/change the scope.
            // However, using ng-view on an element with additional content does not make sense...
            // Note: We can't remove them in the cloneAttchFn of $transclude as that
            // function is called before linking the content, which would apply child
            // directives to non existing elements.

            var clone = $transclude(newScope, function(clone) {
              cleanupLastView();
            });
            
            currentElement = currentView;

            currentScope = current.scope = newScope;
            currentScope.$emit('$viewContentLoaded');
            currentScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
    }
  };
}

// This directive is called during the $transclude call of the first `overmind` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as overmind
// is called.
overmindFillContentFactory.$inject = ['$compile', '$controller', '$route'];
function overmindFillContentFactory($compile, $controller, $route) {
  return {
    restrict: 'ECA',
    priority: -400,
    link: function(scope, $element) {
      // use current app's $compile, scope
      var currentApp = angular.element(document.getElementById('current-app'));
      var currentView = angular.element(document.getElementById('current-view'));
      var currentAppInjector = currentApp.injector();
      $compile = currentAppInjector.get('$compile');
      scope = currentApp.scope();

      var current = $route.current,
          locals = current.locals;


      currentView.html(locals.$template);

      var link = $compile(currentView.contents());

      if (current.controller) {
        locals.$scope = scope;
        // use current app's $controller
        $controller = currentAppInjector.get('$controller');
        var controller = $controller(current.controller, locals);
        if (current.controllerAs) {
          scope[current.controllerAs] = controller;
        }
        currentView.data('$ngControllerController', controller);
        currentView.children().data('$ngControllerController', controller);
      }

      link(scope);
      scope.$apply();
    }
  };
}
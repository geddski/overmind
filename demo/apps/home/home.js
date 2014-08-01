angular.module('home', [])
  .config(angular.module('overmind').control())
  .config(function($routeProvider){
    $routeProvider.when('/', {controller: 'HomeCtrl', templateUrl: 'apps/home/home.html'})
  })
  .controller('HomeCtrl', function($scope){
    console.log("home ctrl");
  })

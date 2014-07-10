angular.module('admin', [])
  .config(angular.module('overmind').control())
  .config(function($routeProvider){
    $routeProvider.when('/admin', {controller: 'AdminCtrl', templateUrl: '/client/apps/admin/admin.html'})
  })
  .controller('AdminCtrl', function($scope){
    console.log("$scope", $scope);
  })
angular.module('admin', [])
  .config(angular.module('overmind').control())
  .config(function($routeProvider){
    $routeProvider.when('/admin', {controller: 'AdminCtrl', templateUrl: '/client/apps/admin/admin.html'})
    $routeProvider.when('/admin/settings', {controller: 'AdminSettingsCtrl', templateUrl: '/client/apps/admin/admin-settings.html'})
  })
  .controller('AdminCtrl', function($scope){
    console.log("admin ctrl");
  })
  .controller('AdminSettingsCtrl', function($scope){
    console.log("admin settings ctrl");
    $scope.message = 'update settings';
  })
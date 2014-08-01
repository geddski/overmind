# overmind.js
Easy module isolation and lazy loading for Angular apps.

![overmind](http://i.gyazo.com/b6fd9898f64efc2024eb4d73777e6b56.png)

Overmind replaces ng-view. When the user navigates to a route, the overmind checks to see which app that route belongs to, loads the app's scripts and templates (if not already loaded) and bootstraps the app on the fly.

## Benefits
Breaking your Angular project into many small, isolated angular apps has many benefits. Each app:
- has its own completely separate scope, digest cycle, events, etc.
- has much smaller watch - one app's scope updates won't trigger another app's watches.
- can (optionally) delay loading of source code & templates until user navigates to it.
- can still link to other apps' routes with regular hyperlinks: `<a href="/profile/edit">Edit Profile</a>`
- is easier to maintain since isolated from everything else.
- has its own injector, so the apps don't have to worry about namespacing everything.

You can have several apps on the page at a time. See the Demo.

## Demo
Shows a project broken up into several apps: `nav`, `home`, `profile`, and `admin`.
The `nav` app is always on the page and is the only app bootstrapped on pageload.
See the demo [here](http://geddski.github.io/overmind).

## Limitations
Overmind.js is a replacement for `ng-view`, and currently assumes a single main content area. Luckily 
your apps can bootstrap other apps where needed. For example when the user clicks on a `chat` icon,
the `nav` app could load & bootstrap the `chat` app into a sidbar area.

## Gotchas
`$rootScope` will be unique for each app. If you need to communicate between apps
via events etc. inject and use `overmindScope` instead.

Many projects will have a `common` ng app for reusable models, filters, services etc.
You will still need to namespace these components to avoid collisions with your various apps.
Also keep in mind that the components get registered for each app that uses them, so 
make sure they are idempotent. For example a directive that breaches its element to 
modify the `<body>` may cause you trouble when it registers multiple times (for each app that uses it).

Setting up overmind is pretty easy, the only real work is separating your apps' dependencies so they are loosly coupled from each other.

## Getting Started

### Update HTML

Add the overmind app & directive anywhere in your main html page:

```html
<div id="overmind">
  <overmind></overmind>
</div>
```

Also replace your `ng-view` usage with:

```html
<div id="current-app"><div id="current-view"></div></div>
```

Overmind uses these divs to swap apps and views in and out.

### Register with Overmind
Wherever you define your Angular apps, register them with the overmind:
```js
angular.module('profile', [])
  .config(angular.module('overmind').control());
```

This provides your app with things it used to get from `ngRoute`: `$location`, `$route`, `$routeParams`, etc. The difference is these actually belong to the overmind. So even though your project will consist of many isolated apps, users can enjoy a seamless routing experience between apps via overmind. Important: make sure your apps no longer depend on `ngRoute` directly. Only the overmind will depend on `ngRoute` from here on.

### Configure overmind
Before you bootstrap overmind, you need to let it know about your apps. 
`/routePrefix` : any route that **starts** with this will cause this app to be loaded & boostraped. 
`ngModule` : the name of your Angular module.
`file` : the location of the app's main entry JS file to load. Usually this file will `require()` the rest of the app's files when loaded.


```js
var overmind = angular.module('overmind');

overmind.apps = {
  '/profile': {
    ngModule: 'profile',
    file: 'apps/profile/profile'
  },
  '/admin': {
    ngModule: 'admin',
    file: 'apps/admin/admin'
  }
};
```

So with this config if the user navigates to `/profile/activity` the overmind will load and bootstrap the `profile` app, then go to the view specified in the profile app for `/profile/activity`.

Say the user then navigates to `/profile/friends`. The `profile` app is already loaded and bootstrapped so 
the view will simply change to the correct controller/template specified in the profile app for `/profile/friends`.

Say the user then navigates to `/admin/users`. The overmind will unbootstrap/cleanup the `profile` app, load and bootstrap the `admin` app, and render the view specified in the admin app for the `/admin/users` route. 


The overmind config is also the place to set `html5` mode if you're using it:

```js
overmind.config(function($locationProvider){
  $locationProvider.html5Mode(true);
});
```

### Bootstrap overmind
Finally, boostrap the overmind:
```js
angular.boostrap('#overmind', ['overmind']);
```
You can also bootstrap any other apps that live continuously on the page, like a `nav` app or a `chat` sidebar. But the overmind will handle the bootstrapping of your main content apps.

## Contributions
I welcome tests (with protractor probably?), bug fixes, better documentation, perf, upgrading Angular versions, etc.

## Direction
I'd like to make overmind configurable for other loaders, so you could use webpack, browserify, etc. Currenly only requirejs is supported. Also might look into support ui-router if there's enough interest.

## License
MIT
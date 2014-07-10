# overmind.js
Easy module isolation and lazy loading for Angular apps. Replace ng-view. 
When the user navigates to a route, the overmind checks to see which app that route belongs to.
The overmind then loads the app's scripts and templates (if not already loaded) and then bootstraps it on the fly.

## Benefits
Breaking your Angular app into many small, separate angular apps has many benefits. Each app:
- has its own completely separate scope, digest cycle, events, etc.
- has much smaller watch - one app's scope updates won't trigger another app's watches.
- can (optionally) delay loading of source code & templates until user navigates to it.
- can still link to other apps' routes with regular hyperlinks (<a href="/profile/edit">Edit Profile</a>)
- is easier to maintain since isolated from everything else.
- has its own injector, so the apps don't have to worry about namespacing everything.

You can have several apps on the page at a time. See the Demo.

## Demo
Shows a project broken up into several apps: `nav`, `home`, `profile`, and `admin`.
The `nav` app is always on the page and gets bootstrapped on pageload. 
 For example, navigating to either `/profile/edit`
or `/profile/`

`cd overmind`  
`node demo/server/app`  
open browser at localhost:9191  
Notice how the `home`, `profile` and `admin` apps are loaded and bootstrapped on demand

## Limitations
Overmind.js is a replacement for `ng-view`, and currently assumes a single main content area. Luckily 
your apps can bootstrap other apps where needed.

## Gotchas
`$rootScope` will be unique for each app. If you need to communicate between apps
via events etc inject and use `overmindScope` instead. TODO: show example

Many projects will have a `common` ng app for reusable models, filters, services etc.
You will still need to namespace these components to avoid collisions.
Also keep in mind that the components get registered for each app that uses them, so 
make sure they are idempotent. For example a directive that breaches its element to 
modify the <body> may cause you trouble.

## Getting Started
TODO. See Demo for now. 

## Contributions
Would welcome tests (with protractor probably?), bug fixes, better documentation, general feedback, perf, upgrading Angular versions, etc.

## Direction
Would like to make overmind configurable for other loaders, so you could use webpack, browserify, etc. Currenly only requirejs is supported.

## License
MIT
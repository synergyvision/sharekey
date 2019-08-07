'use strict';

var env = {};

// Import variables if present (from env.js)
if(window){  
  Object.assign(env, window.__env);
}


// Declare app level module which depends on views, and core components
var ngModule = angular.module('sharekey', [
  'ngRoute',
  'ui.router',
  'ngCookies',
  'ngAnimate',
  'ngStorage',
  'ngFileSaver',
  'sharekey.login',
  'sharekey.reset',
  'sharekey.register',
  'sharekey.navbar',
  'sharekey.sidebar',
  'sharekey.profile',
  'sharekey.keys',
  'sharekey.dashboard',
  'sharekey.contacts',
  'sharekey.message',
  'sharekey.chats',
  'sharekey.posts',
  'sharekey.surveys',
  'sharekey.repos',
  'sharekey.files',
  'sharekey.config',
  'btford.socket-io'
]).
config(['$locationProvider', '$urlRouterProvider', function($locationProvider, $stateProvider, $urlRouterProvider) {
  $locationProvider.hashPrefix('!')
}])

ngModule.constant('__env', env)

ngModule.service('SocketService', ['socketFactory', function SocketService(socketFactory) {
  return socketFactory({
      ioSocket: io.connect(__env.apiUrl)
  });
}]);
//var express = require('express');
//var router = express.Router();
//
///* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'MicroBlog Based on Express' });
//});

var crypto = require('crypto'),
    User = require('../models/user.js');

//module.exports = router;
module.exports = function(app) {
  //app.get('/', function (req, res) {
  //  res.render('index', { title: 'MicroBlog Based on Express' });
  //});

  //app.get('/nswbmw', function (req, res) {
  //  res.send('hello,world!');
  //});

  app.get('/', function (req, res) {
    res.render('index', { title: '主页' });
  });

  app.get('/reg', function (req, res) {
    res.render('reg', { title: '注册' });
  });

  app.post('/reg', function (req, res) {

  });

  app.get('/login', function (req, res) {
    res.render('login', { title: '登录' });
  });

  app.post('/login', function (req, res) {

  });

  app.get('/post', function (req, res) {
    res.render('post', { title: '发表' });
  });

  app.post('/post', function (req, res) {

  });

  app.get('/logout', function (req, res) {

  });
};

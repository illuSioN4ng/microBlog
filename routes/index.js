//var express = require('express');
//var router = express.Router();
//
///* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'MicroBlog Based on Express' });
//});

var crypto = require('crypto'),//crypto 是 Node.js 的一个核心模块，我们用它生成散列值来加密密码。
    User = require('../models/user'),
    Post = require('../models/post'),
    Comment = require('../models/comment.js');

//module.exports = router;
module.exports = function(app) {
  //app.get('/', function (req, res) {
  //  res.render('index', { title: 'MicroBlog Based on Express' });
  //});

  //app.get('/nswbmw', function (req, res) {
  //  res.send('hello,world!');
  //});

  app.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = parseInt(req.query.p) || 1;//通过 req.query.p 获取的页数为字符串形式，我们需要通过 parseInt() 把它转换成数字以作后用
    //查询并返回第 page 页的 10 篇文章
    Post.getTen(null, page, function(err, posts, total){
      if(err){
        posts = [];
      }
      //console.log(posts);
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        success: req.flash('success').toString(),
        //success: req.flash('success'),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    var name = req.body.name,
        password = req.body.password,//req.body['password']亦可
        password_repeat = req.body['password-repeat'];
    if(password != password_repeat){
      req.flash('error', '两次输入的密码不一致！');
      return res.redirect('/reg');
    }
    //生成密码的md5值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex'),
        newUser = new User({
          name: name,
          password: password,
          email: req.body.email
        });
    //检查用户是否存在
    User.get(newUser.name,  function(err, user){//从 WeakMap 对象中返回指定的元素。返回与此键关联的对象。如果 WeakMap 不包含键，则此方法返回 undefined 值。
      if(err){
        req.flash('error', err);
        return res.redirect('/reg');
      }
      if(user){
        req.flash('error', '用户已存在！');
        return res.redirect('/reg');
      }
      newUser.save(function(err, user){
        if(err){
          req.flash('error', err);
          return res.redirect('/reg');//注册失败返回主册页
        }
        req.session.user = user;
        req.flash('success', '注册成功！');
        res.redirect('/');//注册成功后返回主页
      });
    });

  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),//生成了一个md5的hash实例
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');//用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
        req.flash('error', '密码错误!');
        return res.redirect('/login');//密码错误则跳转到登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/');//登陆成功后跳转到主页
    });
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags, req.body.post);
    //console.log(req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error', err);
        return res.redirect('/post');
      }
      req.flash('success', '发表成功');
      res.redirect('/');
    });
  });

  app.get('/archive', function(req, res){
    Post.getArchive(function(err, posts){
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('archive', {
        user: req.session.user,
        title: '存档',
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        posts: posts
      });
    });
  });

  app.get('/tags', function(req, res){
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/u/:name', function(req, res){ //app.get('/u/:name')，用来处理访问用户页的请求，然后从数据库取得该用户的数据并渲染 user.ejs 模版，生成页面并显示给用户。
    var page = parseInt(req.query.p) || 1;
    //检查用户是否存在
    User.get(req.params.name, function(err, user){
      if(err){
        req.flash('error', '用户不存在！');
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getTen(user.name, page, function(err, posts, total){
        //console.log(total);
        if(err){
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user',{
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      })
    })
  });

  app.get('/search', function(req, res){
    Post.search(req.query.keyword, function(err, posts){
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('search', {
        title: 'SEARCH' + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/links', function (req, res) {
    res.render('links', {
      title: '友情链接',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.get('/u/:name/:day/:title', function(req, res){
    Post.getOne(req.params.name, req.params.day,  req.params.title, function(err, post){
      if(err){
        req.flash('error', '文章不存在！');
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        user: req.session.user,
        post: post,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
      name: req.body.name,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '留言成功!');
      res.redirect('back');
    });
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function(req, res){
    Post.edit(req.params.name, req.params.day, req.params.title, function(err, post){
      if(err){
        req.flash('error', err);
        res.render('back');
      }
      res.render('edit', {
        title: '编辑',
        user: req.session.user,
        post: post,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function(req, res){
    //var currentUser = req.session.user;
    //console.log(currentUser.name + '*******' + req.params.name);
    Post.update(req.params.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if (err) {
        req.flash('error', err);
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    });
  });

  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功！');
    res.redirect('/');
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res){
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', function (req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  function checkLogin(req, res, next){
    if(!req.session.user){
      req.flash('error', '未登录');
      res.redirect('/login')
    }
    next();
  }

  function checkNotLogin(req, res, next){
    if(req.session.user){
      req.flash('error', '已登录');
      res.redirect('back')
    }
    next();
  }
};

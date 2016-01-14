/**
 * Created by Administrator on 2016/1/4.
 */
var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post(name, title, tags, post){
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
}

module.exports = Post;

//存储一篇文章及其相关
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种事件格式，以便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' +date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
    };
    //console.log(post);
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post, {
                safe: true
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//获取一个人的所有文章（传入参数 name）或获取所有人的文章（不传入参数）。
//mongodb 的 skip 和 limit 操作,实现主页和用户页面每页最多显示十篇文章
Post.getTen = function(name, page, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //使用count返回特定查询的文档数total
            collection.count(query,  function(err, total){
                //console.log(total);
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function(err, docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }

                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });

                    callback(null, docs, total);
                    //console.log(docs);
                });
            });
        });
    });
};

Post.getOne = function(name, day, title, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期、文章名进行查找
            collection.findOne({
                'name': name,
                'time.day': day,
                'title': title,
            },function(err, doc){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                if(doc){
                    //每访问 1 次，pv 值增加 1
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    }, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    //doc.post = markdown.toHTML(doc.post);解析 markdown
                    doc.post = markdown.toHTML(doc.post);
                    if(doc.comments){
                        doc.comments.forEach(function(comment){
                            comment.content = markdown.toHTML(comment.content);
                        });
                    }
                }
                mongodb.close();
                callback(null, doc);//返回查询到的文章，err为null
            });
        });
    });
};

Post.edit = function(name, day, title, callback) {//返回原始markdown内容
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                'name': name,
                'time.day': day,
                'title': title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};

Post.update = function(name, day, title, post, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                $set:{
                    post: post
                    //title: title
                }
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//删除一篇文章
Post.remove = function(name, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1//Write Concern级别
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.getArchive = function(callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        mongodb.collection('posts',function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({},{
                name: 1,
                title: 1,
                time: 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            })
        });
    });
};

//返回所有标签
Post.getTags = function(callback){
    mongodb.open(function(err, db){
        if(err){
            return callbaack(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.search = function(keyword, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            },{
                'name': 1,
                'title': 1,
                'time': 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callbak(err);
                }
                callback(null, docs);
                //console.log(docs);
            });
        });
    });
}
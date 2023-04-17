/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Savreet Kaur Aujla Student ID: 170818215 Date: 14/04/2023
*
*  Cyclic Web App URL: 
*
*  GitHub Repository URL: 
*
********************************************************************************/
var HTTP_PORT = 8080;
var express = require("express");
var engine = require("express-handlebars").engine;
var app = express();
const path = require('path');
const router = express.Router();
const stripJs = require('strip-js')
const authData = require('./auth-service');
const clientSessions = require('client-sessions')

app.engine('.hbs', engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        },
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', './views');
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
    cookieName: 'session',
    secret: 'Sessions',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 15
}));
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});
const BlogSerice = require("./blog-service")
const BS = new BlogSerice()
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier');
cloudinary.config({
    cloud_name: 'dnpqw4rc3',
    api_key: '925691855222693',
    api_secret: 'iynHOELGePi9_kx-T_PivaOKKVo',
    secure: true
});
const upload = multer()
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

router.get("/", (req, res) => {
    res.redirect("/blog");
});
router.get('/userHistory', ensureLogin, function (req, res) {
    res.render('userHistory');
});
router.get('/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
});
router.get("/login", (req, res) => {
    res.render("login")
});
router.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent')
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };

            res.redirect('/posts');
        })
        .catch(err => {
            res.render('login', {
                errorMessage: err,
                userName: req.body.userName
            });
        });
});
router.get("/register", (req, res) => {
    res.render("register")
});
router.post("/register", (req, res) => {
    req.body.userAgent = req.get('User-Agent')
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: 'User created' });
        })
        .catch((err) => {
            res.render('register', { errorMessage: err, userName: req.body.userName, email: req.body.email });
        });
});
router.get("/about", (req, res) => {
    res.render('about');
});
router.get('/blog', async (req, res) => {
    let viewData = {};
    try {
        let posts = [];
        if (req.query.category) {
            posts = await BS.getPublishedPostsByCategory(req.query.category);
        } else {
            posts = await BS.getPublishedPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        let post = posts[0];
        viewData.posts = posts;
        viewData.post = post;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await BS.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", { data: viewData })
});
router.get('/blog/:id', async (req, res) => {
    let viewData = {};
    try {
        let posts = [];
        if (req.query.category) {
            posts = await BS.getPublishedPostsByCategory(req.query.category);
        } else {
            posts = await BS.getPublishedPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.posts = posts;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.post = await BS.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await BS.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", { data: viewData })
});
router.get("/posts", ensureLogin, (req, res) => {
    if (req.query?.category) {
        BS.getPostsByCategory(req.query?.category).then((data) => {
            res.render("posts", { posts: data })
        }).catch((err) => {
            res.render("posts", { message: err });
        });
    } else if (req.query?.minDate) {
        BS.getPostsByMinDate(req.query?.minDate).then((data) => {
            res.render("posts", { posts: data })
        }).catch((err) => {
            res.render("posts", { message: err });
        });
    } else {
        BS.getAllPosts().then((data) => {
            res.render("posts", { posts: data })
        }).catch((err) => {
            res.render("posts", { message: err });
        });
    }
});
router.get("/categories", ensureLogin, (req, res) => {
    BS.getCategories().then((data) => {
        res.render("categories", { categories: data })
    }).catch((err) => {
        res.render("categories", { message: err });
    });
});
router.get("/categories/add", ensureLogin, (req, res) => {
    res.render("addCategories");
});
router.post('/categories/add', ensureLogin, (req, res) => {
    BS.addCategory(req.body).then((data) => {
        res.redirect("/categories");
    }).catch((err) => {
        res.send(err);
    });

});
router.get("/categories/delete/:id", ensureLogin, (req, res) => {
    if (req.params.id) {
        BS.deleteCategoryById(req.params.id).then((data) => {
            res.redirect("/categories");
        }).catch((err) => {
            res.send(err);
        });
    } else {
        res.send({ code: 500, message: " Category not found" });
    }
});
router.get("/posts/add", ensureLogin, (req, res) => {
    BS.getCategories().then((data) => {
        res.render("addPost", { categories: data });
    }).catch((err) => {
        res.render("addPost", { categories: [] });
    });
});
router.post('/posts/add', ensureLogin, upload.single('featureImage'), function (req, res, next) {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;
        BS.addPost(req.body).then((data) => {
            res.redirect("/posts");
        }).catch((err) => {
            res.send(err);
        });
    }
});
router.get("/posts/:id", ensureLogin, (req, res) => {
    if (req.params.id)
        BS.getPostById(req.params.id).then((data) => {
            res.json({ data: data });
        }).catch((err) => {
            res.send(err);
        });
    else {
        res.render("404Error")
    }

});
router.get("/posts/delete/:id", ensureLogin, (req, res) => {
    if (req.params.id) {
        BS.deletePostById(req.params.id).then((data) => {
            res.redirect("/posts");
        }).catch((err) => {
            res.send(err);
        });
    } else {
        res.send({ code: 500, message: " Post not found" });
    }
});
BS.initialize().then(authData.initialize).then(() => {
    app.use(function (req, res, next) {
        let route = req.path.substring(1);
        app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
        app.locals.viewingCategory = req.query.category;
        next();
    });
    app.use('/', router);
    app.listen(HTTP_PORT);
    app.all('*', function (req, res) {
        res.render("404Error")
    });
}).catch((err) => {
    console.log("err", err);
})


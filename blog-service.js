const Sequelize = require('sequelize');
var sequelize = new Sequelize('kwvxlrvx', 'kwvxlrvx', 'mtBgoyIljaY3FXM9K7W0FhYSkn6zvTI6', {
    host: '	isilo.db.elephantsql.com ',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
});

var Category = sequelize.define('Category', {
    category: Sequelize.STRING,
});
Post.belongsTo(Category, { foreignKey: 'category' });

module.exports = class BlogSerice {
    initialize() {
        return new Promise(async (resolve, reject) => {
            sequelize.sync().then(function () {
                resolve()
            }).catch(() => {
                reject({
                    message: "something went wrong!"
                })
            });

        });
    }
    async getAllPosts() {
        return new Promise((resolve, reject) => {
            Post.findAll().then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts.sort((date1, date2) => new Date(date2.postDate) - new Date(date1.postDate)));
                }
                else {
                    reject("no results found")
                }
            }).catch(() => {
                reject("no results found")
            });
        });
    }
    async getPostsByCategory(category) {
        return new Promise((resolve, reject) => {
            Post.findAll({
                where: {
                    category: category
                }                
            }).then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts);
                }
                else {
                    reject("no results found")
                }
            }).catch(() => {
                reject("no results found")
            });
        });
    }
    async getPostsByMinDate(minDateStr) {
        return new Promise((resolve, reject) => {
            const { gte } = Sequelize.Op;
            Post.findAll({
                where: {
                    postDate: {
                        [gte]: new Date(minDateStr)
                    }
                }
            }).then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts.sort((date1, date2) => new Date(date2.postDate) - new Date(date1.postDate)));
                }
                else {
                    reject("no results found")
                }
            }).catch(() => {
                reject("no results found")
            });
        });
    }
    async getPostById(id) {
        return new Promise((resolve, reject) => {
            Post.findAll({
                where: {
                    id: id
                }
            }).then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts[0]);
                }
                else {
                    reject({ code: 404, message: "no results found" })
                }
            }).catch(() => {
                reject({ code: 404, message: "no results found" })
            });
        });
    }
    async getPublishedPosts() {
        return new Promise((resolve, reject) => {
            Post.findAll({
                where: {
                    published: true
                }
            }).then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts);
                }
                else {
                    reject({ code: 404, message: "no results found" })
                }
            }).catch(() => {
                reject({ code: 404, message: "no results found" })
            });
        });
    }
    async getCategories() {
        return new Promise((resolve, reject) => {
            Category.findAll().then(function (Category) {
                if (Category?.length > 0) {
                    resolve(Category);
                }
                else {
                    reject("no results returned")
                }
            }).catch(() => {
                reject("no results returned")
            });
        });
    }
    async addPost(postData) {
        return new Promise((resolve, reject) => {
            if (postData) {
                postData.published = (postData.published) ? true : false;
                for (const property in postData) {
                    if (postData[property] == undefined)
                        postData[property] = ""
                }
                postData.postDate = new Date();
                Post.create(postData)
                    .then(post => {
                        resolve(post)
                    })
                    .catch(error => {
                        reject({
                            code: 500,
                            message: "unable to create post"
                        })
                    });
            } else {
                reject({
                    code: 500,
                    message: "unable to create post"
                })
            }
        });
    }
    async getPublishedPostsByCategory(category) {
        return new Promise((resolve, reject) => {
            Post.findAll({
                where: {
                    published: true,
                    category: category
                }
            }).then(function (posts) {
                if (posts?.length > 0) {
                    resolve(posts);
                }
                else {
                    reject("no results returned")
                }
            }).catch(() => {
                reject("no results returned")
            });
        });
    }
    async addCategory(categoryData) {
        return new Promise((resolve, reject) => {
            if (categoryData) {
                for (const property in categoryData) {
                    if (categoryData[property] == undefined)
                        categoryData[property] = ""
                }
                Category.create(categoryData)
                    .then(Category => {
                        resolve(Category)
                    })
                    .catch(error => {
                        reject({
                            code: 500,
                            message: "unable to create Category"
                        })
                    });
            } else {
                reject({
                    code: 500,
                    message: "unable to create Category"
                })
            }
        })
    }
    async deleteCategoryById(id) {
        return new Promise((resolve, reject) => {
            Category.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                resolve("destroyed")
            }).catch(() => {
                reject({
                    code: 500,
                    message: "unable to Delete Category"
                })
            })
        })
    }
    async deletePostById(id) {
        return new Promise((resolve, reject) => {
            Post.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                resolve("destroyed")
            }).catch(() => {
                reject({ code: 500, message: "unable to Delete post" })
            })
        })
    }
}
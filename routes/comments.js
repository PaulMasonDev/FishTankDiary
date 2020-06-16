const express = require("express");
const router = express.Router({mergeParams: true});
const Post = require("../models/post");
const Comment = require("../models/comment");
const middleware = require("../middleware/");

// NEW ROUTE
router.get("/new", middleware.isLoggedIn, function(req, res){
    Post.findById(req.params.id, function(err, post) {
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {post: post});
        }
    });   
});

// CREATE ROUTE

// NEED TO FIGURE OUT TIMESTAMP FOR COMMENTS
router.post("/", middleware.isLoggedIn, function(req, res){
    Post.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
            res.redirect("/posts");
        } else {
            
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    post.comments.push(comment);
                    post.save();
                    req.flash("success", "You have created a new comment!");
                    res.redirect("/posts/" + post._id);
                }
            });
        }
    });  
});

// EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else {
            Post.findById(req.params.id, function(err, foundPost){
                if(err){
                    console.log(err);
                } else {
                    res.render("comments/edit", {post_id: req.params.id, comment:foundComment, post: foundPost});
                }
            })
        }
    });   
});

// UPDATE ROUTE

router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "You have updated your comment.");
            res.redirect("/posts/" + req.params.id);
        }
    });
});

// DESTROY ROUTE

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("error", "You have successfully deleted your comment");
            res.redirect("/posts/" + req.params.id);
        }
    });
});

module.exports = router;
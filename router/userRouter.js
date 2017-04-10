var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../models/userModel');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.route('/')
    .get( (req, res) => {
        
    })
    .post( (req, res) => {
        
    })
    .put( (req, res) => {
        
    })
    .delete( (req, res) => {
        
    })
    

module.exports = router;
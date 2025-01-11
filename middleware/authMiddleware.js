const axios = require('axios');
require('dotenv').config();
const logger = require('../logger');
const BASE_URL = process.env.BASE_URL;


exports.authenticateCookie = async (req, res, next) => {
    if (req.cookies.token) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/validate_token`, {},
                {
                    headers: {
                        'Authorization': `Bearer ${req.cookies.token}`
                    }
                }
            )

            req.decoded = response.data;

            next();
        } catch (error) {
            console.log(error);
            return res.redirect("/login");
        }
    } else {
        res.redirect("/login");
    }
}

exports.authenticateParamToken = async (token) => {
    if (token) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/validate_token`, {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            return response.data;
        } catch (error) {
            console.log(error);
            throw new Error("Invalid token");
        }
    } else {
        throw new Error("Token required");
    }
}
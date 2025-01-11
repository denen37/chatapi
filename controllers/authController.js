const path = require("path");
const axios = require('axios');
const logger = require('../logger');
require('dotenv').config();
const BASE_URL = process.env.BASE_URL;

exports.getLoginForm = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
}

exports.login = async (req, res) => {
    const { role } = req.body;

    try {
        const response = await axios.post(`${BASE_URL}/auth/${role}/login`, req.body)
        return res.status(200)
            .cookie('token', response.data.token)
            .redirect('/dashboard');
    } catch (error) {
        logger.error(error);
        return res.status(401).json({ error: 'Incorrect email or password' });
    }
}

exports.dashboard = async (req, res) => {
    const decoded = req.decoded;
    const { id, role } = decoded.payload;

    try {
        const response = await axios.get(`${BASE_URL}/${role}s/${id}`)
        res.status(201).render('dashboard', { user: response.data, partners: [] });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }

}
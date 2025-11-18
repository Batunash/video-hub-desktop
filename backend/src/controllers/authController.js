const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/auth');
const { db } = require('../services/mediaService');

async function register(req,res) {
    try{
        const {username, password} = req.body;
        if(!username || !password){
            return res.status(400).json({error:'username and password required '});
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        try{
            const existingUser= db.getUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            } catch (error) {
                //user does not exist, continue
            }

            //hash password
            const hashedPassword = await bcrypt.hash(password,12);

            const result = db.addUser(username,hashedPassword);
            const userId = register.lastInsertRowid;

            const token = generateToken(userId);
            res.status(201).json({
            message: 'User registered successfully',
            user: { id: userId, username },
            token
    });
    }catch(error){
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' })
    }
}
async function login(req,res) {
    try{
        const {username,password}= req.body;
        if(!username||!password){
            return res.status(400).json({ error: 'Username and password required' });
        }
        const user = db.getUserByUsername(username);
    
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt.compare(password,user.USER_PASSWORD);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.USER_ID);
        res.json({
            message: 'Login successful',
            user: { id: user.USER_ID, username: user.USER_NAME },
            token
        });

    }catch(error){
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

function getProfile(req,res){
    res.json({
        user: req.user
    });
}

module.exports={
    register,
    login,
    getProfile
};
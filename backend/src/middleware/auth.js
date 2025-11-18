const { veriftToken } = require('../config/auth');
const {db} = require('../services/mediaService');

function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token= authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({error:'acces token required'});
    }
    try{
        const decoded = veriftToken(token);
        const user = db.getUserById(decoded.user.Id);
        if(!user){
            return res.status(401).json({error:'Invalid token'});
        }
        req.user= {id: user.USER_ID, username: user.USER_NAME};
        next();
    }catch(error){
        return res.status(403).json({error:' Invalid or expired token'});
    }
}

function optionalAuth(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
        const decoded = verifyToken(token);
        const user = db.getUserById(decoded.userId);
        
        if (user) {
            req.user = { id: user.USER_ID, username: user.USER_NAME };
        }
        } catch (error) {
        // Token invalid but continue without user
        }
    }
  next();
}

module.exports={
    authenticateToken,
    optionalAuth
}



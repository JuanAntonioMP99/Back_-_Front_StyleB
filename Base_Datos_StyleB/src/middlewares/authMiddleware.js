import jwt from "jsonwebtoken"; 

const authMiddleware = (req,res,next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; 
    if (!token) {
        return res.status(401).json({ message: "Unauthorized"}); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded)=>{
        if(error){
            return res.status(401).json({ message: "invalid or expired token"})
        }

        req.user = decoded; 
        next(); 
    })
}; 

export default authMiddleware; 

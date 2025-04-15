import jwt, { JwtPayload } from "jsonwebtoken";

export const authMiddleware = (req: any, res: any, next: any) => {  
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)  as JwtPayload;
        req.userId = decoded.userId;
        next(); 
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }
};
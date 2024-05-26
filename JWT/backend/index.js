import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
const users = [
    {
      id: "1",
      username: "john",
      password: "John0908",
      isAdmin: true,
    },
    {
      id: "2",
      username: "jane",
      password: "Jane0908",
      isAdmin: false,
    },
  ];

let refreshTokens = [];

// refreshing tokens:
app.post("/api/refresh", (req, res) => {
    // take the refresh token from the user:
    const refreshToken = req.body.token;

    // send error if there is no token or it's invalid:
   if(!refreshToken) return res.status(401).json("You are not authenticated");
    if(!refreshTokens.includes(refreshToken)) {
        return res.status(403).json("Refresh Token is not valid!");
    } 
    jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.push(newRefreshToken);
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    });

    // if everything is ok create new acces token, refresh token and send to user
});


const generateAccessToken = (user)=>{
    return jwt.sign({id: user.id, isAdmin: user.isAdmin},
        "mySecretKey",
        {expiresIn: "15m"});
};

const generateRefreshToken = (user) => {
    return jwt.sign({id: user.id, isAdmin: user.isAdmin},
    "myRefreshSecretKey");
};

app.post("/api/login", (req, res) => {
   const {username, password} = req.body;
   const user = users.find(u => {
    return u.username === username && u.password === password;
   });
   if (user){
    // res.json(user);

    // Generate an access tokens: // sending payload
    // const accessToken = jwt.sign({id: user.id, isAdmin: user.isAdmin},
    //     "mySecretKey",
    //     {expiresIn: "15m"});
    //     res.json({
    //         username: user.username,
    //         isAdmin: user.isAdmin,
    //         accessToken,
    //     });

        const accessToken =  generateAccessToken(user);
        const refreshToken =  generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        // const refreshToken = jwt.sign({id: user.id, isAdmin: user.isAdmin},
        //     "myRefreshSecretKey",
        //     {expiresIn: "15m"});
        //     res.json({
        //         username: user.username,
        //         isAdmin: user.isAdmin,
        //         accessToken,
        //     });
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        });
   }
   else{
    res.status(400).json("Username or password incorrect");
   }
   //res.send("Hey it works");
});


// creating a verification function:
const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "mySecretKey", (err, user) =>{
            if (err){
                return res.status(403).json("Not a valid token");
            }
            req.user = user;
            next();
        });
    }else {
        res.status(401).json("No authentication!");
    }
};

app.delete("/api/users/:userId", verify, (req, res) => {
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json("User has been deleted.");
    } else {
        res.status(403).json("You are not allowed to delete this user!");
    }
});


// logout and invalidating token:
app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully.");
});

app.listen(5000, () => console.log('Server is running!'));
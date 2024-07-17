const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser'); 
const jwt = require('jsonwebtoken');
const cookies = require('cookie-parser');
const app = express();
const port = 3000;
const router = express.Router()

const corsOptions = {
    origin: 'http://localhost:4200',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(cookies());
app.use(bodyParser.json()); // Sử dụng body-parser để phân tích cú pháp dữ liệu JSON
app.use(bodyParser.urlencoded({ extended: true }));

//Connect Db
const URI = 'mongodb://127.0.0.1:27017/Ecommerce';
mongoose.connect(URI)
    .then(() => {
        console.log("Successfull");
    })
    .catch((err) => {
        console.error("Connection error:", err);
    });

const ProductSchema = new mongoose.Schema({
    name: String,
    rating: Number,
    oldPrice: Number,
    newPrice: Number,
    description: String,
    image: String,
    quantity: Number,
    category: String
})

const ProductModel = mongoose.model("products", ProductSchema)


// Table Cart
const CartSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    quantity: Number,
    total: Number,
})

const CartModel = mongoose.model("carts", CartSchema)

// Table Login
const LoginSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
})

const LoginModel = mongoose.model("logins", LoginSchema)

//Api Login

//Register
app.post('/register', async(req, res) => {
    var username = req.body.username
    var password = req.body.password
    var role = req.body.role

    LoginModel.findOne({
        username: username
    })
    .then( data => {
        if(data) {
            res.json("User nay da ton tai")
        } else {
            return LoginModel.create({
                username: username,
                password: password,
                role: role,
            })
        }
    })
    .then(data => {
        res.json("Tao tai khoan thanh cong")
    })
    .catch(error => {
        res.status(500).json('Tao tai khoan that bai')
    })
})

//Api đăng nhập
app.post('/login', (req, res, next) => {
    var username = req.body.username
    var password = req.body.password

    LoginModel.findOne({
        username: username,
        password: password
    })
    .then(data => {
        if(data) {
            var token = jwt.sign({
                _id: data._id,
                role: data.role
            }, 'mk');
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
            res.json({
                message:'Dang nhap thanh cong',
                token: token
            })
        } else {
            res.status(400).json('Account khong dung')
        }
    })
    .catch(err => {
        res.status(500).json('Co loi ben server')
    })
})

var checkLogin = (req, res, next) => {
    try {
        var token = req.cookies.token;
        if (!token) {
            return res.status(401).json('Chưa đăng nhập');
        }
        var idUser = jwt.verify(token, 'mk');
        LoginModel.findOne({
            _id: idUser
        })
        .then( data => {
            if(data) {
                // console.log(data);
                req.data = data
                next()
            } else {
                res.json('NOT PERMISSION')
            }
        })
        .catch(err => {
            res.status(500).json('Lỗi server');
        })
    } catch(err) {
        res.status(500).json('Token khong hop le')
    }
}

var checkUser = (req, res, next) => {
    var role = req.data.role
    if(role === 'admin' || role === 'user') {
        next()
    } else{
        res.json('NOT PERMISSION')
    } 
}

var checkAdmin = (req, res, next) => {
    var role = req.data.role
    if(role === 'admin') {
        next()
    } else {
        return res.json('NOT PERMISSION')
    }
}


//Api Cart
//add data
app.post('/addtocart', async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, ...cartData } = req.body;
    const cartItem = await CartModel.create(cartData);
    res.json(cartItem);
})

//getAll
app.get('/getAllCart', checkLogin, async(req, res) => {
    const cartItem = await CartModel.find({})
    res.json(cartItem)
})

//deleteItem - Api Cart
app.delete('/deleteItem/:id', async(req, res) => {
    const cartItem = await CartModel.findByIdAndDelete(req.params.id, req.body);
    res.json(cartItem);
})


// Api Product
app.get('/home', checkLogin, checkUser, async(req, res) => {
    const products = await ProductModel.find({})
    res.json(products);
})

// Lay ra 4 san pham co quantity thap nhat
app.get('/top-seller',checkLogin, async(req, res) => {
    // Sort tang dan
    const products = await ProductModel.find().sort({quantity:1}).limit(4);
    res.json(products);
})

app.post('/add', checkLogin,checkAdmin, async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, ...productData } = req.body;
    const product = await ProductModel.create(productData);
    res.json(product);
})

app.get('/searchByName', async(req, res) => {
    const name = req.query.name;
    // Tìm kiếm sản phẩm dựa trên tên (không phân biệt chữ hoa thường)
    const products = await ProductModel.find({ name: { $regex: name, $options: 'i' } });
    res.json(products);
})

app.get('/:id', async(req, res) => {
    const product = await ProductModel.findById(req.params.id);
    res.json(product);
})


app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
  })

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser'); 
const app = express();
const port = 3000;
const router = express.Router()

app.use(cors());
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
})

const LoginModel = mongoose.model("logins", LoginSchema)

//Api Login

//Register
app.post('/register', async(req, res) => {
    var username = req.body.username
    var password = req.body.password

    LoginModel.findOne({
        username: username
    })
    .then( data => {
        if(data) {
            res.json("User nay da ton tai")
        } else {
            return LoginModel.create({
                username: username,
                password: password
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
app.post('/login', (req, res) => {
    var username = req.body.username
    var password = req.body.password

    LoginModel.findOne({
        username: username,
        password: password
    })
    .then(data => {
        if(data) {
            res.json('Dang nhap thanh cong')
        } else {
            res.status(400).json('Account khong dung')
        }
    })
    .catch(err => {
        res.status(500).json('Co loi ben server')
    })
})


//Api Cart
//add data
app.post('/addtocart', async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, ...cartData } = req.body;
    const cartItem = await CartModel.create(cartData);
    res.json(cartItem);
})

//getAll
app.get('/getAllCart', async(req, res) => {
    const cartItem = await CartModel.find({})
    res.json(cartItem)
})

//deleteItem - Api Cart
app.delete('/deleteItem/:id', async(req, res) => {
    const cartItem = await CartModel.findByIdAndDelete(req.params.id, req.body);
    res.json(cartItem);
})


// Api Product
app.get('/', async(req, res) => {
    const products = await ProductModel.find({})
    res.json(products);
})

// Lay ra 4 san pham co quantity thap nhat
app.get('/top-seller', async(req, res) => {
    // Sort tang dan
    const products = await ProductModel.find().sort({quantity:1}).limit(4);
    res.json(products);
})

app.post('/add', async(req, res) => {
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

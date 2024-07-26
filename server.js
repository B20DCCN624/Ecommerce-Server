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
app.use(bodyParser.json()); 
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
    category: String,
    sold: {type: Number, default: 0}
})

const ProductModel = mongoose.model("products", ProductSchema)


// Table Cart
const CartSchema = new mongoose.Schema({
    id: String,
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

//Table OrderItem 
const OrderItemSchema = new mongoose.Schema( {
    id: String,
    name: String,
    price: Number,
    image: String,
})

const OrderItemModel = mongoose.model("orderItems", OrderItemSchema);

//Table order
const OrderSchema = new mongoose.Schema({
    fullname: String,
    address: String,
    city: String,
    phone: String,
    email: String,
    total: Number,
})

const OrderModel = mongoose.model("orders", OrderSchema)

//Table Review 
const ReviewSchema = new mongoose.Schema({
    name: String,
    image: String,
    comment: String,
})

const ReviewModel = mongoose.model("reviews", ReviewSchema)

//Api review
app.post('/review', async(req, res) => {
    const review = await ReviewModel.create(req.body)
    res.json(review)
})

app.get('/getAllReview', async(req, res) => {
    const review = await ReviewModel.find({})
    res.json(review)
})

//Api order
app.post('/order', async(req, res) => {
    const order = await OrderModel.create(req.body)
    res.json(order)
})

app.get('/getAllOrder', async(req, res) => {
    const order = await OrderModel.find({})
    res.json(order)
})

//Api orderItem
app.post('/addtoorder', async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, id, ...orderData } = req.body;

    const existingItem = await OrderItemModel.findOne({ id: id });
    if (existingItem) {
        return res.status(400).json({ message: 'Item with this _id already exists in the order.' });
    }
    const orderItem = await OrderItemModel.create({ id, ...orderData });
    res.json(orderItem);
})

// Api orderItem
app.get('/getOrderItemById/:id', async (req, res) => {
    const { id } = req.params;
    const orderItem = await OrderItemModel.findOne({ id: id });
    res.json(orderItem); 
});

//getAll
app.get('/getAllOrderItem', async(req, res) => {
    const orderItem = await OrderItemModel.find({})
    res.json(orderItem)
})

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

//getAllAccount 
app.get('/getAllAccount', async(req, res) => {
    const login = await LoginModel.find({})
    res.json(login)
})

// API lấy thông tin tài khoản hiện tại
app.get('/currentAccount', checkLogin, async (req, res) => {
    const user = req.data; 
    res.json(user);
});

app.delete('/deleteAccount/:id', async(req, res) => {
    const account = await LoginModel.findByIdAndDelete(req.params.id, req.body);
    res.json(account)
})


//Api Cart
//add data
app.post('/addtocart', async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, id, ...cartData } = req.body;
    const existingCartItem = await CartModel.findOne({id: id});
    if(existingCartItem) {
        existingCartItem.quantity += cartData.quantity;
        existingCartItem.total = existingCartItem.price * existingCartItem.quantity;
        await existingCartItem.save();
        return res.json(existingCartItem)
    } else {
        const cartItem = await CartModel.create({id, ...cartData});
        res.json(cartItem);
    }
})

app.get('/getCartItemById/:id', async(req, res) => {
    const { id } = req.params
    const cartItem = await CartModel.findOne({id: id})
    res.json(cartItem)
})

app.put('/updateCartItem/:id', async(req, res) => {
    const { id } = req.params
    const cartData = req.body

    const cartItem = await CartModel.findOneAndUpdate({ id: id }, cartData, { new: true });
    res.json(cartItem);
})

//getAll
app.get('/getAllCart', async(req, res) => {
    const cartItem = await CartModel.find({})
    res.json(cartItem)
})

//update cart
app.put('/updateCart', async(req, res) => {
    const {_id, quantity} = req.body;

    const cartItem = await CartModel.findByIdAndUpdate(
        _id,
        { quantity },
        { new:true },
    );
    res.json(cartItem);
})

//deleteItem - Api Cart
app.delete('/deleteItem/:id', async(req, res) => {
    const cartItem = await CartModel.findByIdAndDelete(req.params.id, req.body);
    res.json(cartItem);
})

//delete all data
app.delete('/clearCart', async(req, res) => {
    const result = await CartModel.deleteMany({});
    res.json({ message: 'All cart items have been cleared', result });
})


// Api Product
app.get('/home', async(req, res) => {
    const products = await ProductModel.find({})
    res.json(products);
})

// Lay ra 4 san pham co quantity thap nhat
app.get('/top-seller',checkLogin, async(req, res) => {
    // Sort tang dan
    const products = await ProductModel.find().sort({quantity:1}).limit(5);
    res.json(products);
})

app.get('/searchByName', async(req, res) => {
    const name = req.query.name;
    // Tìm kiếm sản phẩm dựa trên tên (không phân biệt chữ hoa thường)
    const products = await ProductModel.find({ name: { $regex: name, $options: 'i' } });
    res.json(products);
})

//update quantity product, sold product
app.put('/updateProductQuantity', async(req, res) => {
    const cartItems = req.body;
    for(const item of cartItems) {
        const product = await ProductModel.findById(item.id);
        if(product) {
            product.quantity -= item.quantity;
            product.sold += item.quantity;
            await product.save();
        }
    }
})

//admin
app.post('/add', checkLogin, checkAdmin, async(req, res) => {
    // Không bao gồm _id trong dữ liệu yêu cầu
    const { _id, ...productData } = req.body;
    const product = await ProductModel.create(productData);
    res.json(product);
})

//delete 
app.delete('/delete/:id', async(req, res) => {  
    const product = await ProductModel.findByIdAndDelete(req.params.id, req.body)
    res.json("Product deleted successfully");
})

//update
app.put('/update/:id', async(req, res) => {
    const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body)
    res.json(product);    
})        

//edit
app.get('/edit/:id', async(req, res) => {
    const product = await ProductModel.findById(req.params.id);
    res.json(product);
})

app.get('/detail/:id', async(req, res) => {
    const product = await ProductModel.findById(req.params.id);
    res.json(product);
})


app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
  })
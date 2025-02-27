const express = require('express');
const app = express();
const path = require('path');
const db = require('./connection');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { title } = require('process');
const { log } = require('console');
//configuration de la session
const sessionMiddleware = session({
    secret: 'mon_secret', resave: true, saveUninitialized: true, cookie: { secure: false }
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose a mal tourné!')

})
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));


items = [];
// route pour renvoyer le login
app.get('/login', (req, res) => {
    res.render('login', {
        title: "vibrapass-login"
    })
});
// route pour renvoyer le signup
app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'vibrapass-signup'
    })
});

// route pour renvoyer le new password
app.get('/newpassword', async (req, res) => {
    try {
        const itemsbd = await db.getPassWord(req.session.id_user);
        items = []
        itemsbd.forEach(element => {
            mObjet = {
                id: element.passwordsite,
                name: element.website,
            }
            items.push(mObjet)
        });
        res.render('newpassword', {
            title: "vibrapass-newpassword",
            items
        })
    } catch (error) {
        next(error)
    }

})

//route pour renvoyer le listedallpassword
app.get('/listedallpassword', async (req, res) => {
    try {
        const itemsbd = await db.getPassWord(req.session.id_user);
        items = []
        itemsbd.forEach(element => {
            mObjet = {
                id: element.passwordsite,
                name: element.website,
            }
            items.push(mObjet)
        });
        res.render('listedallpassword', {
            title: "vibrapass-listedallpassword",
            items
        })
    } catch (error) {
        next(error)
    }

});
// route pour recuperer dans le signup
app.post('/signup', async (req, res) => {
    try {
        const email = req.body.email;
        const name = req.body.nom;
        const secondname = req.body.postnom;
        const christname = req.body.prenom;
        const password = req.body.password;
        const sexe = req.body.sexe;
        const deleteUser = await db.deleteUser(email, password);
        if (deleteUser) {
            const status = await db.insertIntoDb(name, secondname, christname, email, password, sexe);
            if (status ==false) {
                console.log(status)
            }
            else {
                req.session.id_user = status.insertId;
                res.render('home', {
                    title: christname + " " + name,
                    img: christname + " " + name
                })
                console.log(status);
                
            }
        }
    } catch (error) {
        res.send(error)
        console.log(error)
    }

});
// route pour recuperer la page home
app.get('/home', (req, res) => {
    res.render('home', {
        title: "vibrapass-home",

    })
})
//route pour recuperer dans login
app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const status = await db.verifyUser(email, password);
      //  req.session.id_user = status[0].id_user;
        if (status.length !== 0) {
            console.log(status);
            res.render('home', {
                title: status[0].christ_name + " " + status[0].name_user,
                img: status[0].christ_name + " " + status[0].name_user,
            })
            
        }
        else {
            console.log(status);
            res.send(status)
        }

    } catch (error) {
        console.log(error);

    }

})

//route pour recuperer les new password
app.post('/newpass', async (req, res) => {
    try {
        const email = req.body.email;
        const websitelink = req.body.link;
        const category = req.body.category;
        const password = req.body.password;
        const status = await db.insertUserTemplate(email, websitelink, category, password, req.session.id_user)
        if (status) {
            const itemsbd = await db.getPassWord(req.session.id_user);
            items = []
            itemsbd.forEach(element => {
                mObjet = {
                    id: element.passwordsite,
                    name: element.website,
                }
                items.push(mObjet)
            });
            res.render('newpassword', {
                title: "vibrapass-newpassword",
                items
            })
        }
    } catch (error) {
        next(error)
    }
})
// route qui renvoi la page d'accueil(index)
app.get('/', (req, res) => {
    res.render('index',
        {
            title: 'Login'
        })
});


app.listen(3000, () => {
    console.log("serveur demarrer avec succès sur le port 3000")
})
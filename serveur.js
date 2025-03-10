const express = require('express');
const app = express();
const path = require('path');
const db = require('./connection');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { title } = require('process');
const { log } = require('console');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const nodemailer = require('nodemailer');
const { hostname } = require('os');
//configuration de la session
const sessionMiddleware = session({
    secret: 'mon_secret', resave: true, saveUninitialized: true, cookie: { secure: false}
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
sessions = [];
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
        console.log(itemsbd);

        itemsbd.forEach(element => {
            mObjet = {
                id: element.passwordsite,
                name: element.website,
                categorie: element.category,
                email: element.email
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
        if (password.length >= 9) {
            const deleteUser = await db.deleteUser(email);
            if (deleteUser) {
                const status = await db.insertIntoDb(name, secondname, christname, email, password, sexe);
                if (status == false) {
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
        } else {
            res.render('signup', {
                title: 'vibrapass-signup',
                message: 'le mot de passe doit avoir 9 chiffre(lettre) ou plus'
            })
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
        const status = await db.verifyUser(req.body.email, req.body.password);
        if (status != false) {
            req.session.id_user = status[0].id_user;
            res.render('home', {
                title: status[0].christ_name + " " + status[0].name_user,
                img: status[0].christ_name + " " + status[0].name_user,
            })
        }
        else {
            res.render('login', {
                title: 'vibrapass-login',
                erreur: 'Adresse Email ou Mot de passe incorrect'
            })
        }
    } catch (error) {
        console.log(error);
    }
})

// route pour aller dans la page de modification de mot de passe et envoyer mail
app.post('/setPassWord', async (req, res) => {
    const email = req.body.email;
    var result = await db.verifyUserEmail(req.body.email)
    req.session.email = req.body.email
    if (result.length != 0) {
        // Création du token
        const token =  jwt.sign({ email }, process.env.TOKEN, { expiresIn: '1h' });
        const response = db.sendMailToken(token, email);
        sessions.push(token)
        console.log(response);
    } else {
        res.render('setPassWord', {
            title: 'reinitilaisation de mot de passe',
            message: 'Adresse email non trouvable'
        })
    }
    console.log(sessions);
     
})

// verifier le token
app.get('/reset', (req, res) => {
    const token  = sessions[0];
    console.log(token);
    
    if (!token) {
        res.send('Token manquant');
    }
    else {
        jwt.verify(token, process.env.TOKEN, (err, decoded) => {
            if (err) {
                res.send('token invalide ou expire')
            }
            console.log(decoded);
            res.redirect(`/otherPassWord?email=${decoded.email}$token=${token}`);
        });
    }
});
//pour inserer un nouveau mot de passe
app.post('/otherPassWord', (req, res) => {

    const email = req.query.email;
    const token = req.query.token;
    console.log('Email:', email);
    console.log('Token:', token);
    const newPassword = req.body.password;
    console.log('newpass:', newPassword);
    try {
        db.setPassWord(newPassword,email);
        res.send('mot de passe reinitialisé avec succes.')
    } catch (error) {
        console.log(error)
        res.status(400).send('tokend invalide ou expiré.')
    }
    /*
        if ((req.body.password).length >= 9) {
            var result = await db.setPassWord(req.body.password, req.session.email)
            if (result) {
                res.render('login', {
                    title: 'vibrapass-login',
                    message: 'mot de passe reinitialiser avec succes'
                })
            }
        }
        else {
            res.render('otherPassWord', {
                title: 'reinitialisation de mot de passe',
                message: 'mot de passe doit containir 9 chiffres ou plus'
            })
        }*/
})
app.get('/otherPassWord', (req, res) => {
    res.render('otherPassWord', {
        title: 'vibrapass-New password'
    })
})
app.get('/setPassWord', (req, res) => {
    res.render('setPassWord', {
        title: 'reinitialisation de mot de passe'
    })
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
        res.render('login', {
            title: 'vibrapass-login',
            erreur: 'connectez vous à votre compte'
        })
        console.log("connectez-vous avant d'ajouter un nouveau mot de passe")
    }
})
//deconnexion

app.get('/logout', (req, res) => {

    if (req.session.id_user) {
        req.session.destroy((err) => {
            if (err) throw err
        })
        res.render('home', {
            title: 'vibrapass-home',
            message: 'deconnecter avec succès'
        })
    }
    else {
        res.render('home', {
            title: 'vibrapass-home',
            erreur: 'cette operation n\'abouti pas car vous n\'êtes pas connectés '
        })
    }
})
// route qui renvoi la page d'accueil(index)
app.get('/', (req, res) => {
    res.render('index',
        {
            title: 'Login'
        })
});

app.listen(3000, '0.0.0.0', () => {
    console.log("serveur demarrer avec succès sur le port 3000 et")
}) 
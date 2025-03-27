const express = require('express');
const app = express();
const path = require('path');
const db = require('./connexion');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { title } = require('process');
const { log, error } = require('console');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const nodemailer = require('nodemailer');
const { hostname } = require('os');
const { ifError } = require('assert');
//configuration de la session
const sessionMiddleware = session({
    secret: 'mon_secret', resave: false, saveUninitialized: true, cookie: { secure: false }
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose a mal tourné!')

})
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));


items = [];
sessions = [];

db.createTableUser();
db.createTableTemplate();/*
db.checkTableStructure('user');
db.checkTableStructure('template')
db.checkTableContent('template');
db.checkTableContent('user');*/
// route des visualisations
app.get('/api/data', async (req, res) => {
    try {
        const response = await db.selectAll();
        res.json(response)
    } catch (error) {
        res.send(error)
    }

})

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
        res.render('listedallpassword', {
            title: "vibrapass-listedallpassword",
        })
    } catch (error) {
        // next(error)
    }

});
app.get('/api/listedallpassword', async (req, res) => {
    try {
        const response = await db.getPassWord(req.session.id_user);
        res.json(response)
    } catch (error) {
        res.send(error)
    }

})
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
                    req.session.id_user = status.lastID;
                    res.render('home', {
                        title: christname + " " + name,
                        img: christname + " " + name,
                        message: 'Connecter avec succès'
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

        if (status != null) {
            req.session.id_user = status.id_user;
            res.render('home', {
                title: status.christname + " " + status.name,
                img: status.christname + " " + status.name,
                message: 'Connectez avec succès'
            })
        }
        else {
            res.render('login', {
                title: 'vibrapass-login',
                erreur: 'Adresse ou Mot de passe incorrect'
            })
        }
    } catch (error) {
        res.render('login', {
            title: 'vibrapass-login',
            erreur: 'Adresse Email ou Mot de passe incorrect'
        })
    }
})

// route pour aller dans la page de modification de mot de passe et envoyer mail
app.post('/setPassWord', async (req, res) => {
    const email = req.body.email;
    var result = await db.verifyUserEmail(req.body.email)
    req.session.email = req.body.email
    if (result) {
        // Création du token
        const token = jwt.sign({ email }, process.env.TOKEN, { expiresIn: '1h' });
        const response = await db.sendMailToken(token, email);
        sessions.push(token)
        if (response) {
            res.send(`
                <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Réinitialisation du mot de passe</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f9;
                                color: #333;
                                margin: 0;
                                padding: 0;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                            }
                            .container {
                                text-align: center;
                                padding: 20px;
                                background-color: #fff;
                                border-radius: 8px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                max-width: 600px;
                                width: 100%;
                            }
                            h1 {
                                color: #e74c3c;
                                font-size: 2rem;
                                margin-bottom: 15px;
                            }
                            h4 {
                                font-size: 1.2rem;
                                margin-bottom: 20px;
                            }
                            h3 {
                                font-size: 1.1rem;
                                color: #555;
                            }
                            a {
                                color: #3498db;
                                text-decoration: none;
                                font-weight: bold;
                            }
                            a:hover {
                                text-decoration: underline;
                            }
                            .button {
                                display: inline-block;
                                padding: 10px 20px;
                                margin-top: 20px;
                                background-color: #3498db;
                                color: white;
                                font-weight: bold;
                                text-decoration: none;
                                border-radius: 5px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            }
                            .button:hover {
                                background-color: #2980b9;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1><i class="fas fa-envelope"></i> Un Email contenant le lien qui vous permet de réinitialiser votre mot de passe vous a été envoyé</h1>
                            <h4>Cliquez sur ce lien pour accéder à la page de réinitialisation de votre mot de passe.</h4>
                            <h3>Une fois votre mot de passe modifié, revenez sur notre site et cliquez <a href="/login">ici</a> pour vous reconnecter et accéder à vos données.</h3>
                            <a href="/login" class="button">Se connecter</a>
                        </div>
                    </body>
                </html>
            `);
            console.log(response);
        } else {
            res.send(`
                <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Erreur d'envoi</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f9;
                                color: #333;
                                margin: 0;
                                padding: 0;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                            }
                            .container {
                                text-align: center;
                                padding: 20px;
                                background-color: #fff;
                                border-radius: 8px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                max-width: 600px;
                                width: 100%;
                            }
                            h1 {
                                color: #e74c3c;
                                font-size: 2rem;
                                margin-bottom: 15px;
                            }
                            h4 {
                                font-size: 1.2rem;
                                margin-bottom: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1><i class="fas fa-exclamation-circle"></i> Échec d'envoi de l'email</h1>
                            <h4>Veuillez vérifier votre connexion internet et réessayer.</h4>
                        </div>
                    </body>
                </html>
            `);
        }

    } else {
        res.render('setPassWord', {
            title: 'reinitilaisation de mot de passe',
            message: 'Adresse email non trouvable'
        })
    }

})
//modifier le mot de passe du template
app.post('/modifyPass', async (req, res) => {
    const newPassword = req.body.newPassword
    const email = req.body.email
    const oldpassword = req.body.oldPassword
    const website = req.body.website

    const result = await db.verifyPassEmail(email, oldpassword, website)
    if (req.session.id_user != undefined) {
        if (result.length != 0) {
            const mdfpass = await db.modifPassTemplate(oldpassword, newPassword, email, website)
            if (mdfpass) {
                res.json({
                    "success": true,
                    message: 'mot de passe modifier avec succes. Actualiser la page pour voir le modification',
                })
            }
        }
        else {
            res.json({
                "success": false,
                message: 'L\'Email, mot de passe ou website incorrecte!'
            })
        }
    }
    else {
        res.json({
            message: `Veillez vous connecter pour effectuer cette operation`,
        });
    }
})
//supprimer un mot de passe du template
app.post('/delete', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const website = req.body.website
    const result = await db.verifyPassEmail(email, password, website)
    console.log(website);
    if (req.session.id_user != undefined) {
        if (result.length != 0) {
            const mdfpass = await db.deletePassTemplate(email, password, website)
            if (mdfpass) {
                res.json({
                    "success": true,
                    message: 'mot de passe supprimer avec succes. Actualiser la page pour voir des modifications',
                })
            }
        }
        else {
            res.json({
                "success": false,
                message: 'L\'Email mot de passe ou website incorrecte',
            })
        }
    }
    else {
        res.json({
            message: `Veillez vous connecter pour effectuer cette operation`,
        });
    }
})
// verifier le token
app.get('/reset', (req, res) => {
    const token = sessions[0];

    if (!token) {
        res.send(`
            <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Erreur d'envoi</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                            background-color: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                            width: 100%;
                        }
                        h1 {
                            color: #e74c3c;
                            font-size: 2rem;
                            margin-bottom: 15px;
                        }
                        h4 {
                            font-size: 1.2rem;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1><i class="fas fa-exclamation-circle"></i> Lien invalide ou expire</h1>
                        <h4>Recommencer l'opération.</h4>
                    </div>
                </body>
            </html>
        `);
    }
    else {
        jwt.verify(token, process.env.TOKEN, (err, decoded) => {
            if (err) {
                res.send(`
                    <html lang="fr">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Erreur d'envoi</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    background-color: #f4f4f9;
                                    color: #333;
                                    margin: 0;
                                    padding: 0;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                    height: 100vh;
                                }
                                .container {
                                    text-align: center;
                                    padding: 20px;
                                    background-color: #fff;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                    max-width: 600px;
                                    width: 100%;
                                }
                                h1 {
                                    color: #e74c3c;
                                    font-size: 2rem;
                                    margin-bottom: 15px;
                                }
                                h4 {
                                    font-size: 1.2rem;
                                    margin-bottom: 20px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1><i class="fas fa-exclamation-circle"></i> Lien invalide ou expire</h1>
                                <h4>Recommencer l'opération.</h4>
                            </div>
                        </body>
                    </html>
                `);
            }
            const email = decoded.email

            res.redirect(`/otherPassWord?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);

        });
    }
});
//pour inserer un nouveau mot de passe
app.post('/otherPassWord', (req, res) => {
    const email = req.session.email;
    //const token = req.query.token;
    const newPassword = req.body.password;
    try {
        db.setPassWord(newPassword, email);
        res.send(`
            <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Erreur d'envoi</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                            background-color: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                            width: 100%;
                        }
                        h1 {
                            color: #e74c3c;
                            font-size: 2rem;
                            margin-bottom: 15px;
                        }
                        h4 {
                            font-size: 1.2rem;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1><i class="fas fa-exclamation-circle"></i> mot de passe reinitialisé avec succes.</h1>
                        <h4>Retourner à la page pour vous connecter.</h4>
                    </div>
                </body>
            </html>
        `);
    }
    catch (error) {
        console.log(error)
        res.status(400).res.send(`
            <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Erreur d'envoi</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                            background-color: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                            width: 100%;
                        }
                        h1 {
                            color: #e74c3c;
                            font-size: 2rem;
                            margin-bottom: 15px;
                        }
                        h4 {
                            font-size: 1.2rem;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1><i class="fas fa-exclamation-circle"></i> tokend invalide ou expiré.</h1>
                        <h4>Veuillez recommencer l'operation.</h4>
                    </div>
                </body>
            </html>
        `);
    }
}) 
app.get('/otherPassWord', (req, res) => {
    // Récupérer les paramètres 'email' et 'token' depuis l'URL
    req.session.email = req.query.email
    res.render('otherPassWord', {
        title: 'vibrapass - New password',
    });
});

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
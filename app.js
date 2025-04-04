const express = require('express');
const app = express();
const path = require('path');
const supabase = require('./connection');
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
const { console } = require('inspector');
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

app.get('/api/data', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('template') // Remplace par le nom de ta table
            .select('*');

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


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
    res.render('newpassword', {
        title: "vibrapass-newpassword"
    });
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
        const { data, error } = await supabase
            .from('template')
            .select('*')
            .eq('id_user', req.session.id_user);  // Assure-toi que chaque mot de passe est lié à un utilisateur

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        res.send(error.message);
    }
});


app.post('/signup', async (req, res) => {
    try {
        const { email, password, name, secondname, christname, sexe } = req.body;

        // Validation du mot de passe
        if (password.length < 9) {
            return res.render('signup', {
                title: 'vibrapass-signup',
                message: 'Le mot de passe doit avoir 9 caractères ou plus'
            });
        }

        // Crée un utilisateur via Supabase Auth
        const { user, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        // Si une erreur se produit pendant l'inscription
        if (authError) {
            // Log de l'erreur détaillée
            console.error('Erreur d\'authentification:', authError);
            return res.status(400).json({ message: authError.message });
        }

        // Log pour voir la réponse de Supabase après signUp
        console.log('Réponse de Supabase après signUp:', { user, authError });

        // Si l'utilisateur n'est pas créé correctement, loguer un message et renvoyer une erreur
        if (!user) {
            console.error('Aucun utilisateur trouvé après signUp');
            return res.status(400).json({ message: 'Utilisateur non créé correctement' });
        }

        // Essayer de se connecter immédiatement après l'inscription
        const { session, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        // Log de la réponse de Supabase après signIn
        console.log('Réponse de Supabase après signIn:', { session, signInError });

        // Si une erreur se produit lors de la connexion immédiate
        if (signInError) {
            console.error('Erreur lors de la connexion immédiate :', signInError.message);
            return res.status(400).json({ message: signInError.message });
        }

        // Vérifie si l'utilisateur est bien connecté et récupère l'ID
        if (session && session.user && session.user.id) {
            console.log('Utilisateur connecté avec ID :', session.user.id);
            return res.json({ userId: session.user.id });
        } else {
            console.error('Aucun utilisateur trouvé après la connexion');
            return res.status(400).json({ message: 'Impossible de récupérer l\'ID de l\'utilisateur' });
        }

    } catch (err) {
        // En cas d'erreur serveur, log l'erreur complète
        console.error('Erreur lors de l\'inscription:', err);  // Log complet de l'erreur
        res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
    }
});


/*
// route pour recuperer dans le signup
app.post('/signup', async (req, res) => {
    try {
        const { email, password, name, secondname, christname, sexe } = req.body;

        // Validation du mot de passe
        if (password.length < 9) {
            return res.render('signup', {
                title: 'vibrapass-signup',
                message: 'Le mot de passe doit avoir 9 caractères ou plus'
            });
        }

        // Crée un utilisateur via Supabase Auth
        const { user, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        console.log(user.id)
        res.json(user.id)
        return true
        if (authError) {
            console.error('Erreur d\'inscription : ', authError.message);
            throw error;
        }
        
        // Enregistre les détails dans la table 'user'
        const { data, error: dbError } = await supabase
            .from('utilisateur') // Nom de la table 'user'
            .insert([{
                id_utilisateur: user.UID,
                name,
                secondname,
                christname,
                email,
                sexe,
                password
            }]);

        if (dbError) {
            // Ajout d'un message d'erreur plus détaillé pour mieux diagnostiquer le problème
            console.error('Erreur lors de l\'insertion dans la table utilisateur:', dbError);
            return res.status(400).send(dbError.message);  // Envoi de l'erreur à l'utilisateur
        }

        // Associer l'ID utilisateur à la session
        req.session.id_user = data.id;

        // Renvoyer une réponse à l'utilisateur
        res.render('home', {
            title: christname + " " + name,
            img: christname + " " + name,
            message: 'Connecté avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur: verifier votre connexion', error);
        res.status(500).send(error.message);  // Envoi d'une erreur serveur
    }
});
*/
// route pour recuperer la page home
app.get('/home', (req, res) => {
    res.render('home', {
        title: "vibrapass-home",

    })
})
//route pour recuperer dans login
app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        // Authentification via le service 'auth' de Supabase
        const { data, error } = supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) {
            return res.render('login', {
                title: 'vibrapass-login',
                erreur: `Adresse ou mot de passe incorrect'${error}'`,
            });
        } else {
            // Si l'authentification réussit, tu peux récupérer l'ID de l'utilisateur
            req.session.id_user = auth.data.ID;

            // Rendu de la page d'accueil avec un message de succès
            res.render('home', {
                title: 'vibrapass-home',
                message: `Connecté avec succès '${auth.data.id}'`,
            });
        }


    } catch (error) {
        res.render('login', {
            title: 'vibrapass-login',
            erreur: `Une erreur est survenue. Veuillez réessayer plus tard.   '${error}'`,
        });
    }
});


// route pour aller dans la page de reinitialisation de mot de passe et envoyer mail
app.post('/setPassWord', async (req, res) => {
    const email = req.body.email;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        res.render('setPassWord', {
            title: 'Réinitialisation de mot de passe',
            message: 'Adresse email non trouvée',
        });
    } else {
        res.send(`
            <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Succes d'envoi d'Email</title>
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
                        <h1><i class="fas fa-exclamation-circle"></i> Email contenant un Lien de Reinitialisation Envoyé</h1>
                        <h4>Vous avez reçu un Email contenant le Lien de reinitialisation de votre mot de passe cliquer sur ce lien cela vous amenera vers une page où vous allez introduir le nouveau mot de passe.</h4>
                    </div>
                </body>
            </html>
        `);
    }
});

//modifier le mot de passe du template
app.post('/modifyPass', async (req, res) => {
    const { newPassword, email, oldPassword, website } = req.body;

    if (req.session.id_user.length != 0) {
        // Vérifie si l'email et le mot de passe (ancien) existent
        const { data, error } = await supabase
            .from('template')
            .select('*')
            .eq('email', email)
            .eq('website', website)
            .eq('id_user', req.session.id_user);  // Vérifier que c'est l'utilisateur connecté

        if (error) {
            return res.json({
                success: false,
                message: 'L\'Email, mot de passe ou website incorrecte!'
            });
        }

        if (data.length !== 0 && data[0].passwordsite === oldPassword) {
            // Mise à jour du mot de passe
            const { updateData, updateError } = await supabase
                .from('template')
                .update({ passwordsite: newPassword }) // Remplace 'password' par la colonne réelle du mot de passe
                .eq('email', email)
                .eq('website', website)
                .eq('id_user', req.session.id_user);

            if (updateError) {
                return res.json({
                    success: false,
                    message: 'modification de mot de passe echoué'
                });
            }

            return res.json({
                success: true,
                message: 'Mot de passe modifié avec succès. Actualiser la page pour voir les modifications.'
            });
        }

        return res.json({
            success: false,
            message: 'Mot de passe ancien incorrect.'
        });
    }

    return res.json({
        message: 'Veuillez vous connecter pour effectuer cette opération.',
    });
});

//supprimer un mot de passe du template
app.post('/delete', async (req, res) => {
    const { email, password, website } = req.body;
    if (req.session.id_user.length != 0) {
        // Vérifie si l'email, le mot de passe et le site existent
        const { data, error } = await supabase
            .from('template')
            .select('*')
            .eq('email', email)
            .eq('website', website)
            .eq('id_user', req.session.id_user);

        if (error) {
            return res.json({
                success: false,
                message: 'L\'Email, mot de passe ou website incorrecte'
            });
        }

        if (data.length !== 0 && data[0].passwordsite === password) {
            // Supprimer le mot de passe
            const { deleteData, deleteError } = await supabase
                .from('template')
                .delete()
                .eq('email', email)
                .eq('website', website)
                .eq('id_user', req.session.id_user);

            if (deleteError) {
                return res.json({
                    success: false,
                    message: 'erreur lors de la suppression'
                });
            }

            return res.json({
                success: true,
                message: 'Mot de passe supprimé avec succès. Actualiser la page pour voir les modifications.'
            });
        }

        return res.json({
            success: false,
            message: 'L\'Email, mot de passe ou website incorrecte'
        });
    }

    return res.json({
        message: 'Veuillez vous connecter pour effectuer cette opération.',
    });
});

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
app.post('/otherPassWord', async (req, res) => {
    const { password } = req.body;
    const email = req.session.email;
    const updatePassword = async (newPassword, accessToken) => {
        const { data, error } = await supabase.auth.api.updateUser(accessToken, {
            password: newPassword,
        });

        if (error) {
            console.error('Erreur lors de la mise à jour du mot de passe:', error.message);
        } else {
            console.log('Mot de passe mis à jour avec succès:', data);
            // L'utilisateur peut maintenant se connecter avec le nouveau mot de passe
        }
    };

    // Exemple d'appel avec un nouveau mot de passe et le token d'accès
    updatePassword('new-password123', 'access-token-from-url');

    /*
    try {
        // Ajouter un nouveau mot de passe dans la table 'passwords'
        const { data, error } = await supabase
            .from('template')
            .insert([
                { email, password, user_id: req.session.id_user }
            ]);

        if (error) {
            return res.json({
                success: false,
                message: error.message
            });
        }

        // Une fois ajouté, récupérer tous les mots de passe de l'utilisateur pour afficher la liste mise à jour
        const { data: itemsData, error: itemsError } = await supabase
            .from('template')
            .select('passwordsite, website')
            .eq('user_id', req.session.id_user);

        if (itemsError) {
            return res.json({
                success: false,
                message: itemsError.message
            });
        }

        const items = itemsData.map(element => ({
            id: element.passwordsite,
            name: element.website,
        }));

        res.render('newpassword', {
            title: "vibrapass-newpassword",
            items
        });
    } catch (error) {
        res.render('login', {
            title: 'vibrapass-login',
            erreur: 'Connectez-vous avant d\'ajouter un nouveau mot de passe'
        });
    }*/
});

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
        const { email, link, category, password } = req.body;
        if (req.session.id_user.length = 0) {
            res.render('login', {
                title: 'vibrapass-login',
                erreur: 'Connectez-vous avant d\'ajouter un nouveau mot de passe'
            });
        }
        else {
            // Insérer un mot de passe dans la table 'passwords'
            const { data, error } = await supabase
                .from('template')
                .insert([
                    { email, website: link, category, passwordsite: password, id_user: req.session.id_user }
                ]);

            if (error) {
                return res.json({
                    success: false,
                    message: error.message
                });
            }
            res.render('newpassword', {
                title: "vibrapass-newpassword",
            });
        }
    } catch (error) {
        res.render('login', {
            title: 'vibrapass-login',
            erreur: 'Connectez-vous avant d\'ajouter un nouveau mot de passe'
        });
    }
});

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

module.exports = app;
app.listen(3000, '0.0.0.0', () => {
    console.log("serveur demarrer avec succès sur le port 3000 et")
}) 
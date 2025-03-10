const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

require('dotenv').config();
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vibrachat',
    connectTimeout: 10000,
})
connection.connect((err) => {
    if (err) {
        console.error('erreur de connexion: ' + err.stack);
        return;
    }
    console.log('connecté en tant que ID' + connection.threadId);
});

const selectAll = () => {
    return new Promise((resolve, reject) => {
        connection.query('select *  from user', (err, results) => {
            if (err) {
                return reject(err)
            }
            resolve(results);
        });
    });
};
const insertIntoDb = (name, secondname, christname, email, password, sexe) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.log('erreur lors du hashage de mot de passe', err);
                return;
            }
            password = hash;

            var request = `INSERT INTO user(name_user,second_name,christ_name,email,password,sexe) VALUES('${name}', '${secondname}', '${christname}', '${email}', '${password}','${sexe}')`;
            connection.query(request, (err, results) => {
                if (err) {
                    console.log("une erreur s'est produite", err);
                    reject(false);
                } else {
                    console.log("envoi reuçu!!");
                    resolve(results);
                }
            });
        });


    });
};
const verifyUser = (email, password) => {
    try {
        var request = `SELECT * FROM user WHERE email = '${email}'`;
        return new Promise((resolve, reject) => {
            connection.query(request, (err, results) => {
                if (err) {
                    reject(err)
                    console.log('erreur lors de la verification dans la base de données', err);
                } else {
                    bcrypt.compare(password, results[0].password, function (err, result) {
                        if (err) {
                            console.log('Erreur lors de la comparaison', err);
                        }
                        else {
                            if (result) {
                                resolve(results);
                            }
                            else {
                                resolve(result)
                            }
                        }

                    })
                }
            })
        })
    } catch (error) {

    }
};
/*
const getIdentity = (email, password) => {
    const request = `SELECT name_user,second_name WHERE email ='${email}' AND password = '${password}'`;
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}*/
const deleteUser = (email) => {
    const request = `DELETE FROM user WHERE email = '${email}'`
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                console.log(err);
                reject(false)
            }
            else {
                resolve(true)
            }
        })
    })
}
const getPassWord = (id_user = 2) => {
    const request = `SELECT * FROM template where id_user = '${id_user}'`;
    return new Promise((resolve, reject) => {
        connection.query(request, (err, results) => {
            if (err) {
                console.log(err)
                reject(false)
            } else {
                resolve(results)
            }
        })
    })
}
const insertUserTemplate = (email, website, category, passwordsite, id_user) => {
    return new Promise((resolve, reject) => {
        const request = `INSERT INTO template(email,website,category,passwordsite,id_user) VALUES('${email}','${website}','${category}','${passwordsite}','${id_user}')`
        connection.query(request, (err, results) => {
            if (err) {
                reject(false)
                //console.log(err)
            }
            else {
                resolve(true)
            }
        })

    })
};
const verifyUserEmail = (email) => {
    try {
        const request = `SELECT email from user WHERE email = '${email}'`;
        return new Promise((resolve, reject) => {
            connection.query(request, (error, results) => {
                if (error) {
                    reject(false)
                } else {
                    resolve(results)
                }
            })
        })
    } catch (error) {

    }
}
const deconnexion = (session) => {
    if (session) {
        session.destroy((err) => {
            if (err) throw err
            return true
        })
    }
}
const setPassWord = (password, email) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.log('erreur lors du hashage de mot de passe', err);
                return;
            }
            password = hash;
            const request = `update user set password = '${password}' where email = '${email}'`
            connection.query(request, (error, results) => {
                if (error) {
                    console.log(error);
                    reject(false)
                }
                else {
                    resolve(true)
                }
            })
        })
    }
    )
}
const sendMailToken = (token, email) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: "vibraniumrdc@gmail.com",
                pass: "yfxtcyydrmmhyznc",
            },
        });
        const resetLink = `http://192.168.43.103:3000/reset?token='${token}'`;
        try {
            // Envoi de l'email avec l'objet de transport défini
            const info = transporter.sendMail({
                from: 'vibraniumrdc@gmail.com', // adresse de l'expéditeur
                to: email,
                subject: 'Renitialisation du mot de passe',
                text: `Cliquez sur ce lien pour reinitialiser votre mot de passe:${resetLink}`,
            });
            console.log("Email envoyé ");
            return true
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email : ", error);
            return false
        }
    } catch (error) {
        throw new error
    }
}

module.exports = {
    selectAll,
    insertIntoDb,
    verifyUser,
    //getIdentity,
    deleteUser,
    getPassWord,
    insertUserTemplate,
    verifyUserEmail,
    setPassWord,
    deconnexion,
    sendMailToken
}
